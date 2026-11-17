import { ResumeData, Lang, RecommendationRelationship } from '@cvb/shared';

export interface PreparedAiInput {
  targetPosition: string;
  language: Lang;
  tone: 'neutral' | 'confident' | 'creative';
  noExperience: boolean;
  experience: Array<{
    ref: string;
    company: string;
    role: string;
    period: string;
    raw: string;
  }>;
  projects: Array<{
    ref: string;
    name: string;
    raw: string;
  }>;
  education: Array<{
    institution: string;
    specialty: string;
    level: string;
    year: number;
  }>;
  skills: {
    hard: string[];
    soft: string[];
  };
}

export function prepareAiInput(data: ResumeData): PreparedAiInput {
  const expItems: PreparedAiInput['experience'] = [];
  if (!data.noExperience && data.experience) {
    data.experience.forEach((e, idx) => {
      if (e.rawDescription?.trim()) {
        const period = `${e.startDate} — ${e.endDate || 'н. в.'}`;
        expItems.push({
          ref: `e${idx + 1}`,
          company: e.company || 'Компания',
          role: e.role || 'Специалист',
          period,
          raw: e.rawDescription.trim(),
        });
      }
    });
  }

  const projItems: PreparedAiInput['projects'] = [];
  if (data.projects) {
    data.projects.forEach((p, idx) => {
      if (p.rawDescription?.trim()) {
        projItems.push({
          ref: `p${idx + 1}`,
          name: p.name || 'Проект',
          raw: p.rawDescription.trim(),
        });
      }
    });
  }

  const eduItems = (data.education || []).map(ed => ({
    institution: ed.institution || '',
    specialty: ed.specialty || '',
    level: ed.level || 'bachelor',
    year: ed.graduationYear || 2024,
  }));

  const hardSkills = (data.skills?.hard || []).map(s => s.name);
  const softSkills = data.skills?.soft || [];

  return {
    targetPosition: data.personal?.position || 'Специалист',
    language: data.language || 'ru',
    tone: data.ai?.tone || 'neutral',
    noExperience: Boolean(data.noExperience),
    experience: expItems,
    projects: projItems,
    education: eduItems,
    skills: {
      hard: hardSkills,
      soft: softSkills,
    },
  };
}

const TONE_DESCRIPTIONS: Record<'neutral' | 'confident' | 'creative', string> = {
  neutral: 'Сдержанный, фактический, без оценочных эпитетов',
  confident: 'Уверенный, акцент на результатах и ответственности, активные глаголы',
  creative: 'Живой, с характером, допускается одна яркая формулировка в summary; без сленга',
};

const LANG_NAMES: Record<Lang, string> = {
  ru: 'Русский',
  uz: 'O‘zbek tili (lotin alifbosi)',
  en: 'English',
};

export function getSystemPrompt(language: Lang, tone: 'neutral' | 'confident' | 'creative', targetPosition: string): string {
  const langName = LANG_NAMES[language] || 'Русский';
  const toneDesc = TONE_DESCRIPTIONS[tone] || TONE_DESCRIPTIONS.neutral;

  return `Ты — профессиональный карьерный консультант, строгий HRD и редактор резюме.
Твоя задача — переписать данные кандидата в сильное, честное резюме, выделить сильные стороны и выявить слабые зоны для подготовки к собеседованию.

ЖЁСТКИЕ ПРАВИЛА:
1. Используй ТОЛЬКО факты из входных данных. Запрещено добавлять компании, технологии, проекты, должности, сроки, цифры и проценты, которых нет во входе.
2. Если во входе нет цифр — пиши без цифр. Не пиши «на X%» и не используй заглушки.
3. Пиши на языке: ${langName}. Для узбекского — только латиница (O‘zbek lotin alifbosi).
4. Деловой стиль. Без местоимения «я». Без клише: «коммуникабельный», «стрессоустойчивый», «ответственный», «целеустремлённый», «быстро обучаюсь», «нацелен на результат», «высококвалифицированный».
5. Тон: ${toneDesc}.
6. Делай акцент на том, что релевантно целевой должности: «${targetPosition}».

ФОРМАТ БЛОКОВ:
- summary: 3–5 предложений, 300–600 символов. Кто кандидат, ключевой опыт, главная ценность для работодателя на целевой должности.
- experience: для каждого ref — 3–5 пунктов. Каждый пункт: глагол действия в прошедшем времени + что сделано + результат (если есть во входе). Не более 180 символов. highlights — индексы 1–2 самых сильных пунктов.
- projects: аналогично, 2–4 пункта.
- strengths: 3–5 сильных сторон. title — 2–5 слов; evidence — одно предложение, ссылающееся на конкретный факт из опыта, проектов или образования.
- weaknesses: 2–4 слабые стороны и слепые зоны профиля. Преврати их в конкретные вопросы рекрутера на интервью: area (область, например «Отсутствие метрик»), question (точный каверзный вопрос от интервьюера), strategy (практический совет, как ответить или что дописать в резюме).
- completenessScore: оценка полноты и качества профиля от 0 до 100.

Если данных мало — пиши кратко, но не выдумывай.
Ответ — строго через инструмент submit_resume.`;
}

