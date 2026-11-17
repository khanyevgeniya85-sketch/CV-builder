# SPEC: Конструктор резюме с ИИ (CV Builder AI)

| Поле | Значение |
|---|---|
| **Версия документа** | 2.0 |
| **Дата** | 17.11.2026 |
| **Основа** | PRD «Конструктор резюме» v2.0 |
| **Статус** | Согласовано к технической реализации |
| **Стек** | React 19, TypeScript 5.6, Vite 6, Fastify 5, Drizzle ORM, PostgreSQL 16, Redis 7 / BullMQ, Puppeteer 23, MinIO (S3), Claude API |

> Документ подробно описывает **техническую архитектуру и реализацию** системы. Ссылки вида `FR-n` указывают на функциональные требования PRD v2.0.

---

## 0. Принятые допущения и скоуп v2.0

| # | Направление | Решение для v2.0 |
|---|---|---|
| 1 | **Мотивационное и рекомендательное письма** | Включены в базовый скоуп (FR-11, FR-12). Генерируются на основе данных CV, оформляются в едином фирменном стиле шаблона. |
| 2 | **Анализ сильных и слабых сторон** | Включен в AI-модуль (FR-10). Сильные стороны интегрируются в CV; слабые стороны отображаются в дашборде аудита со стратегией их закрытия и рекомендациями. |
| 3 | **Адрес и Год рождения** | Полноценная поддержка в схеме данных (FR-2): структурированный адрес (страна, город, район, готовность к релокации/удаленке) и год рождения с гибким переключателем отображения (возраст / скрыть дату). |
| 4 | **Форматы экспорта** | 1) Desktop PDF (A4); 2) Mobile PDF (390px, 1 колонка, continuous vertical scroll); 3) Mobile PNG (1080px); 4) PDF писем; 5) Пакет отклика (ZIP-архив). |
| 5 | **Хранение ПДн** | Хранилище MinIO + PostgreSQL. В LLM передаются только обезличенные профессиональные данные (без контактов, фото и точных дат рождения). |

---

## 1. Общая архитектура системы

### 1.1. Архитектурная диаграмма

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Browser (React 19 SPA)                          │
│  - Step-by-Step Wizard (Личные, Опыт, Образование, Навыки, Письма)    │
│  - Live Dual-Preview (Desktop A4 / Mobile View 390px / Letter Preview) │
│  - AI Audit Panel (Сильные/слабые стороны, подсказки)                  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ HTTPS (REST + SSE)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Nginx Reverse Proxy & Gateway                     │
│  - SSL Termination, Rate Limiting, Static Caching, Gzip/Brotli         │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │ /api/v1                         │ /
                   ▼                                 ▼
┌─────────────────────────────────────┐      Static CDN / Web Assets
│        API Service (Fastify 5)      │
│  - Resume & Document CRUD           │
│  - Auth (Session, OAuth, Email Code)│────────► Anthropic Claude API
│  - AI Orchestrator & SSE Streaming  │          - Sonnet 3.5 (CV, Письма, Аудит)
│  - Validation & Anti-Hallucination  │          - Haiku 3.5 (Нормализация, Checks)
└──────────────┬──────────────┬───────┘
               │              │ BullMQ Jobs
      Postgres │              ▼
               │     ┌──────────────────────────────────────────────────┐
               │     │           Export Worker (Puppeteer Cluster)      │
               │     │  - Desktop PDF (A4 Paginated)                    │
               │     │  - Mobile PDF (390px Continuous)                 │
               │     │  - Mobile PNG (1080px Hi-Res)                    │
               │     │  - Cover & Recommendation Letter PDF             │
               │     │  - Zip Bundler (Архивация пакета соискателя)     │
               │     └───────────────┬──────────────────────────────────┘
               ▼                     ▼
      PostgreSQL 16             MinIO S3               Redis 7
      (Репозиторий резюме,     (Фотографии,          (Очереди задач,
       пользователи, аудиты)    экспортированные PDF) кэш сессий, RateLimits)
