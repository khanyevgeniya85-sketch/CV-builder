import React from 'react';
import { TemplateProps } from '../types.js';
import { ContactsList } from '../components/ContactsList.js';
import { ExperienceSection } from '../components/ExperienceSection.js';
import { ProjectsSection } from '../components/ProjectsSection.js';
import { EducationSection } from '../components/EducationSection.js';
import { SkillsSection } from '../components/SkillsSection.js';
import { StrengthsSection } from '../components/StrengthsSection.js';
import { SummarySection } from '../components/SummarySection.js';
import { formatCandidateMeta } from '../i18n.js';

export const MinimalTemplate: React.FC<TemplateProps> = ({ data, format, t }) => {
  const { personal, contacts, experience, projects, education, skills, ai, design } = data;
  const isHidden = (sec: string) => design.hiddenSections?.includes(sec as any);
  const metaText = formatCandidateMeta(personal, data.language || 'ru');

  return (
    <div className="cvb-tpl-minimal">
      <header className="cvb-minimal-header">
        <h1 className="cvb-candidate-name">{personal.fullName || 'Ваше Имя'}</h1>
        <div className="cvb-candidate-position">{personal.position || 'Желаемая должность'}</div>
        {metaText && <div className="cvb-candidate-city">{metaText}</div>}

        <ContactsList contacts={contacts} format={format} themeStyle="inline" className="mt-3" />
      </header>

      <div className="cvb-minimal-spacer" />

      {design.sectionOrder.map((sectionKey) => {
        if (isHidden(sectionKey)) return null;

        let content: React.ReactNode = null;
        const title = t(sectionKey);

        switch (sectionKey) {
          case 'summary':
            if (!ai.summary) return null;
            content = <SummarySection summary={ai.summary} />;
            break;

          case 'strengths':
            if (!ai.strengths || ai.strengths.length === 0) return null;
            content = <StrengthsSection items={ai.strengths} />;
            break;

          case 'experience':
            if (data.noExperience || !experience || experience.length === 0) return null;
            content = <ExperienceSection items={experience} lang={data.language} templateStyle="minimal" />;
            break;

          case 'projects':
            if (!projects || projects.length === 0) return null;
            content = <ProjectsSection items={projects} templateStyle="minimal" />;
            break;

          case 'education':
            if (!education || education.length === 0) return null;
            content = <EducationSection items={education} lang={data.language} templateStyle="minimal" />;
            break;

          case 'skills':
            content = <SkillsSection skills={skills} lang={data.language} layout="tags" />;
            break;

          default:
            return null;
        }

        return (
          <div key={sectionKey} className="cvb-minimal-row break-inside-avoid">
            <div className="cvb-minimal-label-col">
              <h2 className="cvb-minimal-section-title">{title}</h2>
            </div>
            <div className="cvb-minimal-content-col">
              {content}
            </div>
          </div>
        );
      })}
    </div>
  );
};