export function getCoverLetterSystemPrompt(
  language: Lang,
  targetCompany: string,
  targetVacancy: string,
  recipientName?: string
): string {
  const langName = LANG_NAMES[language] || 'Русский';
  return `Ты — эксперт по карьерным коммуникациям.
Напиши убедительное, деловое и лаконичное мотивационное письмо (Cover Letter) на языке ${langName}.

Целевая компания: ${targetCompany || 'компания работодателя'}
Целевая позиция: ${targetVacancy || 'указанная должность'}
${recipientName ? `Адресат: ${recipientName}` : ''}

СТРУКТУРА:
1. Приветствие без штампов.
2. Крючок: интерес к задачам компании и соответствие профилю.
3. Доказательная база: 2–3 факта из реального опыта кандидата (ТОЛЬКО из входного JSON).
4. Завершение и готовность к техническому/финальному обсуждению.

ПРАВИЛА:
- Никаких выдуманных проектов и цифр.
- Никакого нейрослопа («динамичная среда», «синергия», «мечтаю работать»).
- Объём: 180–300 слов.
Ответ — строго через инструмент submit_cover_letter.`;
}

export function getRecommendationLetterSystemPrompt(
  language: Lang,
  recommenderName: string,
  recommenderRole: string,
  recommenderCompany: string,
  relationship: RecommendationRelationship
): string {
  const langName = LANG_NAMES[language] || 'Русский';
  return `Ты — опытный руководитель / технический директор.
Напиши честное, конкретное рекомендательное письмо на языке ${langName} о работе кандидата на основе приложенного резюме.

От лица: ${recommenderName || 'Руководитель проекта'} (${recommenderRole || 'Руководитель'}, ${recommenderCompany || 'Компания'})
Характер взаимодействия: ${relationship}

ПРАВИЛА:
- Опирайся исключительно на реальные роли, проекты, технологии и достижения кандидата из входного JSON.
- Без приторных преувеличений и штампов. Подчеркни профессиональную ответственность, технические решения и командный вклад.
- Объём: 180–280 слов.
Ответ — строго через инструмент submit_recommendation_letter.`;
}

export const SUBMIT_RESUME_TOOL = {
  name: 'submit_resume',
  description: 'Отправить отредактированные секции резюме и аудит профиля',
  input_schema: {
    type: 'object',
    required: ['summary', 'experience', 'projects', 'strengths', 'weaknesses', 'completenessScore'],
    properties: {
      summary: { type: 'string' },
      experience: {
        type: 'array',
        items: {
          type: 'object',
          required: ['ref', 'bullets', 'highlights'],
          properties: {
            ref: { type: 'string' },
            bullets: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 5 },
            highlights: { type: 'array', items: { type: 'integer' } },
          },
        },
      },
      projects: {
        type: 'array',
        items: {
          type: 'object',
          required: ['ref', 'bullets', 'highlights'],
          properties: {
            ref: { type: 'string' },
            bullets: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 5 },
            highlights: { type: 'array', items: { type: 'integer' } },
          },
        },
      },
      strengths: {
        type: 'array',
        minItems: 1,
        maxItems: 5,
        items: {
          type: 'object',
          required: ['title', 'evidence'],
          properties: {
            title: { type: 'string' },
            evidence: { type: 'string' },
          },
        },
      },
      weaknesses: {
        type: 'array',
        minItems: 1,
        maxItems: 5,
        items: {
          type: 'object',
          required: ['id', 'area', 'question', 'strategy'],
          properties: {
            id: { type: 'string' },
            area: { type: 'string' },
            question: { type: 'string' },
            strategy: { type: 'string' },
          },
        },
      },
      completenessScore: { type: 'number', minimum: 0, maximum: 100 },
    },
  },
};

export const SUBMIT_COVER_LETTER_TOOL = {
  name: 'submit_cover_letter',
  description: 'Отправить текст мотивационного письма',
  input_schema: {
    type: 'object',
    required: ['body'],
    properties: {
      body: { type: 'string' },
    },
  },
};

export const SUBMIT_RECOMMENDATION_LETTER_TOOL = {
  name: 'submit_recommendation_letter',
  description: 'Отправить текст рекомендательного письма',
  input_schema: {
    type: 'object',
    required: ['body'],
    properties: {
      body: { type: 'string' },
    },
  },
};
