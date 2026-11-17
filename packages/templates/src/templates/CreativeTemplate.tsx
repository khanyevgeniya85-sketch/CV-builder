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

export const CreativeTemplate: React.FC<TemplateProps> = ({ data, format, photoUrl, t }) => {
  const { personal, contacts, experience, projects, education, skills, ai, design } = data;
  const isHidden = (sec: string) => design.hiddenSections?.includes(sec as any);
  const metaText = formatCandidateMeta(personal, data.language || 'ru');
  const photoFilter = personal.photoFilter || 'natural';
  const photoShape = personal.photoShape || 'square';

  return (
    <div className="cvb-tpl-creative">
      <header className="cvb-creative-header">
        <div className="cvb-creative-header-content">
          <div className="cvb-creative-header-text">
            <h1 className="cvb-candidate-name">{personal.fullName || 'Ваше Имя'}</h1>
            <div className="cvb-candidate-position">{personal.position || 'Желаемая должность'}</div>
            {metaText && <div className="cvb-candidate-city">{metaText}</div>}
          </div>

          {photoUrl && (
            <div className="cvb-photo-square-wrap">
              <img
                src={photoUrl}
                alt={personal.fullName}
                className="cvb-photo-square"
                data-photo-filter={photoFilter}
                data-photo-shape={photoShape}
              />
            </div>
          )}
        </div>

        <ContactsList contacts={contacts} format={format} themeStyle="header" className="mt-4" />
      </header>

      <div className="cvb-creative-body">
        {design.sectionOrder.map((sectionKey) => {
          if (isHidden(sectionKey)) return null;

          switch (sectionKey) {
            case 'summary':
              return ai.summary ? (
                <section key="summary" className="cvb-section-block">
                  <SectionHeader title={t('summary')} style="creative" />
                  <SummarySection summary={ai.summary} />
                </section>
              ) : null;

            case 'strengths':
              return ai.strengths && ai.strengths.length > 0 ? (
                <section key="strengths" className="cvb-section-block">
                  <SectionHeader title={t('strengths')} style="creative" />
                  <StrengthsSection items={ai.strengths} />
                </section>
              ) : null;

            case 'experience':
              return !data.noExperience && experience && experience.length > 0 ? (
                <section key="experience" className="cvb-section-block">
                  <SectionHeader title={t('experience')} style="creative" />
                  <ExperienceSection items={experience} lang={data.language} templateStyle="creative" />
                </section>
              ) : null;

            case 'projects':
              return projects && projects.length > 0 ? (
                <section key="projects" className="cvb-section-block">
                  <SectionHeader title={t('projects')} style="creative" />
                  <ProjectsSection items={projects} templateStyle="creative" />
                </section>
              ) : null;

            case 'education':
              return education && education.length > 0 ? (
                <section key="education" className="cvb-section-block">
                  <SectionHeader title={t('education')} style="creative" />
                  <EducationSection items={education} lang={data.language} templateStyle="creative" />
                </section>
              ) : null;

            case 'skills':
              return (
                <section key="skills" className="cvb-section-block">
                  <SectionHeader title={t('skills')} style="creative" />
                  <SkillsSection skills={skills} lang={data.language} layout="tags" />
                </section>
              );

            default:
              return null;
          }
        })}
      </div>
    </div>
  );
};
