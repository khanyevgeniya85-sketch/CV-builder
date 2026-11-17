import { SKILLS_DICTIONARY, RecommendationRelationship } from '@cvb/shared';
import {
  prepareAiInput,
  validateAiOutput,
  generateMockAiResponse,
  generateMockCoverLetter,
  generateMockRecommendationLetter,
  getSystemPrompt,
  getCoverLetterSystemPrompt,
  getRecommendationLetterSystemPrompt,
  SUBMIT_RESUME_TOOL,
  SUBMIT_COVER_LETTER_TOOL,
  SUBMIT_RECOMMENDATION_LETTER_TOOL,
} from '@cvb/ai-prompts';
import { storage } from './storage.js';
import Anthropic from '@anthropic-ai/sdk';

export interface StreamCallbacks {
  onEvent: (event: string, data: any) => void;
  onError: (error: any) => void;
  onDone: () => void;
}

export async function runAiGeneration(
  resumeId: string,
  options: { tone?: 'neutral' | 'confident' | 'creative'; language?: any },
  callbacks: StreamCallbacks
) {
  const stored = storage.getResume(resumeId);
  if (!stored) {
    callbacks.onError({ code: 'NOT_FOUND', message: 'Резюме не найдено' });
    return;
  }

  const resume = stored.data;
  if (options.tone) resume.ai.tone = options.tone;
  if (options.language) resume.language = options.language;

  const preparedInput = prepareAiInput(resume);

  const hasPosition = Boolean(resume.personal?.position?.trim());
  const hasRawExp = resume.experience?.some(e => e.rawDescription?.trim());
  const hasRawProj = resume.projects?.some(p => p.rawDescription?.trim());
  const hasSkills = (resume.skills?.hard?.length || 0) > 0;

  if (!hasPosition || (!hasRawExp && !hasRawProj && !hasSkills)) {
    callbacks.onError({
      code: 'AI_INSUFFICIENT_INPUT',
      message: 'Для редактирования нужна должность и хотя бы одно место работы, проект или навыки',
    });
    return;
  }

  if (!storage.incrementAiUsage(resumeId)) {
    callbacks.onError({
      code: 'AI_LIMIT_REACHED',
      message: 'Превышен дневной лимит генераций (20 в сутки)',
    });
    return;
  }

  try {
    // 1. Stage: Skills normalization
    callbacks.onEvent('stage', { stage: 'skills' });

    const normalizedHard = (resume.skills?.hard || []).map(skill => {
      const lower = skill.name.toLowerCase().trim();
      const canon = SKILLS_DICTIONARY.synonyms[lower] || skill.name;
      return { ...skill, name: canon };
    });

    callbacks.onEvent('skills', {
      hard: normalizedHard,
      soft: resume.skills?.soft || [],
    });

    // 2. Stage: Content & Audit generation
    callbacks.onEvent('stage', { stage: 'content' });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const provider = process.env.AI_PROVIDER || (apiKey ? 'anthropic' : 'mock');

    let aiResult: any;

    if (provider === 'anthropic' && apiKey) {
      const anthropic = new Anthropic({ apiKey });
      const systemPrompt = getSystemPrompt(resume.language, resume.ai.tone, resume.personal.position);

      const response = await anthropic.messages.create({
        model: process.env.AI_MODEL_MAIN || 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        system: systemPrompt,
        tools: [SUBMIT_RESUME_TOOL as any],
        tool_choice: { type: 'tool', name: 'submit_resume' },
        messages: [{ role: 'user', content: JSON.stringify(preparedInput) }],
      });

      const toolUse = response.content.find(c => c.type === 'tool_use');
      if (toolUse && 'input' in toolUse) {
        aiResult = toolUse.input;
      } else {
        aiResult = generateMockAiResponse(preparedInput);
      }
    } else {
      await new Promise(r => setTimeout(r, 450));
      aiResult = generateMockAiResponse(preparedInput);
    }

    const validation = validateAiOutput(preparedInput, aiResult);

    // Stream summary
    if (aiResult.summary) {
      await new Promise(r => setTimeout(r, 200));
      callbacks.onEvent('summary', { text: aiResult.summary });
      resume.ai.summary = aiResult.summary;
    }

    // Stream experience blocks
    if (aiResult.experience && resume.experience) {
      for (const expItem of resume.experience) {
        const matchingInput = preparedInput.experience.find(
          e => e.company === expItem.company || e.role === expItem.role
        );
        const ref = matchingInput?.ref;
        const matchingOutput = aiResult.experience.find((e: any) => e.ref === ref);

        if (matchingOutput && matchingOutput.bullets) {
          await new Promise(r => setTimeout(r, 250));
          const notes = validation.notesByRef[matchingOutput.ref] || ['перевёл в достижения'];
          expItem.aiBullets = matchingOutput.bullets;
          expItem.highlights = matchingOutput.highlights || [0];
          expItem.useAi = true;
          expItem.notes = notes;

          callbacks.onEvent('experience', {
            itemId: expItem.id,
            bullets: expItem.aiBullets,
            highlights: expItem.highlights,
            notes,
          });
        }
      }
    }

    // Stream projects
    if (aiResult.projects && resume.projects) {
      for (const projItem of resume.projects) {
        const matchingInput = preparedInput.projects.find(p => p.name === projItem.name);
        const ref = matchingInput?.ref;
        const matchingOutput = aiResult.projects.find((p: any) => p.ref === ref);

        if (matchingOutput && matchingOutput.bullets) {
          await new Promise(r => setTimeout(r, 200));
          projItem.aiBullets = matchingOutput.bullets;
          projItem.useAi = true;
          projItem.notes = ['сформулировал результат'];

          callbacks.onEvent('projects', {
            itemId: projItem.id,
            bullets: projItem.aiBullets,
            highlights: [0],
            notes: projItem.notes,
          });
        }
      }
    }

    // Stream strengths
    if (aiResult.strengths) {
      await new Promise(r => setTimeout(r, 200));
      resume.ai.strengths = aiResult.strengths;
      callbacks.onEvent('strengths', { items: aiResult.strengths });
    }

    // Stream weaknesses (Interview Prep Checklist)
    if (aiResult.weaknesses) {
      await new Promise(r => setTimeout(r, 200));
      const normalizedWeaknesses = aiResult.weaknesses.map((w: any, idx: number) => ({
        id: w.id || `w-${idx + 1}`,
        area: w.area || 'Слепая зона',
        question: w.question || '',
        strategy: w.strategy || '',
        resolved: false,
      }));
      resume.ai.weaknesses = normalizedWeaknesses;
      resume.ai.completenessScore = aiResult.completenessScore ?? 85;
      callbacks.onEvent('weaknesses', {
        items: normalizedWeaknesses,
        completenessScore: resume.ai.completenessScore,
      });
    }

    // Auto-populate initial Cover & Recommendation letters if empty
    if (!resume.documents) {
      resume.documents = {};
    }
    const nowIso = new Date().toISOString();
    let docsUpdated = false;

    if (!resume.documents.coverLetter?.body?.trim()) {
      const body = generateMockCoverLetter(preparedInput, {
        fullName: resume.personal.fullName,
        targetCompany: resume.documents.coverLetter?.targetCompany,
        targetVacancy: resume.documents.coverLetter?.targetVacancy || resume.personal.position,
        recipientName: resume.documents.coverLetter?.recipientName,
      });
      resume.documents.coverLetter = {
        ...resume.documents.coverLetter,
        body,
        updatedAt: nowIso,
        isEnabled: true,
      };
      docsUpdated = true;
    }

    if (!resume.documents.recommendationLetter?.body?.trim()) {
      const latestCompany = resume.experience?.[0]?.company || '';
      const body = generateMockRecommendationLetter(preparedInput, {
        fullName: resume.personal.fullName,
        recommenderName: resume.documents.recommendationLetter?.recommenderName,
        recommenderRole: resume.documents.recommendationLetter?.recommenderRole,
        recommenderCompany: resume.documents.recommendationLetter?.recommenderCompany || latestCompany,
        relationship: resume.documents.recommendationLetter?.relationship || 'supervisor',
      });
      resume.documents.recommendationLetter = {
        recommenderName: resume.documents.recommendationLetter?.recommenderName || 'Руководитель проекта',
        recommenderRole: resume.documents.recommendationLetter?.recommenderRole || 'Engineering Lead',
        recommenderCompany: resume.documents.recommendationLetter?.recommenderCompany || latestCompany,
        relationship: resume.documents.recommendationLetter?.relationship || 'supervisor',
        body,
        updatedAt: nowIso,
        isEnabled: true,
      };
      docsUpdated = true;
    }

    if (docsUpdated) {
      callbacks.onEvent('documents', resume.documents);
    }

    resume.ai.generatedAt = nowIso;
    resume.skills.hard = normalizedHard;

    const res = storage.updateResume(resumeId, resume, stored.version);
    const updatedVersion = res.updated?.version || stored.version + 1;
    const usage = storage.getAiUsage(resumeId);

    callbacks.onEvent('done', {
      version: updatedVersion,
      warnings: validation.warnings,
      usage,
    });
    callbacks.onDone();
  } catch (err: any) {
    console.error('AI generation error:', err);
    callbacks.onError({
      code: 'AI_PROVIDER_ERROR',
      message: err.message || 'Ошибка генерации текста',
    });
  }
}

