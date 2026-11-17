import React from 'react';
import { ExperienceItem, Lang } from '@cvb/shared';
import { getCommonLabel } from '../i18n.js';

interface ExperienceSectionProps {
  items: ExperienceItem[];
  lang: Lang;
  templateStyle?: 'classic' | 'modern' | 'minimal' | 'creative' | 'ats';
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({ items, lang, templateStyle = 'modern' }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className={`cvb-experience-list cvb-exp-${templateStyle}`}>
      {items.map((exp) => {
        const bullets = exp.useAi !== false && exp.aiBullets && exp.aiBullets.length > 0
          ? exp.aiBullets
          : exp.rawDescription
          ? exp.rawDescription.split('\n').filter(Boolean)
          : [];

        const isCurrent = !exp.endDate;
        const periodStr = `${exp.startDate} — ${isCurrent ? getCommonLabel('present', lang) : exp.endDate}`;

        return (
          <div key={exp.id} className="cvb-exp-item break-inside-avoid">
            <div className="cvb-exp-meta">
              <div className="cvb-exp-header-row">
                <span className="cvb-exp-role">{exp.role}</span>
                <span className="cvb-exp-period">{periodStr}</span>
              </div>
              <div className="cvb-exp-company">{exp.company}</div>
            </div>

            {bullets.length > 0 && (
              <ul className="cvb-bullets-list">
                {bullets.map((bullet, bIdx) => {
                  const isHighlighted = exp.highlights?.includes(bIdx);
                  return (
                    <li
                      key={bIdx}
                      className={`cvb-bullet-item ${isHighlighted ? 'cvb-bullet-highlight' : ''}`}
                    >
                      {bullet}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};
