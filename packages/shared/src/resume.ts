import { z } from 'zod';

export const Lang = z.enum(['ru', 'uz', 'en']);
export type Lang = z.infer<typeof Lang>;

export const TemplateId = z.enum(['classic', 'modern', 'minimal', 'creative', 'ats']);
export type TemplateId = z.infer<typeof TemplateId>;

export const SectionKey = z.enum([
  'summary',
  'strengths',
  'experience',
  'projects',
  'education',
  'skills',
  'languages',
]);
export type SectionKey = z.infer<typeof SectionKey>;

export const EducationLevel = z.enum([
  'secondary',
  'vocational',
  'bachelor',
  'master',
  'course',
  'certificate',
]);
export type EducationLevel = z.infer<typeof EducationLevel>;

export const LangLevel = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'native']);
export type LangLevel = z.infer<typeof LangLevel>;

export function isAgeBetween(birthDateStr: string, minYears: number, maxYears: number): boolean {
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return false;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age >= minYears && age <= maxYears;
}

const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const id = z.string();

export const AddressSchema = z.object({
  country: z.string().trim().max(60).default('Узбекистан'),
  city: z.string().trim().max(60).default(''),
  districtOrStreet: z.string().trim().max(100).optional(),
  willingToRelocate: z.boolean().default(false),
  remoteWork: z.boolean().default(false),
});
export type AddressData = z.infer<typeof AddressSchema>;

export const PersonalSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100),
    position: z.string().trim().min(2).max(100),
    birthDate: z.string().optional(), // YYYY-MM-DD
    birthYear: z.number().int().min(1940).max(new Date().getFullYear() - 14).optional(),
    showAge: z.boolean().default(false),
    hideBirthDate: z.boolean().default(false),
    city: z.string().trim().max(60).optional(),
    address: AddressSchema.optional(),
    photoKey: z.string().optional(),
    photoUrl: z.string().optional(),
    photoFilter: z.enum(['natural', 'bw']).default('natural'),
    photoShape: z.enum(['circle', 'square']).default('square'),
  })
  .refine(p => !p.birthDate || isAgeBetween(p.birthDate, 14, 80), {
    path: ['birthDate'],
    message: 'AGE_OUT_OF_RANGE',
  });
export type Personal = z.infer<typeof PersonalSchema>;

export const ContactsSchema = z.object({
  phone: z.string().min(5),
  email: z.string().email().max(120),
  telegram: z.string().regex(/^@?[a-zA-Z0-9_]{5,32}$/).optional().or(z.literal('')),
  linkedin: z.string().url().regex(/linkedin\.com/).optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
});
export type Contacts = z.infer<typeof ContactsSchema>;

export const ExperienceItem = z
  .object({
    id,
    company: z.string().trim().min(1).max(100),
    role: z.string().trim().min(1).max(100),
    startDate: yearMonth,
    endDate: yearMonth.nullable(), // null = по настоящее время
    rawDescription: z.string().max(2000),
    aiBullets: z.array(z.string().max(250)).max(6).optional(),
    highlights: z.array(z.number().int().min(0)).optional(),
    useAi: z.boolean().default(true),
    notes: z.array(z.string()).optional(),
  })
  .refine(e => !e.endDate || e.endDate >= e.startDate, {
    path: ['endDate'],
    message: 'END_BEFORE_START',
  });
export type ExperienceItem = z.infer<typeof ExperienceItem>;

export const ProjectItem = z.object({
  id,
  name: z.string().trim().min(1).max(100),
  link: z.string().url().optional().or(z.literal('')),
  rawDescription: z.string().max(1000),
  aiBullets: z.array(z.string().max(250)).max(5).optional(),
  useAi: z.boolean().default(true),
  notes: z.array(z.string()).optional(),
});
export type ProjectItem = z.infer<typeof ProjectItem>;

export const EducationItem = z.object({
  id,
  institution: z.string().trim().min(1).max(150),
  specialty: z.string().trim().min(1).max(150),
  level: EducationLevel,
  graduationYear: z.number().int().min(1960).max(2040),
});
export type EducationItem = z.infer<typeof EducationItem>;

export const SkillsSchema = z.object({
  hard: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(40),
        level: z.number().int().min(1).max(5).optional(),
      })
    )
    .max(30),
  soft: z.array(z.string().trim().min(1).max(40)).max(15),
  languages: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(30),
        level: LangLevel,
      })
    )
    .max(8),
});
export type Skills = z.infer<typeof SkillsSchema>;

