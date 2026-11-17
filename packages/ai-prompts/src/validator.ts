import { PreparedAiInput } from './generate.js';
import slopRu from './slop/ru.json' with { type: 'json' };
import slopUz from './slop/uz.json' with { type: 'json' };
import slopEn from './slop/en.json' with { type: 'json' };

const SLOP_DICTS = {
  ru: slopRu as string[],
  uz: slopUz as string[],
  en: slopEn as string[],
};

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  slopHits: string[];
  sanitizedBullets: Record<string, string[]>;
  notesByRef: Record<string, string[]>;
}

export function extractNumbers(text: string): string[] {
  const matches = text.match(/\b\d+([.,]\d+)?\b/g);
  return matches ? matches.map(m => m.replace(',', '.')) : [];
}

export function validateAiOutput(
  input: PreparedAiInput,
  output: {
    summary?: string;
    experience?: Array<{ ref: string; bullets: string[]; highlights?: number[] }>;
    projects?: Array<{ ref: string; bullets: string[]; highlights?: number[] }>;
    strengths?: Array<{ title: string; evidence: string }>;
  }
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const slopHits: string[] = [];
  const sanitizedBullets: Record<string, string[]> = {};
  const notesByRef: Record<string, string[]> = {};

  const slopWords = SLOP_DICTS[input.language] || SLOP_DICTS.ru;

  // Build input facts dictionary
  const globalInputNumbers = new Set<string>();
  const allInputText = [
    input.targetPosition,
    ...input.experience.map(e => e.raw + ' ' + e.period + ' ' + e.role + ' ' + e.company),
    ...input.projects.map(p => p.raw + ' ' + p.name),
    ...input.education.map(e => `${e.year} ${e.institution} ${e.specialty}`),
    ...input.skills.hard,
    ...input.skills.soft,
  ].join(' ');

  extractNumbers(allInputText).forEach(n => globalInputNumbers.add(n));

  // Check slop in summary
  if (output.summary) {
    const sumLower = output.summary.toLowerCase();
    for (const phrase of slopWords) {
      if (sumLower.includes(phrase.toLowerCase())) {
        slopHits.push(phrase);
      }
    }
  }

  // Validate experience
  if (output.experience) {
    for (const expOut of output.experience) {
      const expIn = input.experience.find(e => e.ref === expOut.ref);
      const inputNumbers = new Set<string>();
      if (expIn) {
        extractNumbers(expIn.raw + ' ' + expIn.period).forEach(n => inputNumbers.add(n));
      }

      const validBullets: string[] = [];
      const notes: string[] = [];
      let hadNumbers = false;
      let hadActionVerb = false;

      for (const bullet of expOut.bullets) {
        const bulletLower = bullet.toLowerCase();

        // Check slop
        for (const phrase of slopWords) {
          if (bulletLower.includes(phrase.toLowerCase())) {
            slopHits.push(phrase);
          }
        }

        // Check hallucinated numbers
        const bNumbers = extractNumbers(bullet);
        let numberHallucination = false;
        for (const num of bNumbers) {
          if (!inputNumbers.has(num) && !globalInputNumbers.has(num)) {
            numberHallucination = true;
            warnings.push(`Число ${num} в пункте «${bullet.slice(0, 40)}...» отсутствует во входных данных`);
          } else {
            hadNumbers = true;
          }
        }

        // Check length
        if (bullet.length > 220) {
          validBullets.push(bullet.slice(0, 217) + '...');
        } else {
          validBullets.push(bullet);
        }

        if (/(руководил|разработал|оптимизировал|внедрил|создал|увеличил|сократил|led|developed|optimized|implemented|created|yaratdi|boshqardi)/i.test(bullet)) {
          hadActionVerb = true;
        }
      }

      sanitizedBullets[expOut.ref] = validBullets;

      // Assign margin notes (DESIGN §9.3)
      if (hadActionVerb) {
        notes.push('перевёл в достижения');
      }
      if (hadNumbers) {
        notes.push('цифры взяты из вашего текста');
      }
      if (expIn && expIn.raw.length < 80) {
        notes.push('мало деталей — добавьте результат');
      }
      if (notes.length === 0) {
        notes.push('структурировал по пунктам');
      }
      notesByRef[expOut.ref] = notes.slice(0, 2);
    }
  }

  return {
    isValid: errors.length === 0 && slopHits.length === 0,
    errors,
    warnings,
    slopHits,
    sanitizedBullets,
    notesByRef,
  };
}
