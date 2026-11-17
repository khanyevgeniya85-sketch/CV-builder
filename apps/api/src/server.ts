import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { storage } from './storage.js';
import {
  runAiGeneration,
  runCoverLetterGeneration,
  runRecommendationLetterGeneration,
} from './ai-service.js';
import { checkResumeCompleteness, generateExportFileName, ExportFormat, ResumeData } from '@cvb/shared';

dotenv.config();

const fastify = Fastify({
  logger: false,
});

await fastify.register(cors, {
  origin: true,
  credentials: true,
});

await fastify.register(cookie, {
  secret: process.env.SESSION_SECRET || 'cv-builder-dev-secret-32-bytes-minimum-length!',
});

await fastify.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Session middleware helper
function getOrCreateSessionId(req: any, reply: any): string {
  let sid = req.cookies.sid || req.headers['x-session-id'];
  if (!sid) {
    sid = crypto.randomUUID();
    reply.setCookie('sid', sid, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 90 * 24 * 60 * 60,
    });
  }
  return sid;
}

// ----------------------------------------------------
// 1. Session
// ----------------------------------------------------
fastify.post('/api/v1/session', async (req, reply) => {
  const sid = getOrCreateSessionId(req, reply);
  return {
    sessionId: sid,
    userId: null,
    isAnonymous: true,
  };
});

// ----------------------------------------------------
// 2. Resumes CRUD
// ----------------------------------------------------
fastify.get('/api/v1/resumes', async (req, reply) => {
  const sid = getOrCreateSessionId(req, reply);
  const list = storage.listResumes(sid);
  return list;
});

fastify.post('/api/v1/resumes', async (req, reply) => {
  const sid = getOrCreateSessionId(req, reply);
  const body = (req.body as any) || {};
  const stored = storage.createResume(sid, { language: body.language || 'ru' });
  reply.code(201);
  return {
    id: stored.id,
    version: stored.version,
    data: stored.data,
  };
});

fastify.get('/api/v1/resumes/:id', async (req, reply) => {
  const { id } = req.params as { id: string };
  const stored = storage.getResume(id);
  if (!stored) {
    reply.code(404);
    return { error: { code: 'NOT_FOUND', message: 'Резюме не найдено' } };
  }
  return {
    id: stored.id,
    version: stored.version,
    data: stored.data,
    photoUrl: stored.data.personal?.photoUrl,
  };
});

fastify.patch('/api/v1/resumes/:id', async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = req.body as { version?: number; patch?: any };

  if (!body || !body.patch) {
    reply.code(400);
    return { error: { code: 'VALIDATION_ERROR', message: 'Отсутствует patch' } };
  }

  const result = storage.updateResume(id, body.patch, body.version as number);
  if (result.conflict) {
    reply.code(409);
    return {
      error: {
        code: 'VERSION_CONFLICT',
        message: 'Данные были изменены на сервере',
        currentVersion: result.conflict.version,
        currentData: result.conflict.data,
      },
    };
  }

  if (!result.updated) {
    reply.code(404);
    return { error: { code: 'NOT_FOUND', message: 'Резюме не найдено' } };
  }

  return {
    version: result.updated.version,
    updatedAt: result.updated.updatedAt,
  };
});

fastify.delete('/api/v1/resumes/:id', async (req, reply) => {
  const { id } = req.params as { id: string };
  storage.deleteResume(id);
  reply.code(204);
  return null;
});

fastify.post('/api/v1/resumes/:id/duplicate', async (req, reply) => {
  const sid = getOrCreateSessionId(req, reply);
  const { id } = req.params as { id: string };
  const duplicated = storage.duplicateResume(id, sid);
  if (!duplicated) {
    reply.code(404);
    return { error: { code: 'NOT_FOUND', message: 'Резюме не найдено' } };
  }
  reply.code(201);
  return { id: duplicated.id };
});