export const StrengthItem = z.object({
  title: z.string().max(80),
  evidence: z.string().max(300),
});
export type StrengthItem = z.infer<typeof StrengthItem>;

export const WeaknessItem = z.object({
  id: z.string(),
  area: z.string().max(100),
  question: z.string().max(250),
  strategy: z.string().max(400),
  resolved: z.boolean().default(false),
});
export type WeaknessItem = z.infer<typeof WeaknessItem>;

export const AiSchema = z.object({
  summary: z.string().max(800).optional(),
  strengths: z.array(StrengthItem).max(5).optional(),
  weaknesses: z.array(WeaknessItem).max(5).optional(),
  completenessScore: z.number().min(0).max(100).optional(),
  tone: z.enum(['neutral', 'confident', 'creative']).default('neutral'),
  generatedAt: z.string().datetime().optional(),
  inputHash: z.string().optional(),
});
export type AiData = z.infer<typeof AiSchema>;

export const CoverLetterSchema = z.object({
  targetCompany: z.string().trim().max(100).optional(),
  targetVacancy: z.string().trim().max(100).optional(),
  recipientName: z.string().trim().max(100).optional(),
  body: z.string().max(4000).default(''),
  updatedAt: z.string().optional(),
  isEnabled: z.boolean().default(true),
});
export type CoverLetterData = z.infer<typeof CoverLetterSchema>;

export const RecommendationRelationship = z.enum(['supervisor', 'team_lead', 'mentor', 'colleague']);
export type RecommendationRelationship = z.infer<typeof RecommendationRelationship>;

export const RecommendationLetterSchema = z.object({
  recommenderName: z.string().trim().max(100).default(''),
  recommenderRole: z.string().trim().max(100).default(''),
  recommenderCompany: z.string().trim().max(100).default(''),
  relationship: RecommendationRelationship.default('supervisor'),
  body: z.string().max(4000).default(''),
  updatedAt: z.string().optional(),
  isEnabled: z.boolean().default(true),
});
export type RecommendationLetterData = z.infer<typeof RecommendationLetterSchema>;

export const AttachedDocumentsSchema = z.object({
  coverLetter: CoverLetterSchema.optional(),
  recommendationLetter: RecommendationLetterSchema.optional(),
});
export type AttachedDocumentsData = z.infer<typeof AttachedDocumentsSchema>;

export const DesignSchema = z.object({
  templateId: TemplateId.default('modern'),
  themeId: z.string().default('blue'),
  customAccent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  font: z.enum(['inter', 'roboto', 'pt', 'montserrat']).default('inter'),
  fontSize: z.enum(['S', 'M', 'L']).default('M'),
  sectionOrder: z.array(SectionKey),
  hiddenSections: z.array(SectionKey).default([]),
});
export type DesignData = z.infer<typeof DesignSchema>;

export const ResumeDataSchema = z.object({
  id: z.string(),
  schemaVersion: z.union([z.literal(1), z.literal(2)]).default(2),
  language: Lang.default('ru'),
  noExperience: z.boolean().default(false),
  personal: PersonalSchema,
  contacts: ContactsSchema,
  experience: z.array(ExperienceItem).max(15),
  projects: z.array(ProjectItem).max(10),
  education: z.array(EducationItem).max(10),
  skills: SkillsSchema,
  ai: AiSchema,
  documents: AttachedDocumentsSchema.optional(),
  design: DesignSchema,
  updatedAt: z.string().datetime(),
});
export type ResumeData = z.infer<typeof ResumeDataSchema>;

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  'summary',
  'strengths',
  'experience',
  'projects',
  'education',
  'skills',
  'languages',
];