```

### 1.2. Структура монорепозитория

```
cv-builder/
├── apps/
│   ├── web/                         # React SPA (Vite)
│   │   ├── src/
│   │   │   ├── app/                 # Роутер, провайдеры контекста
│   │   │   ├── features/
│   │   │   │   ├── wizard/          # Пошаговая форма (FR-1 — FR-7)
│   │   │   │   ├── preview/         # Двухрежимное живое превью (A4/Mobile)
│   │   │   │   ├── ai-audit/        # Виджет сильных/слабых сторон (FR-10)
│   │   │   │   ├── documents/       # Редакторы Cover & Recommendation писем (FR-11, FR-12)
│   │   │   │   ├── design/          # Селекторы шаблонов, тем, шрифтов (FR-13, FR-14)
│   │   │   │   └── export/          # Модалка скачивания PDF/PNG/ZIP
│   │   │   ├── pages/
│   │   │   │   ├── EditorPage.tsx   # Главная рабочая область
│   │   │   │   └── RenderPage.tsx   # Изолированный роут для Puppeteer-рендеринга
│   │   │   └── store/resumeStore.ts # Клиентское состояние Zustand
│   ├── api/                         # Backend-сервис Fastify
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── resumes/         # Управление резюме и версионирование
│   │   │   │   ├── ai/              # Пайплайн генерации, стриминг SSE
│   │   │   │   ├── letters/         # Мотивационные и рекомендательные письма
│   │   │   │   ├── export/          # Постановка задач экспорта в BullMQ
│   │   │   │   └── photos/          # Загрузка и кроп через sharp
│   │   │   ├── db/                  # Drizzle ORM схемы и клиенты
│   │   │   └── server.ts
│   └── worker/                      # Puppeteer фоновый воркер
│       └── src/
│           ├── pdf-renderer.ts      # Генерация A4 и Mobile PDF
│           ├── letter-renderer.ts   # Рендеринг сопроводительных писем
│           └── zip-bundler.ts       # Упаковка пакета в ZIP
├── packages/
│   ├── shared/                      # Общие Zod-схемы, типы TypeScript, утилиты
│   ├── templates/                   # React-компоненты шаблонов резюме и бланков писем
│   └── ai-prompts/                  # Системные промпты, JSON-схемы ответов, валидаторы
```

---

## 2. Модель данных и Zod-схемы

### 2.1. Полная схема данных (`packages/shared/src/schema.ts`)

```typescript
import { z } from 'zod';

export const LangEnum = z.enum(['ru', 'uz', 'en']);
export const TemplateIdEnum = z.enum(['modern', 'classic', 'minimal', 'creative', 'ats']);
export const ToneEnum = z.enum(['corporate', 'confident', 'creative']);
export const DegreeLevelEnum = z.enum(['school', 'college', 'bachelor', 'master', 'phd', 'course']);
export const LangLevelEnum = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'native']);

const yearMonthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
const uuidSchema = z.string().uuid();

// 1. Персональные данные и локация (FR-1, FR-2)
export const PersonalSchema = z.object({
  fullName: z.string().trim().min(2, 'Имя слишком короткое').max(100),
  targetPosition: z.string().trim().min(2).max(100),
  birthYear: z.number().int().min(1940).max(new Date().getFullYear() - 14),
  showAge: z.boolean().default(true),
  hideBirthDate: z.boolean().default(false),
  photoKey: z.string().optional(),
  photoCrop: z.object({
    x: z.number(),
    y: z.number(),
    zoom: z.number(),
    aspect: z.literal(1),
  }).optional(),
  address: z.object({
    country: z.string().trim().min(1).max(60),
    city: z.string().trim().min(1).max(60),
    districtOrStreet: z.string().trim().max(100).optional(),
    willingToRelocate: z.boolean().default(false),
    remoteWork: z.boolean().default(false),
  }),
});

