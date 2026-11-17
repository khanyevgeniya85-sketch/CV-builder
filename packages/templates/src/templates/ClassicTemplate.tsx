import React from 'react';
import { TemplateProps } from '../types.js';
import { ContactsList } from '../components/ContactsList.js';
import { SectionHeader } from '../components/SectionHeader.js';
import { ExperienceSection } from '../components/ExperienceSection.js';
import { ProjectsSection } from '../components/ProjectsSection.js';
import { EducationSection } from '../components/EducationSection.js';
import { SkillsSection } from '../components/SkillsSection.js';
import { StrengthsSection } from '../components/StrengthsSection.js';
import { SummarySection } from '../components/SummarySection.js';
import { formatCandidateMeta } from '../i18n.js';

export const ClassicTemplate: React.FC<TemplateProps> = ({ data, format, photoUrl, t }) => {
  const { personal, contacts, experience, projects, education, skills, ai, design } = data;
  const isHidden = (sec: string) => design.hiddenSections?.includes(sec as any);
  const metaText = formatCandidateMeta(personal, data.language || 'ru');
  const photoFilter = personal.photoFilter || 'natural';
  const photoShape = personal.photoShape || 'square';

  return (
    <div className="cvb-tpl-classic">
      <header className="cvb-classic-header">
        <div className="cvb-classic-header-info">
          <h1 className="cvb-candidate-name">{personal.fullName || 'Ваше Имя'}</h1>
          <div className="cvb-candidate-position">{personal.position || 'Желаемая должность'}</div>

          {metaText && <div className="cvb-candidate-city">{metaText}</div>}

          <ContactsList contacts={contacts} format={format} themeStyle="inline" className="mt-3" />
        </div>

        {photoUrl && (
          <div className="cvb-classic-photo-wrap">
            <img
              src={photoUrl}
              alt={personal.fullName}
              className="cvb-photo-classic"
              data-photo-filter={photoFilter}
              data-photo-shape={photoShape}
            />
          </div>
        )}
      </header>

      <div className="cvb-classic-divider" />

      {design.sectionOrder.map((sectionKey) => {
        if (isHidden(sectionKey)) return null;

        switch (sectionKey) {
          case 'summary':
            if (!ai.summary) return null;
            return (
              <section key="summary" className="cvb-section-block">
                <SectionHeader title={t('summary')} style="classic" />
                <SummarySection summary={ai.summary} />
              </section>
            );

          case 'strengths':
            if (!ai.strengths || ai.strengths.length === 0) return null;
            return (
              <section key="strengths" className="cvb-section-block">
                <SectionHeader title={t('strengths')} style="classic" />
                <StrengthsSection items={ai.strengths} />
              </section>
            );

          case 'experience':
            if (data.noExperience || !experience || experience.length === 0) return null;
            return (
              <section key="experience" className="cvb-section-block">
                <SectionHeader title={t('experience')} style="classic" />
                <ExperienceSection items={experience} lang={data.language} templateStyle="classic" />
              </section>
            );

          case 'projects':
            if (!projects || projects.length === 0) return null;
            return (
              <section key="projects" className="cvb-section-block">
                <SectionHeader title={t('projects')} style="classic" />
                <ProjectsSection items={projects} templateStyle="classic" />
              </section>
            );

          case 'education':
            if (!education || education.length === 0) return null;
            return (
              <section key="education" className="cvb-section-block">
                <SectionHeader title={t('education')} style="classic" />
                <EducationSection items={education} lang={data.language} templateStyle="classic" />
              </section>
            );

          case 'skills':
            return (
              <section key="skills" className="cvb-section-block">
                <SectionHeader title={t('skills')} style="classic" />
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
