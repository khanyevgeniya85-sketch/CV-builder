import { describe, it, expect } from 'vitest';
import {
  prepareAiInput,
  validateAiOutput,
  generateMockAiResponse,
  generateMockCoverLetter,
  generateMockRecommendationLetter,
} from '../index.js';
import { createDefaultResumeData } from '@cvb/shared';

describe('AI Prompts & Validator Unit Tests', () => {
  it('prepares sanitized AI input without personal PII', () => {
    const resume = createDefaultResumeData();
    resume.personal.fullName = 'Иван Петров';
    resume.personal.position = 'Backend Developer';
    resume.contacts.phone = '+998901112233';
    resume.contacts.email = 'secret@company.com';
    resume.experience = [
      {
        id: 'e1',
        company: 'Saber',
        role: 'Dev',
        startDate: '2023-01',
        endDate: null,
        rawDescription: 'Разработал API сервиса, увеличил пропускную способность в 2 раза',
        useAi: true,
      },
    ];

    const prepared = prepareAiInput(resume);
    expect(prepared.targetPosition).toBe('Backend Developer');
    expect(prepared.experience[0].ref).toBe('e1');
    expect((prepared as any).contacts).toBeUndefined();
    expect((prepared as any).phone).toBeUndefined();
  });

  it('detects hallucinated numbers in AI output', () => {
    const input = {
      targetPosition: 'Developer',
      language: 'ru' as const,
      tone: 'neutral' as const,
      noExperience: false,
      experience: [
        {
          ref: 'e1',
          company: 'Acme',
          role: 'Dev',
          period: '2022-01 — н. в.',
          raw: 'Оптимизировал базу данных',
        },
      ],
      projects: [],
      education: [],
      skills: { hard: [], soft: [] },
    };

    const hallucinatedOutput = {
      summary: 'Специалист по базам данных',
      experience: [
        {
          ref: 'e1',
          bullets: ['Увеличил скорость обработки запросов на 95%'],
          highlights: [0],
        },
      ],
    };

    const validation = validateAiOutput(input, hallucinatedOutput);
    expect(validation.warnings.some((w) => w.includes('95'))).toBe(true);
  });

  it('detects forbidden slop phrases', () => {
    const input = {
      targetPosition: 'Developer',
      language: 'ru' as const,
      tone: 'neutral' as const,
      noExperience: false,
      experience: [],
      projects: [],
      education: [],
      skills: { hard: [], soft: [] },
    };

    const slopOutput = {
      summary: 'Высококвалифицированный специалист, нацелен на результат в динамичной среде.',
      experience: [],
    };

    const validation = validateAiOutput(input, slopOutput);
    expect(validation.slopHits.length).toBeGreaterThan(0);
    expect(validation.slopHits).toContain('в динамичной среде');
    expect(validation.isValid).toBe(false);
  });

  it('generates offline realistic AI response with strengths, weaknesses, and no slop', () => {
    const input = {
      targetPosition: 'Frontend Developer',
      language: 'ru' as const,
      tone: 'confident' as const,
      noExperience: false,
      experience: [
        {
          ref: 'e1',
          company: 'Saber',
          role: 'Lead',
          period: '2022-01 — 2024-01',
          raw: 'Ускорил загрузку в 3 раза',
        },
        {
          ref: 'e2',
          company: 'BetaTech',
          role: 'Frontend',
          period: '2020-01 — 2022-01',
          raw: 'Разрабатывал компоненты интерфейса',
        },
      ],
      projects: [],
      education: [],
      skills: { hard: ['React', 'TypeScript'], soft: ['Наставничество'] },
    };

    const response = generateMockAiResponse(input);
    expect(response.summary.length).toBeGreaterThan(30);
    expect(response.experience[0].bullets.length).toBeGreaterThan(0);
    expect(response.strengths.length).toBeGreaterThanOrEqual(3);
    expect(response.weaknesses.length).toBeGreaterThanOrEqual(2);
    expect(response.completenessScore).toBeGreaterThan(50);

    const validation = validateAiOutput(input, response);
    expect(validation.slopHits.length).toBe(0);
    expect(validation.isValid).toBe(true);
  });

  it('generates cover letter and recommendation letter from CV input', () => {
    const input = {
      targetPosition: 'Frontend Developer',
      language: 'ru' as const,
      tone: 'confident' as const,
      noExperience: false,
      experience: [
        {
          ref: 'e1',
          company: 'Saber',
          role: 'Frontend TeamLead',
          period: '2022-01 — 2024-01',
          raw: 'Руководил командой разработки',
        },
      ],
      projects: [],
      education: [],
      skills: { hard: ['React', 'TypeScript', 'Next.js'], soft: [] },
    };

    const cover = generateMockCoverLetter(input, {
      fullName: 'Иван Петров',
      targetCompany: 'Yandex',
      targetVacancy: 'Senior Frontend Developer',
    });
    expect(cover).toContain('Yandex');
    expect(cover).toContain('Иван Петров');
    expect(cover).toContain('Saber');

    const rec = generateMockRecommendationLetter(input, {
      fullName: 'Иван Петров',
      recommenderName: 'Алексей Смирнов',
      recommenderRole: 'CTO',
      recommenderCompany: 'Saber',
    });
    expect(rec).toContain('Алексей Смирнов');
    expect(rec).toContain('Иван Петров');
    expect(rec).toContain('Saber');
  });
});