// ----------------------------------------------------
// 3. Photo Upload & Delete
// ----------------------------------------------------
fastify.post('/api/v1/resumes/:id/photo', async (req, reply) => {
  const { id } = req.params as { id: string };
  const stored = storage.getResume(id);
  if (!stored) {
    reply.code(404);
    return { error: { code: 'NOT_FOUND', message: 'Резюме не найдено' } };
  }

  try {
    let photoDataUri = '';

    // Check if multipart file or json with dataUrl
    if (req.isMultipart()) {
      const data = await req.file();
      if (!data) {
        reply.code(400);
        return { error: { code: 'VALIDATION_ERROR', message: 'Файл не передан' } };
      }
      const buffer = await data.toBuffer();
      const mime = data.mimetype || 'image/jpeg';
      photoDataUri = `data:${mime};base64,${buffer.toString('base64')}`;
    } else {
      const body = req.body as { dataUrl?: string };
      if (!body || !body.dataUrl) {
        reply.code(400);
        return { error: { code: 'VALIDATION_ERROR', message: 'Отсутствует dataUrl' } };
      }
      photoDataUri = body.dataUrl;
    }

    stored.data.personal.photoUrl = photoDataUri;
    stored.data.personal.photoKey = `photo-${id}`;
    storage.updateResume(id, { personal: stored.data.personal }, stored.version);

    return {
      photoKey: stored.data.personal.photoKey,
      photoUrl: photoDataUri,
    };
  } catch (err: any) {
    reply.code(500);
    return { error: { code: 'UNSUPPORTED_MEDIA', message: err.message } };
  }
});

fastify.delete('/api/v1/resumes/:id/photo', async (req, reply) => {
  const { id } = req.params as { id: string };
  const stored = storage.getResume(id);
  if (stored) {
    stored.data.personal.photoUrl = undefined;
    stored.data.personal.photoKey = undefined;
    storage.updateResume(id, { personal: stored.data.personal }, stored.version);
  }
  reply.code(204);
  return null;
});

// ----------------------------------------------------
// 4. AI Endpoints (SSE, check, usage)
// ----------------------------------------------------
fastify.post('/api/v1/resumes/:id/ai/generate', async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = (req.body as any) || {};

  reply.raw.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
  reply.raw.setHeader('Connection', 'keep-alive');
  reply.raw.setHeader('X-Accel-Buffering', 'no');

  const sendEvent = (event: string, data: any) => {
    reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  await runAiGeneration(
    id,
    { tone: body.tone, language: body.language },
    {
      onEvent: (event, data) => sendEvent(event, data),
      onError: (err) => {
        sendEvent('error', err);
        reply.raw.end();
      },
      onDone: () => {
        reply.raw.end();
      },
    }
  );
});

fastify.post('/api/v1/resumes/:id/ai/cover-letter', async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = (req.body as any) || {};
  try {
    return await runCoverLetterGeneration(id, body);
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') {
      reply.code(404);
      return { error: { code: 'NOT_FOUND', message: 'Резюме не найдено' } };
    }
    reply.code(500);
    return { error: { code: 'AI_PROVIDER_ERROR', message: err.message } };
  }
});

fastify.post('/api/v1/resumes/:id/ai/recommendation-letter', async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = (req.body as any) || {};
  try {
    return await runRecommendationLetterGeneration(id, body);
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') {
      reply.code(404);
      return { error: { code: 'NOT_FOUND', message: 'Резюме не найдено' } };
    }
    reply.code(500);
    return { error: { code: 'AI_PROVIDER_ERROR', message: err.message } };
  }
});

fastify.post('/api/v1/resumes/:id/ai/check', async (req, reply) => {
  const { id } = req.params as { id: string };
  const stored = storage.getResume(id);
  if (!stored) {
    reply.code(404);
    return { error: { code: 'NOT_FOUND', message: 'Резюме не найдено' } };
  }

  const issues = checkResumeCompleteness(stored.data);
  return { issues };
});

fastify.get('/api/v1/resumes/:id/ai/usage', async (req, reply) => {
  const { id } = req.params as { id: string };
  return storage.getAiUsage(id);
});

// Pure-JS CRC32 & Store ZIP builder for Application Kit downloads
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function buildZipArchive(files: Array<{ name: string; content: string }>): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, 'utf-8');
    const dataBuf = Buffer.from(file.content, 'utf-8');
    const crc = crc32(dataBuf);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6); // UTF-8 flag
    localHeader.writeUInt16LE(0, 8); // store
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(dataBuf.length, 18);
    localHeader.writeUInt32LE(dataBuf.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuf, dataBuf);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(dataBuf.length, 20);
    centralHeader.writeUInt32LE(dataBuf.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + dataBuf.length;
  }

  const centralSize = centralParts.reduce((s, b) => s + b.length, 0);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(files.length, 8);
  endRecord.writeUInt16LE(files.length, 10);
  endRecord.writeUInt32LE(centralSize, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, endRecord]);
}

