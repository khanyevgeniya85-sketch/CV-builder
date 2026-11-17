import React from 'react';
import { TemplateProps } from '../types.js';
import { ExperienceSection } from '../components/ExperienceSection.js';
import { ProjectsSection } from '../components/ProjectsSection.js';
import { EducationSection } from '../components/EducationSection.js';
import { SkillsSection } from '../components/SkillsSection.js';
import { StrengthsSection } from '../components/StrengthsSection.js';
import { SummarySection } from '../components/SummarySection.js';
import { formatCandidateMeta } from '../i18n.js';

export const AtsTemplate: React.FC<TemplateProps> = ({ data, t }) => {
  const { personal, contacts, experience, projects, education, skills, ai, design } = data;
  const isHidden = (sec: string) => design.hiddenSections?.includes(sec as any);
  const metaText = formatCandidateMeta(personal, data.language || 'ru');

  const contactPieces = [
    contacts.phone,
    contacts.email,
    contacts.telegram && (contacts.telegram.startsWith('@') ? contacts.telegram : `@${contacts.telegram}`),
    contacts.linkedin,
    contacts.website,
    metaText,
  ].filter(Boolean);

  return (
    <div className="cvb-tpl-ats">
      <header className="cvb-ats-header">
        <h1 className="cvb-ats-name">{personal.fullName || 'Ваше Имя'}</h1>
        <div className="cvb-ats-position">{personal.position || 'Желаемая должность'}</div>
        <div className="cvb-ats-contacts">
          {contactPieces.join('  |  ')}
        </div>
      </header>

      <div className="cvb-ats-divider" />

      {design.sectionOrder.map((sectionKey) => {
        if (isHidden(sectionKey)) return null;

        switch (sectionKey) {
          case 'summary':
            return ai.summary ? (
              <section key="summary" className="cvb-ats-section">
                <h2 className="cvb-ats-title">{t('summary').toUpperCase()}</h2>
                <SummarySection summary={ai.summary} />
              </section>
            ) : null;

          case 'strengths':
            return ai.strengths && ai.strengths.length > 0 ? (
              <section key="strengths" className="cvb-ats-section">
                <h2 className="cvb-ats-title">{t('strengths').toUpperCase()}</h2>
                <StrengthsSection items={ai.strengths} />
              </section>
            ) : null;

          case 'experience':
            return !data.noExperience && experience && experience.length > 0 ? (
              <section key="experience" className="cvb-ats-section">
                <h2 className="cvb-ats-title">{t('experience').toUpperCase()}</h2>
                <ExperienceSection items={experience} lang={data.language} templateStyle="ats" />
              </section>
            ) : null;

          case 'projects':
            return projects && projects.length > 0 ? (
              <section key="projects" className="cvb-ats-section">
                <h2 className="cvb-ats-title">{t('projects').toUpperCase()}</h2>
                <ProjectsSection items={projects} templateStyle="ats" />
              </section>
            ) : null;

          case 'education':
            return education && education.length > 0 ? (
              <section key="education" className="cvb-ats-section">
                <h2 className="cvb-ats-title">{t('education').toUpperCase()}</h2>
                <EducationSection items={education} lang={data.language} templateStyle="ats" />
              </section>
            ) : null;

          case 'skills':
            return (
              <section key="skills" className="cvb-ats-section">
                <h2 className="cvb-ats-title">{t('skills').toUpperCase()}</h2>
                <SkillsSection skills={skills} lang={data.language} layout="tags" />
              </section>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};
