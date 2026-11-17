import { TemplateId, DEFAULT_SECTION_ORDER } from '@cvb/shared';
import { TemplateDefinition } from './types.js';
import { ClassicTemplate } from './templates/ClassicTemplate.js';
import { ModernTemplate } from './templates/ModernTemplate.js';
import { MinimalTemplate } from './templates/MinimalTemplate.js';
import { CreativeTemplate } from './templates/CreativeTemplate.js';
import { AtsTemplate } from './templates/AtsTemplate.js';

export const templates: Record<TemplateId, TemplateDefinition> = {
  classic: {
    id: 'classic',
    name: { ru: 'Классический', uz: 'Klassik', en: 'Classic' },
    photo: 'optional',
    supportsSkillLevels: true,
    supportsThemes: 'full',
    defaultSectionOrder: [...DEFAULT_SECTION_ORDER],
    Component: ClassicTemplate,
  },
  modern: {
    id: 'modern',
    name: { ru: 'Современный', uz: 'Zamonaviy', en: 'Modern' },
    photo: 'circle',
    supportsSkillLevels: true,
    supportsThemes: 'full',
    defaultSectionOrder: [...DEFAULT_SECTION_ORDER],
    Component: ModernTemplate,
  },
  minimal: {
    id: 'minimal',
    name: { ru: 'Минималистичный', uz: 'Minimal', en: 'Minimal' },
    photo: 'none',
    supportsSkillLevels: false,
    supportsThemes: 'full',
    defaultSectionOrder: [...DEFAULT_SECTION_ORDER],
    Component: MinimalTemplate,
  },
  creative: {
    id: 'creative',
    name: { ru: 'Креативный', uz: 'Kreativ', en: 'Creative' },
    photo: 'square',
    supportsSkillLevels: true,
    supportsThemes: 'full',
    defaultSectionOrder: [...DEFAULT_SECTION_ORDER],
    Component: CreativeTemplate,
  },
  ats: {
    id: 'ats',
    name: { ru: 'ATS-совместимый', uz: 'ATS-mos', en: 'ATS-Friendly' },
    photo: 'none',
    supportsSkillLevels: false,
    supportsThemes: 'accent-only',
    defaultSectionOrder: [...DEFAULT_SECTION_ORDER],
    Component: AtsTemplate,
  },
};