// 2. Контакты (FR-3)
export const ContactsSchema = z.object({
  phone: z.string().regex(/^\+\d{7,15}$/, 'Некорректный номер телефона'),
  email: z.string().email('Некорректный email').max(120),
  telegram: z.string().regex(/^@?[a-zA-Z0-9_]{5,32}$/).optional(),
  linkedin: z.string().url().optional(),
  githubOrPortfolio: z.string().url().optional(),
  website: z.string().url().optional(),
});

// 3. Опыт и места работы (FR-4)
export const ExperienceItemSchema = z.object({
  id: uuidSchema,
  company: z.string().trim().min(1, 'Укажите компанию').max(100),
  role: z.string().trim().min(1, 'Укажите должность').max(100),
  location: z.string().trim().max(60).optional(),
  startDate: z.string().regex(yearMonthRegex),
  endDate: z.string().regex(yearMonthRegex).nullable(),
  isCurrent: z.boolean().default(false),
  rawDescription: z.string().max(2000),
  aiProcessedBullets: z.array(z.string().max(250)).max(6).optional(),
  keyAchievements: z.array(z.string().max(250)).max(3).optional(),
  useAi: z.boolean().default(true),
}).refine(exp => exp.isCurrent || (exp.endDate && exp.endDate >= exp.startDate), {
  message: 'Дата окончания не может быть раньше даты начала',
  path: ['endDate'],
});

// 4. Образование (FR-5)
export const EducationItemSchema = z.object({
  id: uuidSchema,
  institution: z.string().trim().min(1).max(150),
  facultyOrSpecialty: z.string().trim().min(1).max(150),
  degreeLevel: DegreeLevelEnum,
  graduationYear: z.number().int().min(1960).max(new Date().getFullYear() + 6),
});

// 5. Навыки (FR-6)
export const SkillsSchema = z.object({
  hard: z.array(z.object({
    name: z.string().trim().min(1).max(50),
    level: z.number().int().min(1).max(5).optional(),
  })).max(30),
  soft: z.array(z.string().trim().min(1).max(50)).max(15),
  languages: z.array(z.object({
    name: z.string().trim().min(1).max(40),
    level: LangLevelEnum,
  })).max(8),
});

// 6. ИИ Анализ резюме: Саммари, Сильные и Слабые стороны (FR-8, FR-9, FR-10)
export const AiAnalysisSchema = z.object({
  summary: z.string().max(800).optional(),
  strengths: z.array(z.object({
    title: z.string().max(80),
    description: z.string().max(300),
    matchedExperienceId: uuidSchema.optional(),
  })).max(5).default([]),
  weaknesses: z.array(z.object({
    area: z.string().max(80),
    description: z.string().max(300),
    recommendation: z.string().max(400),
  })).max(5).default([]),
  completenessScore: z.number().min(0).max(100).default(0),
  tone: ToneEnum.default('confident'),
  generatedAt: z.string().datetime().optional(),
  inputHash: z.string().optional(),
});

// 7. Сопроводительные документы (FR-11, FR-12)
export const AttachedDocumentsSchema = z.object({
  coverLetter: z.object({
    targetCompany: z.string().trim().max(100).optional(),
    targetVacancy: z.string().trim().max(100).optional(),
    recipientName: z.string().trim().max(100).optional(),
    body: z.string().max(3500),
    updatedAt: z.string().datetime(),
    isEnabled: z.boolean().default(false),
  }).optional(),
  recommendationLetter: z.object({
    recommenderName: z.string().trim().max(100),
    recommenderRole: z.string().trim().max(100),
    recommenderCompany: z.string().trim().max(100),
    relationship: z.enum(['supervisor', 'team_lead', 'mentor', 'colleague']),
    body: z.string().max(3500),
    updatedAt: z.string().datetime(),
    isEnabled: z.boolean().default(false),
  }).optional(),
});

