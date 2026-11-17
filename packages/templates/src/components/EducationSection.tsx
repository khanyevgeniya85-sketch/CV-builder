import React from 'react';
import { EducationItem, Lang } from '@cvb/shared';
import { getEducationLevelName } from '../i18n.js';

interface EducationSectionProps {
  items: EducationItem[];
  lang: Lang;
  templateStyle?: 'classic' | 'modern' | 'minimal' | 'creative' | 'ats';
}

export const EducationSection: React.FC<EducationSectionProps> = ({ items, lang, templateStyle = 'modern' }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className={`cvb-education-list cvb-edu-${templateStyle}`}>
      {items.map((edu) => {
        const levelName = getEducationLevelName(edu.level, lang);

        return (
          <div key={edu.id} className="cvb-edu-item break-inside-avoid">
            <div className="cvb-edu-header-row">
              <span className="cvb-edu-specialty">{edu.specialty}</span>
              <span className="cvb-edu-year">{edu.graduationYear}</span>
            </div>
            <div className="cvb-edu-meta">
              <span className="cvb-edu-institution">{edu.institution}</span>
              {levelName && <span className="cvb-edu-level"> · {levelName}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};
