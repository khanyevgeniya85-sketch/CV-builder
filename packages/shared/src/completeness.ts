import { ResumeData, SectionKey } from './resume.js';

export interface CheckIssue {
  code: string;
  severity: 'info' | 'warning';
  section: SectionKey | 'contacts' | 'general';
  itemId?: string;
  message: string;
}

const RESULT_WORDS = [
  'увеличил', 'сократил', 'запустил', 'внедрил', 'разработал', 'оптимизировал',
  'повысил', 'ускорил', 'автоматизировал', 'снизил', 'создал', 'достиг',
  'increased', 'decreased', 'launched', 'optimized', 'accelerated', 'built', 'reduced',
  'yaratdi', 'oshirdi', 'kamaytirdi', 'joriy qildi', 'optimallashtirdi'
];

export function checkResumeCompleteness(data: ResumeData): CheckIssue[] {
  const issues: CheckIssue[] = [];

  // 1. Contacts check
  const hasPhone = Boolean(data.contacts?.phone && data.contacts.phone.replace(/[^0-9]/g, '').length >= 7);
  const hasEmail = Boolean(data.contacts?.email && data.contacts.email.includes('@'));
  if (!hasPhone && !hasEmail) {
    issues.push({
      code: 'NO_CONTACT',
      severity: 'warning',
      section: 'contacts',
      message: 'Укажите телефон или email для связи с вами',
    });
  }

  // 2. Experience check
  if (!data.noExperience && data.experience && data.experience.length > 0) {
    for (const exp of data.experience) {
      const raw = exp.rawDescription?.trim() || '';
      if (raw.length > 0 && raw.length < 80 && (!exp.aiBullets || exp.aiBullets.length === 0)) {
        issues.push({
          code: 'EXPERIENCE_TOO_SHORT',
          severity: 'info',
          section: 'experience',
          itemId: exp.id,
          message: `В опыте в «${exp.company || 'компании'}» мало деталей — добавьте конкретные результаты работы`,
        });
      }

      const allText = (raw + ' ' + (exp.aiBullets?.join(' ') || '')).toLowerCase();
      const hasNumber = /\d+/.test(allText);
      const hasResultWord = RESULT_WORDS.some(w => allText.includes(w));
      if (!hasNumber && !hasResultWord && raw.length > 0) {
        issues.push({
          code: 'NO_RESULTS',
          severity: 'info',
          section: 'experience',
          itemId: exp.id,
          message: `В компании «${exp.company || 'компании'}» нет оцифрованных результатов или достижений`,
        });
      }
    }
  }

  // 3. Summary check
  if (!data.ai?.summary || data.ai.summary.trim().length < 20) {
    issues.push({
      code: 'SUMMARY_MISSING',
      severity: 'info',
      section: 'summary',
      message: 'Добавьте профессиональное описание (summary) или сгенерируйте его в редакторе',
    });
  }

  // 4. Skills check
  const hardCount = data.skills?.hard?.length || 0;
  if (hardCount < 4) {
    issues.push({
      code: 'TOO_FEW_SKILLS',
      severity: 'info',
      section: 'skills',
      message: `Указано мало профессиональных навыков (${hardCount} из рекомендуемых 4+)`,
    });
  }

  return issues;
}