export async function runCoverLetterGeneration(
  resumeId: string,
  params: { targetCompany?: string; targetVacancy?: string; recipientName?: string }
) {
  const stored = storage.getResume(resumeId);
  if (!stored) {
    throw new Error('NOT_FOUND');
  }
  const resume = stored.data;
  const preparedInput = prepareAiInput(resume);

  const targetCompany = params.targetCompany ?? resume.documents?.coverLetter?.targetCompany ?? '';
  const targetVacancy = params.targetVacancy ?? resume.documents?.coverLetter?.targetVacancy ?? resume.personal.position;
  const recipientName = params.recipientName ?? resume.documents?.coverLetter?.recipientName ?? '';

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const provider = process.env.AI_PROVIDER || (apiKey ? 'anthropic' : 'mock');

  let body = '';
  if (provider === 'anthropic' && apiKey) {
    const anthropic = new Anthropic({ apiKey });
    const systemPrompt = getCoverLetterSystemPrompt(resume.language, targetCompany, targetVacancy, recipientName);
    const response = await anthropic.messages.create({
      model: process.env.AI_MODEL_MAIN || 'claude-3-5-sonnet-20241022',
      max_tokens: 1800,
      system: systemPrompt,
      tools: [SUBMIT_COVER_LETTER_TOOL as any],
      tool_choice: { type: 'tool', name: 'submit_cover_letter' },
      messages: [
        {
          role: 'user',
          content: JSON.stringify({
            fullName: resume.personal.fullName,
            ...preparedInput,
          }),
        },
      ],
    });
    const toolUse = response.content.find(c => c.type === 'tool_use');
    if (toolUse && 'input' in toolUse && (toolUse.input as any).body) {
      body = (toolUse.input as any).body;
    }
  }

  if (!body) {
    await new Promise(r => setTimeout(r, 350));
    body = generateMockCoverLetter(preparedInput, {
      fullName: resume.personal.fullName,
      targetCompany,
      targetVacancy,
      recipientName,
    });
  }

  const coverLetter = {
    targetCompany,
    targetVacancy,
    recipientName,
    body,
    updatedAt: new Date().toISOString(),
    isEnabled: true,
  };

  const updatedDocs = {
    ...(resume.documents || {}),
    coverLetter,
  };
  storage.updateResume(resumeId, { documents: updatedDocs }, stored.version);

  return { coverLetter };
}

