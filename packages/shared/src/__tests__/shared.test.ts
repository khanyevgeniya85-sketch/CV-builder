import { describe, it, expect } from 'vitest';
import {
  ResumeDataSchema,
  createDefaultResumeData,
  migrateResume,
  buildPalette,
  transliterate,
  generateExportFileName,
  checkResumeCompleteness,
  isAgeBetween,
} from '../index.js';

describe('Shared Package Unit Tests', () => {
  it('validates default resume schema v2 with address, birthYear, weaknesses, and documents', () => {
    const resume = createDefaultResumeData();
    resume.personal.fullName = 'Иван Петров';
    resume.personal.position = 'Frontend Developer';
    resume.personal.birthYear = 1995;
    resume.personal.address = {
      country: 'Узбекистан',
      city: 'Ташкент',
      districtOrStreet: 'Юнусабад',
      willingToRelocate: true,
      remoteWork: true,
    };
    resume.contacts.phone = '+998901234567';
    resume.contacts.email = 'ivan@example.com';
    resume.ai.weaknesses = [
      {
        id: 'w1',
        area: 'Опыт работы',
        question: 'Почему отсутствуют метрики?',
        strategy: 'Уточните экономию времени команды.',
        resolved: false,
      },
    ];
    resume.documents = {
      coverLetter: {
        targetCompany: 'TechCorp',
        targetVacancy: 'Frontend Developer',
        body: 'Здравствуйте...',
        isEnabled: true,
      },
      recommendationLetter: {
        recommenderName: 'Алексей Смирнов',
        recommenderRole: 'CTO',
        recommenderCompany: 'TechCorp',
        relationship: 'supervisor',
        body: 'Рекомендую Ивана...',
        isEnabled: true,
      },
    };

    const parsed = ResumeDataSchema.safeParse(resume);
    expect(parsed.success).toBe(true);
  });

  it('migrates v1 resume to v2 cleanly', () => {
    const legacy = {
      id: '123',
      schemaVersion: 1,
      personal: { fullName: 'Анна', position: 'PM', city: 'Самарканд', birthDate: '1997-05-12' },
      contacts: { phone: '+998901234567', email: 'anna@example.com' },
    };
    const migrated = migrateResume(legacy);
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.personal.address?.city).toBe('Самарканд');
    expect(migrated.personal.birthYear).toBe(1997);
    expect(migrated.documents?.coverLetter).toBeDefined();
    expect(migrated.documents?.recommendationLetter).toBeDefined();
  });

  it('checks age validation', () => {
    expect(isAgeBetween('2000-01-01', 14, 80)).toBe(true);
    expect(isAgeBetween('1920-01-01', 14, 80)).toBe(false);
    expect(isAgeBetween('2020-01-01', 14, 80)).toBe(false);
  });

  it('guarantees WCAG AA contrast ratio >= 4.5:1 in buildPalette', () => {
    const testColors = ['#2563EB', '#059669', '#EAB308', '#F97316', '#38BDF8'];
    for (const color of testColors) {
      const palette = buildPalette(color);
      expect(palette.contrastWithWhite).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('transliterates correctly according to GOST & Uzbek rules', () => {
    expect(transliterate('Иван Петров')).toBe('Ivan_Petrov');
    expect(transliterate('G‘ofur G‘ulom')).toBe('Gofur_Gulom');
    expect(transliterate('Frontend-разработчик')).toBe('Frontend-razrabotchik');
  });

  it('generates export file names conforming to spec v2', () => {
    expect(generateExportFileName('Иван Петров', 'Frontend-разработчик', 'pdf-desktop')).toBe(
      'Ivan_Petrov_Frontend-razrabotchik_CV.pdf'
    );
    expect(generateExportFileName('Иван Петров', 'Frontend-разработчик', 'pdf-mobile')).toBe(
      'Ivan_Petrov_Frontend-razrabotchik_CV_mobile.pdf'
    );
    expect(generateExportFileName('Иван Петров', 'Frontend-разработчик', 'png-mobile')).toBe(
      'Ivan_Petrov_Frontend-razrabotchik_CV_mobile.png'
    );
    expect(generateExportFileName('Иван Петров', 'Frontend-разработчик', 'pdf-cover-letter')).toBe(
      'Ivan_Petrov_Frontend-razrabotchik_Cover_Letter.pdf'
    );
    expect(generateExportFileName('Иван Петров', 'Frontend-разработчик', 'pdf-recommendation')).toBe(
      'Ivan_Petrov_Frontend-razrabotchik_Recommendation.pdf'
    );
    expect(generateExportFileName('Иван Петров', 'Frontend-разработчик', 'zip-kit')).toBe(
      'Ivan_Petrov_Frontend-razrabotchik_Application_Kit.zip'
    );
  });

  it('checks resume completeness rules', () => {
    const emptyResume = createDefaultResumeData();
    const issues = checkResumeCompleteness(emptyResume);
    expect(issues.some((i) => i.code === 'NO_CONTACT')).toBe(true);
    expect(issues.some((i) => i.code === 'SUMMARY_MISSING')).toBe(true);
  });
});