// 8. Дизайн и отображение (FR-13, FR-14)
export const DesignSchema = z.object({
  templateId: TemplateIdEnum.default('modern'),
  themeId: z.string().default('blue'),
  customColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  fontFamily: z.enum(['inter', 'roboto', 'pt', 'montserrat']).default('inter'),
  fontSize: z.enum(['compact', 'normal', 'spacious']).default('normal'),
  sectionOrder: z.array(z.string()).default([
    'summary', 'experience', 'education', 'skills', 'languages', 'strengths'
  ]),
  hiddenSections: z.array(z.string()).default([]),
});

// Основная схема резюме
export const ResumeDataSchema = z.object({
  id: uuidSchema,
  schemaVersion: z.literal(2),
  language: LangEnum.default('ru'),
  noExperience: z.boolean().default(false),
  personal: PersonalSchema,
  contacts: ContactsSchema,
  experience: z.array(ExperienceItemSchema).max(15),
  education: z.array(EducationItemSchema).max(10),
  skills: SkillsSchema,
  aiAnalysis: AiAnalysisSchema,
  documents: AttachedDocumentsSchema.default({}),
  design: DesignSchema,
  updatedAt: z.string().datetime(),
});

export type ResumeData = z.infer<typeof ResumeDataSchema>;
```

---

### 2.2. Схема базы данных (PostgreSQL + Drizzle)

```sql
-- Таблица пользователей
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         citext UNIQUE,
  telegram_id   bigint UNIQUE,
  plan          text NOT NULL DEFAULT 'free',
  ui_lang       text NOT NULL DEFAULT 'ru',
  created_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

-- Таблица анонимных и авторизованных сессий
CREATE TABLE sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES users(id) ON DELETE CASCADE,
  token_hash    text NOT NULL UNIQUE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL
);

-- Таблица резюме со встроенными документами
CREATE TABLE resumes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  owner_session uuid REFERENCES sessions(id) ON DELETE SET NULL,
  title         text NOT NULL DEFAULT 'Резюме',
  data          jsonb NOT NULL,
  version       integer NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (owner_user_id IS NOT NULL OR owner_session IS NOT NULL)
);

CREATE INDEX resumes_owner_user_idx ON resumes(owner_user_id);
CREATE INDEX resumes_owner_session_idx ON resumes(owner_session);

-- Журнал ИИ-генераций (аудит, токены, качество)
CREATE TABLE ai_generations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id     uuid NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  block         text NOT NULL, -- full_audit | summary | experience | cover_letter | recommendation
  model         text NOT NULL,
  input_tokens  integer,
  output_tokens integer,
  latency_ms    integer,
  status        text NOT NULL, -- success | validation_error | provider_error
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Таблица задач экспорта
CREATE TABLE exports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id     uuid NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  format        text NOT NULL, -- pdf-desktop | pdf-mobile | png-mobile | pdf-cover-letter | pdf-recommendation | zip-kit
  status        text NOT NULL, -- queued | processing | done | failed
  file_key      text,
  file_size     integer,
  error_message text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
```

---

## 3. Спецификация API (Fastify)

Базовый путь: `/api/v1`. Все запросы мутации требуют заголовок `X-Requested-With: cvb`.

### 3.1. CRUD резюме и документов

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/resumes` | Список резюме текущего пользователя/сессии |
| `POST` | `/resumes` | Создать новое резюме (дефолтная схема) |
| `GET` | `/resumes/:id` | Получить полные данные резюме и документов |
| `PATCH` | `/resumes/:id` | Частичное автосохранение `{ version, patch: Partial<ResumeData> }` |
| `POST` | `/resumes/:id/duplicate`| Клонировать резюме |
| `DELETE`| `/resumes/:id` | Удалить резюме и привязанные файлы из S3 |
| `POST` | `/resumes/:id/photo` | Загрузка и кроп фото (multipart/form-data) |