export function createDefaultResumeData(id = crypto.randomUUID(), lang: Lang = 'ru'): ResumeData {
  const nowIso = new Date().toISOString();
  return {
    id,
    schemaVersion: 2,
    language: lang,
    noExperience: false,
    personal: {
      fullName: '',
      position: '',
      birthDate: undefined,
      birthYear: undefined,
      showAge: false,
      hideBirthDate: false,
      city: '',
      address: {
        country: lang === 'en' ? 'Uzbekistan' : lang === 'uz' ? 'O‘zbekiston' : 'Узбекистан',
        city: '',
        districtOrStreet: '',
        willingToRelocate: false,
        remoteWork: false,
      },
      photoKey: undefined,
      photoUrl: undefined,
      photoFilter: 'natural',
      photoShape: 'square',
    },
    contacts: {
      phone: '+998',
      email: '',
      telegram: '',
      linkedin: '',
      website: '',
    },
    experience: [],
    projects: [],
    education: [],
    skills: {
      hard: [],
      soft: [],
      languages: [
        { name: lang === 'ru' ? 'Русский' : lang === 'uz' ? 'O‘zbek' : 'English', level: 'native' },
      ],
    },
    ai: {
      tone: 'neutral',
      weaknesses: [],
    },
    documents: {
      coverLetter: {
        targetCompany: '',
        targetVacancy: '',
        recipientName: '',
        body: '',
        updatedAt: nowIso,
        isEnabled: true,
      },
      recommendationLetter: {
        recommenderName: '',
        recommenderRole: '',
        recommenderCompany: '',
        relationship: 'supervisor',
        body: '',
        updatedAt: nowIso,
        isEnabled: true,
      },
    },
    design: {
      templateId: 'modern',
      themeId: 'blue',
      font: 'inter',
      fontSize: 'M',
      sectionOrder: [...DEFAULT_SECTION_ORDER],
      hiddenSections: [],
    },
    updatedAt: nowIso,
  };
}

export function migrateResume(data: any): ResumeData {
  if (!data || typeof data !== 'object') {
    return createDefaultResumeData();
  }
  const cloned = JSON.parse(JSON.stringify(data));
  const defaults = createDefaultResumeData(cloned.id || crypto.randomUUID(), cloned.language || 'ru');

  if (!cloned.id) cloned.id = defaults.id;
  cloned.schemaVersion = 2;
  if (!cloned.language) cloned.language = 'ru';
  if (typeof cloned.noExperience !== 'boolean') cloned.noExperience = false;
  if (!cloned.personal) cloned.personal = { ...defaults.personal };
  if (!cloned.personal.address) {
    cloned.personal.address = {
      ...defaults.personal.address!,
      city: cloned.personal.city || '',
    };
  }
  if (!cloned.personal.birthYear && cloned.personal.birthDate) {
    const y = new Date(cloned.personal.birthDate).getFullYear();
    if (!isNaN(y) && y >= 1940) cloned.personal.birthYear = y;
  }
  if (!cloned.personal.photoFilter) cloned.personal.photoFilter = 'natural';
  if (!cloned.personal.photoShape) cloned.personal.photoShape = 'square';

  if (!cloned.contacts) cloned.contacts = { ...defaults.contacts };
  if (!Array.isArray(cloned.experience)) cloned.experience = [];
  if (!Array.isArray(cloned.projects)) cloned.projects = [];
  if (!Array.isArray(cloned.education)) cloned.education = [];
  if (!cloned.skills) cloned.skills = { ...defaults.skills };
  if (!Array.isArray(cloned.skills.hard)) cloned.skills.hard = [];
  if (!Array.isArray(cloned.skills.soft)) cloned.skills.soft = [];
  if (!Array.isArray(cloned.skills.languages)) cloned.skills.languages = [];

  if (!cloned.ai) cloned.ai = { tone: 'neutral', weaknesses: [] };
  if (!Array.isArray(cloned.ai.weaknesses)) cloned.ai.weaknesses = [];

  if (!cloned.documents) {
    cloned.documents = { ...defaults.documents };
  } else {
    if (!cloned.documents.coverLetter) {
      cloned.documents.coverLetter = { ...defaults.documents!.coverLetter };
    }
    if (!cloned.documents.recommendationLetter) {
      cloned.documents.recommendationLetter = { ...defaults.documents!.recommendationLetter };
    }
  }

  if (!cloned.design) {
    cloned.design = { ...defaults.design };
  }
  if (!Array.isArray(cloned.design.sectionOrder) || cloned.design.sectionOrder.length === 0) {
    cloned.design.sectionOrder = [...DEFAULT_SECTION_ORDER];
  }
  if (!Array.isArray(cloned.design.hiddenSections)) {
    cloned.design.hiddenSections = [];
  }
  if (!cloned.updatedAt) cloned.updatedAt = new Date().toISOString();
  return cloned as ResumeData;
}