function formatResumeMarkdown(data: ResumeData): string {
  const lines: string[] = [];
  lines.push(`# ${data.personal.fullName || 'Кандидат'}`);
  lines.push(`**${data.personal.position || ''}**`);
  const city = data.personal.address?.city || data.personal.city || '';
  if (city) lines.push(`Локация: ${city}`);
  lines.push(`Контакты: ${[data.contacts.phone, data.contacts.email, data.contacts.telegram].filter(Boolean).join(' · ')}`);
  if (data.ai?.summary) {
    lines.push('', '## О себе', data.ai.summary);
  }
  if (data.experience?.length) {
    lines.push('', '## Опыт работы');
    for (const e of data.experience) {
      lines.push(`### ${e.role} — ${e.company} (${e.startDate} — ${e.endDate || 'н.в.'})`);
      const bullets = e.useAi && e.aiBullets?.length ? e.aiBullets : e.rawDescription.split('\n').filter(Boolean);
      for (const b of bullets) lines.push(`- ${b}`);
    }
  }
  if (data.education?.length) {
    lines.push('', '## Образование');
    for (const ed of data.education) {
      lines.push(`- ${ed.institution} — ${ed.specialty} (${ed.graduationYear})`);
    }
  }
  if (data.skills?.hard?.length) {
    lines.push('', '## Навыки', data.skills.hard.map(s => s.name).join(', '));
  }
  return lines.join('\n');
}

// ----------------------------------------------------
// 5. Exports
// ----------------------------------------------------
fastify.post('/api/v1/resumes/:id/export', async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = (req.body as { format?: ExportFormat }) || {};
  const stored = storage.getResume(id);
  if (!stored) {
    reply.code(404);
    return { error: { code: 'NOT_FOUND', message: 'Резюме не найдено' } };
  }

  const format: ExportFormat = body.format || 'pdf-desktop';
  const exportItem = storage.createExport(id, format);

  setTimeout(() => {
    const fileName = generateExportFileName(
      stored.data.personal?.fullName || '',
      stored.data.personal?.position || '',
      format
    );
    storage.updateExport(exportItem.id, {
      status: 'done',
      fileName,
      url: `/api/v1/exports/${exportItem.id}/download`,
    });
  }, 500);

  reply.code(202);
  return { exportId: exportItem.id };
});

fastify.get('/api/v1/exports/:id', async (req, reply) => {
  const { id } = req.params as { id: string };
  const item = storage.getExport(id);
  if (!item) {
    reply.code(404);
    return { error: { code: 'NOT_FOUND', message: 'Экспорт не найден' } };
  }
  return item;
});

fastify.get('/api/v1/exports/:id/download', async (req, reply) => {
  const { id } = req.params as { id: string };
  const item = storage.getExport(id);
  if (!item) {
    reply.code(404);
    return { error: { code: 'NOT_FOUND', message: 'Экспорт не найден' } };
  }
  const stored = storage.getResume(item.resumeId);
  if (!stored) {
    reply.code(404);
    return { error: { code: 'NOT_FOUND', message: 'Резюме не найдено' } };
  }

  if (item.format === 'zip-kit') {
    const files: Array<{ name: string; content: string }> = [
      { name: '01_Resume.md', content: formatResumeMarkdown(stored.data) },
    ];
    if (stored.data.documents?.coverLetter?.body) {
      files.push({
        name: '02_Cover_Letter.txt',
        content: stored.data.documents.coverLetter.body,
      });
    }
    if (stored.data.documents?.recommendationLetter?.body) {
      files.push({
        name: '03_Recommendation_Letter.txt',
        content: stored.data.documents.recommendationLetter.body,
      });
    }
    const zipBuffer = buildZipArchive(files);
    reply.header('Content-Type', 'application/zip');
    reply.header('Content-Disposition', `attachment; filename="${item.fileName || 'Application_Kit.zip'}"`);
    return reply.send(zipBuffer);
  }

  // Fallback printable HTML response for direct download
  const docType =
    item.format === 'pdf-cover-letter'
      ? 'cover'
      : item.format === 'pdf-recommendation'
      ? 'recommendation'
      : 'cv';
  const viewMode = item.format === 'pdf-mobile' || item.format === 'png-mobile' ? 'mobile' : 'desktop';
  const renderUrl = `/render/${stored.id}?doc=${docType}&format=${viewMode}&autoprint=1`;
  return reply.redirect(renderUrl);
});

// Render data route for Puppeteer or iframe printing
fastify.get('/api/v1/render-data/:id', async (req, reply) => {
  const { id } = req.params as { id: string };
  const stored = storage.getResume(id);
  if (!stored) {
    reply.code(404);
    return { error: { code: 'NOT_FOUND', message: 'Резюме не найдено' } };
  }
  return {
    data: stored.data,
    photoUrl: stored.data.personal?.photoUrl,
  };
});

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

try {
  await fastify.listen({ port: PORT, host: HOST });
  console.log(`[API] Server listening on http://localhost:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