### 3.2. AI-эндпоинты

#### 1. Полная генерация и аудит (SSE): `POST /resumes/:id/ai/process-all`
Запуск потоковой генерации полного пакета: нормализация навыков, STAR-опыт, Summary, анализ сильных и слабых сторон.
- **Event-Stream протокол**:
  ```text
  event: stage
  data: {"stage":"normalizing_skills","progress":15}

  event: skills
  data: {"hard":["React","TypeScript","PostgreSQL"],"soft":["Code Review"]}

  event: stage
  data: {"stage":"analyzing_strengths_weaknesses","progress":45}

  event: audit
  data: {"strengths":[{"title":"Senior Frontend Стек","description":"..."}],"weaknesses":[{"area":"Опыт в компании X","description":"...","recommendation":"..."}]}

  event: summary
  data: {"text":"Опытный Frontend-разработчик с 5-летним стажем..."}

  event: experience_item
  data: {"id":"uuid","bullets":["Спроектировал архитектуру микрофронтендов..."]}

  event: complete
  data: {"version":3,"completenessScore":92}
  ```

#### 2. Генерация мотивационного письма: `POST /resumes/:id/ai/cover-letter`
- **Тело запроса**:
  ```json
  {
    "targetCompany": "Yandex",
    "targetVacancy": "Senior Frontend Engineer",
    "jobDescription": "Ищем сильного инженера для развития дизайн-системы...",
    "tone": "confident"
  }
  ```
- **Ответ**: `{ "body": "Уважаемая команда Yandex!...", "updatedAt": "..." }`

#### 3. Генерация рекомендательного письма: `POST /resumes/:id/ai/recommendation-letter`
- **Тело запроса**:
  ```json
  {
    "recommenderName": "Алексей Смирнов",
    "recommenderRole": "CTO",
    "recommenderCompany": "FinTech Lab",
    "relationship": "supervisor"
  }
  ```
- **Ответ**: `{ "body": "Настоящим письмом подтверждаю, что...", "updatedAt": "..." }`

### 3.3. Экспорт документов

`POST /resumes/:id/export`
- **Тело**:
  ```json
  {
    "format": "pdf-desktop" | "pdf-mobile" | "png-mobile" | "pdf-cover-letter" | "pdf-recommendation" | "zip-kit"
  }
  ```
- **Ответ (202 Accepted)**: `{ "exportId": "uuid" }`
- **Опрос статуса**: `GET /exports/:exportId` → `{ "status": "done", "downloadUrl": "https://..." }`

---

## 4. Спецификация модуля искусственного интеллекта

### 4.1. Распределение моделей и задач

| Задача | Модель | Max Tokens | Таймаут |
|---|---|---|---|
| **Нормализация навыков и рубрикация** | `claude-3-5-haiku` | 800 | 12 сек |
| **Саммари + STAR-опыт работы** | `claude-3-5-sonnet` | 3500 | 35 сек |
| **Аудит: сильные и слабые стороны + советы** | `claude-3-5-sonnet` | 2000 | 25 сек |
| **Мотивационное письмо (Cover Letter)** | `claude-3-5-sonnet` | 2000 | 25 сек |
| **Рекомендательное письмо** | `claude-3-5-sonnet` | 2000 | 20 сек |

### 4.2. Системный промпт: Анализ сильных и слабых сторон (FR-10)