export async function runRecommendationLetterGeneration(
  resumeId: string,
  params: {
    recommenderName?: string;
    recommenderRole?: string;
    recommenderCompany?: string;
    relationship?: RecommendationRelationship;
  }
) {
  const stored = storage.getResume(resumeId);
  if (!stored) {
    throw new Error('NOT_FOUND');
  }
  const resume = stored.data;
  const preparedInput = prepareAiInput(resume);

  const prev = resume.documents?.recommendationLetter;
  const recommenderName = params.recommenderName ?? prev?.recommenderName ?? '';
  const recommenderRole = params.recommenderRole ?? prev?.recommenderRole ?? '';
  const recommenderCompany = params.recommenderCompany ?? prev?.recommenderCompany ?? (resume.experience?.[0]?.company || '');
  const relationship: RecommendationRelationship = params.relationship ?? prev?.relationship ?? 'supervisor';

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const provider = process.env.AI_PROVIDER || (apiKey ? 'anthropic' : 'mock');

  let body = '';
  if (provider === 'anthropic' && apiKey) {
    const anthropic = new Anthropic({ apiKey });
    const systemPrompt = getRecommendationLetterSystemPrompt(
      resume.language,
      recommenderName,
      recommenderRole,
      recommenderCompany,
      relationship
    );
    const response = await anthropic.messages.create({
      model: process.env.AI_MODEL_MAIN || 'claude-3-5-sonnet-20241022',
      max_tokens: 1800,
      system: systemPrompt,
      tools: [SUBMIT_RECOMMENDATION_LETTER_TOOL as any],
      tool_choice: { type: 'tool', name: 'submit_recommendation_letter' },
      messages: [
        {
          role: 'user',
          content: JSON.stringify({
            fullName: resume.personal.fullName,
            ...preparedInput,
          }),
        },
      ],
    });
    const toolUse = response.content.find(c => c.type === 'tool_use');
    if (toolUse && 'input' in toolUse && (toolUse.input as any).body) {
      body = (toolUse.input as any).body;
    }
  }

  if (!body) {
    await new Promise(r => setTimeout(r, 350));
    body = generateMockRecommendationLetter(preparedInput, {
      fullName: resume.personal.fullName,
      recommenderName,
      recommenderRole,
      recommenderCompany,
      relationship,
    });
  }

  const recommendationLetter = {
    recommenderName,
    recommenderRole,
    recommenderCompany,
    relationship,
    body,
    updatedAt: new Date().toISOString(),
    isEnabled: true,
  };

  const updatedDocs = {
    ...(resume.documents || {}),
    recommendationLetter,
  };
  storage.updateResume(resumeId, { documents: updatedDocs }, stored.version);

  return { recommendationLetter };
}
