import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ResumeData, ExportFormat, createDefaultResumeData, migrateResume } from '@cvb/shared';

const DATA_DIR = path.resolve(process.cwd(), '.data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const RESUMES_FILE = path.join(DATA_DIR, 'resumes.json');
const EXPORTS_FILE = path.join(DATA_DIR, 'exports.json');
const USAGE_FILE = path.join(DATA_DIR, 'usage.json');

export interface StoredResume {
  id: string;
  sessionId: string;
  userId?: string;
  version: number;
  data: ResumeData;
  createdAt: string;
  updatedAt: string;
}

export interface StoredExport {
  id: string;
  resumeId: string;
  format: ExportFormat;
  status: 'queued' | 'processing' | 'done' | 'failed';
  url?: string;
  fileName?: string;
  error?: string;
  createdAt: string;
}

class Storage {
  private resumes: Map<string, StoredResume> = new Map();
  private exports: Map<string, StoredExport> = new Map();
  private aiUsage: Map<string, { count: number; date: string }> = new Map();

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(RESUMES_FILE)) {
        const raw = fs.readFileSync(RESUMES_FILE, 'utf-8');
        const list: StoredResume[] = JSON.parse(raw);
        for (const item of list) {
          item.data = migrateResume(item.data);
          this.resumes.set(item.id, item);
        }
      }
      if (fs.existsSync(EXPORTS_FILE)) {
        const raw = fs.readFileSync(EXPORTS_FILE, 'utf-8');
        const list: StoredExport[] = JSON.parse(raw);
        for (const item of list) {
          this.exports.set(item.id, item);
        }
      }
      if (fs.existsSync(USAGE_FILE)) {
        const raw = fs.readFileSync(USAGE_FILE, 'utf-8');
        const obj = JSON.parse(raw);
        for (const [k, v] of Object.entries(obj)) {
          this.aiUsage.set(k, v as any);
        }
      }
    } catch (err) {
      console.error('Error loading data from disk:', err);
    }
  }

  private save() {
    try {
      fs.writeFileSync(RESUMES_FILE, JSON.stringify(Array.from(this.resumes.values()), null, 2));
      fs.writeFileSync(EXPORTS_FILE, JSON.stringify(Array.from(this.exports.values()), null, 2));
      const usageObj: Record<string, any> = {};
      for (const [k, v] of this.aiUsage.entries()) {
        usageObj[k] = v;
      }
      fs.writeFileSync(USAGE_FILE, JSON.stringify(usageObj, null, 2));
    } catch (err) {
      console.error('Error saving data to disk:', err);
    }
  }

  // --- Resumes ---
  listResumes(sessionId: string): Array<{ id: string; title: string; updatedAt: string; templateId: string }> {
    const list: Array<{ id: string; title: string; updatedAt: string; templateId: string }> = [];
    for (const r of this.resumes.values()) {
      if (r.sessionId === sessionId || !r.sessionId) {
        list.push({
          id: r.id,
          title: r.data.personal?.fullName ? `${r.data.personal.fullName} - ${r.data.personal.position || 'Резюме'}` : 'Моё резюме',
          updatedAt: r.updatedAt,
          templateId: r.data.design?.templateId || 'modern',
        });
      }
    }
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getResume(id: string): StoredResume | undefined {
    return this.resumes.get(id);
  }

  createResume(sessionId: string, initialData?: Partial<ResumeData>): StoredResume {
    const id = crypto.randomUUID();
    const data = createDefaultResumeData(id, initialData?.language || 'ru');
    if (initialData) {
      Object.assign(data, initialData);
      data.id = id;
    }
    const stored: StoredResume = {
      id,
      sessionId,
      version: 1,
      data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.resumes.set(id, stored);
    this.save();
    return stored;
  }

  updateResume(id: string, patch: any, expectedVersion: number): { updated?: StoredResume; conflict?: StoredResume } {
    const existing = this.resumes.get(id);
    if (!existing) return {};

    if (expectedVersion !== undefined && existing.version !== expectedVersion) {
      return { conflict: existing };
    }

    // Deep merge patch into existing.data
    // Objects merged deeply, arrays replaced entirely (SPEC §3.3)
    const merged = deepMergeResume(existing.data, patch);
    merged.updatedAt = new Date().toISOString();

    existing.data = merged;
    existing.version = existing.version + 1;
    existing.updatedAt = merged.updatedAt;

    this.resumes.set(id, existing);
    this.save();
    return { updated: existing };
  }

  deleteResume(id: string): boolean {
    const deleted = this.resumes.delete(id);
    if (deleted) this.save();
    return deleted;
  }

  duplicateResume(id: string, sessionId: string): StoredResume | undefined {
    const existing = this.resumes.get(id);
    if (!existing) return undefined;
    const newId = crypto.randomUUID();
    const clonedData = JSON.parse(JSON.stringify(existing.data));
    clonedData.id = newId;
    clonedData.updatedAt = new Date().toISOString();

    const stored: StoredResume = {
      id: newId,
      sessionId,
      version: 1,
      data: clonedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.resumes.set(newId, stored);
    this.save();
    return stored;
  }

  // --- AI Usage ---
  getAiUsage(resumeId: string): { used: number; limit: number; resetsAt: string } {
    const today = new Date().toISOString().slice(0, 10);
    const key = `${resumeId}:${today}`;
    const cur = this.aiUsage.get(key) || { count: 0, date: today };
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);

    return {
      used: cur.count,
      limit: 20,
      resetsAt: tomorrow.toISOString(),
    };
  }

  incrementAiUsage(resumeId: string): boolean {
    const today = new Date().toISOString().slice(0, 10);
    const key = `${resumeId}:${today}`;
    const cur = this.aiUsage.get(key) || { count: 0, date: today };
    if (cur.count >= 20) return false;
    cur.count++;
    this.aiUsage.set(key, cur);
    this.save();
    return true;
  }

  // --- Exports ---
  createExport(resumeId: string, format: ExportFormat): StoredExport {
    const id = crypto.randomUUID();
    const item: StoredExport = {
      id,
      resumeId,
      format,
      status: 'queued',
      createdAt: new Date().toISOString(),
    };
    this.exports.set(id, item);
    this.save();
    return item;
  }

  getExport(exportId: string): StoredExport | undefined {
    return this.exports.get(exportId);
  }

  updateExport(exportId: string, patch: Partial<StoredExport>): StoredExport | undefined {
    const item = this.exports.get(exportId);
    if (!item) return undefined;
    Object.assign(item, patch);
    this.exports.set(exportId, item);
    this.save();
    return item;
  }
}

// Deep merge helper respecting SPEC rule:
// Objects are merged, Arrays are replaced entirely!
function deepMergeResume(target: any, source: any): any {
  if (!source || typeof source !== 'object') return target;
  const result = Array.isArray(target) ? [...target] : { ...target };

  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = target ? target[key] : undefined;

    if (Array.isArray(sourceVal)) {
      // Arrays replaced entirely
      result[key] = [...sourceVal];
    } else if (sourceVal && typeof sourceVal === 'object' && targetVal && typeof targetVal === 'object') {
      result[key] = deepMergeResume(targetVal, sourceVal);
    } else {
      result[key] = sourceVal;
    }
  }
  return result;
}

export const storage = new Storage();