```text
Ты — строгий и конструктивный HRD и карьерный ментор международного уровня.
Проведи глубокий аудит профиля кандидата для должности "{{targetPosition}}".

Входные данные:
- Опыт: {{experience_json}}
- Образование: {{education_json}}
- Навыки: {{skills_json}}
- Язык ответа: {{language}}

Требования к анализу:
1. ВЫДЕЛИ 3-5 СИЛЬНЫХ СТОРОН (Strengths):
   - Уникальные конкурентные преимущества, редкие связки навыков, явные бизнес-результаты.
   - Каждая сильная сторона должна иметь четкую привязку к конкретному месту работы или проекту.

2. ВЫЯВИ 2-4 СЛАБЫХ СТОРОНЫ И СЛЕПЫХ ЗОН (Weaknesses & Gaps):
   - Пробелы в стаже, отсутствие метрик в недавних проектах, отсутствие критических для "{{targetPosition}}" технологий.
   - ДЛЯ КАЖДОЙ СЛАБОЙ СТОРОНЫ ДАЙ ЧЕТКУЮ РЕКОМЕНДАЦИЮ: как кандидату закрыть или правильно компенсировать этот пробел на интервью или в резюме.

3. РАССЧИТАЙ ИНДЕКС ПОЛНОТЫ РЕЗЮМЕ (completenessScore от 0 до 100).

Запрещено использовать общие слова («хороший специалист», «мало опыта»). Будь предельно точен.
Вывод строго через инструмент submit_audit.
```

### 4.3. Системный промпт: Мотивационное письмо (FR-11)

```text
Ты — эксперт по карьерным коммуникациям.
Напиши убедительное персонализированное мотивационное письмо от лица кандидата на вакансию "{{targetVacancy}}" в компанию "{{targetCompany}}".

Правила:
1. Структура:
   - Крючок (Hook): почему кандидат обратил внимание именно на эту компанию.
   - Доказательная база (Fit): 2 сильнейших кейса/достижения из опыта, которые напрямую решают задачи роли.
   - Ценности и Soft Skills: стиль командного взаимодействия.
   - Call to action: готовность к интервью.
2. Тон: деловой, энергичный, без подхалимажа и клише.
3. Опирайся ТОЛЬКО на факты из переданного резюме: {{resume_data}}.
4. Длина: 250–350 слов.
Вывод через инструмент submit_cover_letter.
```

---

## 5. Модуль шаблонов дизайна и тем

### 5.1. Дизайн-система (`packages/templates`)

Все шаблоны реализуют единый интерфейс свойств:
```typescript
export interface TemplateProps {
  data: ResumeData;
  format: 'desktop' | 'mobile';
  photoUrl?: string;
  theme: ColorPalette;
}
```

#### Матрица шаблонов:
1. **Modern (`modern`)**:
   - *Desktop*: 2 колонки. Левая колонка (33%) содержит фото, контакты, навыки, языки и сильные стороны с цветной фоновой подложкой (`--sidebar-bg`). Правая колонка — опыт и образование.
   - *Mobile*: 1 колонка. Шапка с фото → контактные плашки → опыт → сильные стороны → навыки.
2. **Classic (`classic`)**:
   - *Desktop/Mobile*: 1 колонка. Серифная благородная гарнитура (PT Serif / Georgia), разделительные линии (`--rule`), контакты в одну строчку через буллеты.
3. **Minimal (`minimal`)**:
   - Ультра-чистый дизайн, акцентная сетка 20/80 для заголовков секций, без иконок и графических плашек.
4. **Creative (`creative`)**:
   - Полноэкранный брендированный заголовок (`--header-bg`), бейджи навыков со статусными точками, акцентная типографика Montserrat.
5. **ATS Executive (`ats`)**:
   - Строгая монохромная структура, стандартные заголовки `H2`, полное отсутствие псевдоэлементов, таблиц и графических заливок для идеального парсинга роботами.

### 5.2. Генерация палитр (OKLCH Color Engine)

