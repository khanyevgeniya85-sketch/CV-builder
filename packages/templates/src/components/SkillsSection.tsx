import React from 'react';
import { Skills, Lang } from '@cvb/shared';
import { getCommonLabel } from '../i18n.js';

interface SkillsSectionProps {
  skills: Skills;
  lang: Lang;
  layout?: 'sidebar' | 'tags' | 'list';
}

const LEVEL_NAMES: Record<number, Record<Lang, string>> = {
  1: { ru: 'Базовый', uz: 'Boshlang‘ich', en: 'Basic' },
  2: { ru: 'Базовый+', uz: 'Boshlang‘ich+', en: 'Basic+' },
  3: { ru: 'Уверенный', uz: 'O‘rta', en: 'Intermediate' },
  4: { ru: 'Продвинутый', uz: 'Yuqori', en: 'Advanced' },
  5: { ru: 'Эксперт', uz: 'Ekspert', en: 'Expert' },
};

export const SkillsSection: React.FC<SkillsSectionProps> = ({ skills, lang, layout = 'tags' }) => {
  const hasHard = skills.hard && skills.hard.length > 0;
  const hasSoft = skills.soft && skills.soft.length > 0;
  const hasLang = skills.languages && skills.languages.length > 0;

  if (!hasHard && !hasSoft && !hasLang) return null;

  return (
    <div className={`cvb-skills-section cvb-skills-${layout}`}>
      {hasHard && (
        <div className="cvb-skills-group">
          {layout !== 'sidebar' && (
            <div className="cvb-skills-subheading">{getCommonLabel('hardSkills', lang)}</div>
          )}
          <div className="cvb-tags-wrap">
            {skills.hard.map((skill, idx) => {
              const levelText = skill.level ? LEVEL_NAMES[skill.level]?.[lang] : null;
              return (
                <span key={idx} className="cvb-skill-tag">
                  <span className="cvb-skill-name">{skill.name}</span>
                  {levelText && <span className="cvb-skill-level"> ({levelText})</span>}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {hasSoft && (
        <div className="cvb-skills-group">
          <div className="cvb-skills-subheading">{getCommonLabel('softSkills', lang)}</div>
          <div className="cvb-tags-wrap">
            {skills.soft.map((soft, idx) => (
              <span key={idx} className="cvb-skill-tag cvb-soft-tag">
                {soft}
              </span>
            ))}
          </div>
        </div>
      )}

      {hasLang && (
        <div className="cvb-skills-group">
          <div className="cvb-skills-subheading">{getCommonLabel('languages', lang)}</div>
          <div className="cvb-languages-list">
            {skills.languages.map((l, idx) => (
              <div key={idx} className="cvb-lang-row">
                <span className="cvb-lang-name">{l.name}</span>
                <span className="cvb-lang-level">{l.level}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
