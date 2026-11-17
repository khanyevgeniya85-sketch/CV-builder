import React from 'react';
import { ResumeData, TemplateId, Lang, SectionKey } from '@cvb/shared';

export interface TemplateProps {
  data: ResumeData;
  format: 'desktop' | 'mobile';
  photoUrl?: string;
  t: (key: SectionKey | 'contacts') => string;
}

export interface TemplateDefinition {
  id: TemplateId;
  name: Record<Lang, string>;
  photo: 'none' | 'circle' | 'square' | 'optional';
  supportsSkillLevels: boolean;
  supportsThemes: 'full' | 'accent-only';
  defaultSectionOrder: SectionKey[];
  Component: React.FC<TemplateProps>;
}