Используется библиотека `culori` для математически выверенного расчета контраста:
```typescript
import { formatHex, wcagContrast, oklch } from 'culori';

export function buildPalette(accentHex: string) {
  let color = oklch(accentHex);

  // Контроль контрастности WCAG 2.1 AA (≥ 4.5:1 с белым фоном)
  while (wcagContrast(formatHex(color), '#ffffff') < 4.5 && color.l > 0.2) {
    color.l -= 0.02; // Затемняем оттенок
  }

  const baseAccent = formatHex(color);
  return {
    '--accent': baseAccent,
    '--accent-hover': formatHex({ ...color, l: Math.max(0, color.l - 0.08) }),
    '--accent-soft': formatHex({ ...color, l: 0.96, c: color.c * 0.2 }),
    '--sidebar-bg': formatHex({ ...color, l: 0.98, c: color.c * 0.1 }),
    '--text-primary': '#0f172a',
    '--text-muted': '#475569',
    '--bg-surface': '#ffffff',
    '--rule': '#e2e8f0',
  };
}
```

---

## 6. Двухрежимный движок рендеринга PDF (Puppeteer)

### 6.1. Рендеринг Desktop PDF (A4)
- **Viewport**: 794 × 1123 px (эквивалент 96 DPI A4).
- **CSS-правила печати**:
  ```css
  @page {
    size: A4 portrait;
    margin: 15mm 15mm 18mm 15mm;
  }
  .page-break-avoid {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .section-title {
    break-after: avoid !important;
  }
  ```
- **Параметры Puppeteer**:
  ```typescript
  await page.pdf({
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
    tagged: true // Векторный доступный PDF
  });
  ```

### 6.2. Рендеринг Mobile-Optimized PDF
- **Концепция**: Резюме для комфортного чтения с экранов смартфонов без горизонтального зума и разрывов на страницы.
- **Viewport**: `width: 390px`, `height: 844px`, `deviceScaleFactor: 2`.
- **Вычисление высоты и генерация**:
  ```typescript
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  // Ожидание завершения отрисовки веб-шрифтов и картинок
  await page.waitForFunction('window.__RENDER_READY__ === true');

  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);

  // Одностраничный непрерывный PDF под высоту контента
  await page.pdf({
    width: '390px',
    height: `${scrollHeight + 2}px`,
    printBackground: true,
    pageRanges: '1',
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  ```

### 6.3. Рендеринг сопроводительных писем (Letters)
- Документы генерируются в едином стиле с выбранным шаблоном (совпадающие шрифты, цветовые акценты и контактная шапка кандидата).
- Стандартный формат A4 с полями для даты, подписи и адресата.

### 6.4. Формирование ZIP-пакета (Job Application Kit)
Воркер использует стриминговый упаковщик `archiver`:
- `Ivanov_Ivan_CV_Desktop.pdf` (Версия для отправки HR и ATS).
- `Ivanov_Ivan_CV_Mobile.pdf` (Версия для мессенджеров).
- `Ivanov_Ivan_Cover_Letter.pdf` (Мотивационное письмо).
- `Ivanov_Ivan_Recommendation.pdf` (Рекомендательное письмо).

---

## 7. Пользовательский интерфейс и состояние (Frontend)

### 7.1. Стор состояния (`apps/web/src/store/resumeStore.ts`)

```typescript
interface ResumeState {
  data: ResumeData;
  activeDocTab: 'cv' | 'cover-letter' | 'recommendation';
  previewMode: 'desktop' | 'mobile';
  isAiGenerating: boolean;
  aiStepProgress: number;
  unsavedChanges: boolean;

  // Действия формы
  updatePersonal: (personal: Partial<ResumeData['personal']>) => void;
  updateContacts: (contacts: Partial<ResumeData['contacts']>) => void;
  addExperience: () => void;
  updateExperience: (id: string, exp: Partial<ResumeData['experience'][0]>) => void;
  removeExperience: (id: string) => void;
  reorderExperience: (fromIndex: number, toIndex: number) => void;

  // ИИ аудит и письма
  applyAiAudit: (audit: ResumeData['aiAnalysis']) => void;
  updateCoverLetter: (body: string) => void;
  updateRecommendationLetter: (body: string) => void;

  // Дизайн
  setTemplate: (templateId: ResumeData['design']['templateId']) => void;
  setTheme: (themeId: string) => void;
  setCustomColor: (hex: string) => void;
  setPreviewMode: (mode: 'desktop' | 'mobile') => void;
}
```

### 7.2. UI-экран конструктора

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Лого] Резюме: Frontend Lead  [Сохранено ✓]  [Вкладки: CV | Письмо | Рекомендация] │
├───────────────────────────────────┬────────────────────────────────────┤
│           ЛЕВАЯ ПАНЕЛЬ (45%)      │         ПРАВАЯ ПАНЕЛЬ (55%)        │
│                                   │                                    │
│  [Шаги: 1.Инфо 2.Опыт 3.Навыки]   │  Тулбар: [Modern ▾] [●●●● Палитра] │
│                                   │  Вид:    [🖥 ПК A4]   [📱 Телефон]  │
│  Форма шага:                      ├────────────────────────────────────┤
│  - Фото с кропом                  │                                    │
│  - ФИО, Должность, Год рождения   │       ЖИВОЕ ПРЕВЬЮ ВЫБРАННОГО      │
│  - Адрес (Город, Релокация)       │              ДОКУМЕНТА             │
│                                   │        (Интерактивный скролл       │
│  [✨ Запустить ИИ-аудит и сборку] │         с подсветкой изменений)    │
│                                   │                                    │
│  АУДИТ ПРОФИЛЯ:                   │                                    │
│  ✓ 4 сильные стороны              │                                    │
│  ⚠ 2 зоны роста (с советами)      ├────────────────────────────────────┤
│                                   │  [⬇ Скачать PDF] ▾ [ZIP-комплект]  │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 8. Безопасность и соответствие закону о персональных данных

1. **Минимизация данных для LLM**:
   - Перед отправкой данных в Claude API серверный сервис вырезает телефон, email, ссылки на соцсети, точный адрес (оставляет только город) и фамилию (заменяет на псевдоним `Кандидат`).
2. **Безопасность Puppeteer**:
   - Процесс Puppeteer запускается в изолированном контейнере с сетевой политикой `internal-only` (запрещен прямой доступ в интернет). Доступ разрешен только к служебному хосту `http://nginx-internal/render/:id`.
3. **Защита файлов в S3**:
   - Все файлы хранятся в приватных бакетах. Ссылки на скачивание генерируются как presigned GET URLs с ограниченным сроком жизни (15 минут).

---

## 9. План тестирования и критерии готовности (DoD)

### 9.1. Матрица тестов
| Уровень | Стек | Что покрывается | Критерий прохождения |
|---|---|---|---|
| **Unit** | Vitest | Валидаторы Zod, генератор палитры WCAG 2.1 AA, санитизация данных перед LLM | 100% критических утилит |
| **Интеграция** | Supertest / Fastify | CRUD резюме, SSE стриминг, генерация писем, BullMQ воркер | Все коды ответов 200, 400, 409, 429 |
| **Визуальные тесты** | Playwright | Pixel-perfect соответствие превью в браузере и сгенерированного Puppeteer PDF на 5 шаблонах | Отклонение пикселей ≤ 0.3% |
| **ATS парсинг** | Tesseract / PDF-Parse | Проверка индексируемости и корректности чтения текстового слоя в A4 PDF | 100% читаемость ключевых секций |

### 9.2. Определение готовности (Definition of Done)
- [x] Схемы данных обновлены до версии 2 с поддержкой адреса, года рождения, писем и аудита.
- [x] ИИ корректно генерирует Summary, STAR-пункты, список сильных сторон и список слабых сторон с практическими рекомендациями.
- [x] Реализована генерация и редактирование Мотивационного и Рекомендательного писем.
- [x] Поддерживаются 5 шаблонов и 8 палитр со сменой в реальном времени.
- [x] Puppeteer воркер отдает чистый A4 PDF (для ПК) и узкий одностраничный Mobile PDF (390px).
