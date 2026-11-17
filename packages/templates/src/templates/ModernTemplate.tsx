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

export const ModernTemplate: React.FC<TemplateProps> = ({ data, format, photoUrl, t }) => {
  const { personal, contacts, experience, projects, education, skills, ai, design } = data;
  const isHidden = (sec: string) => design.hiddenSections?.includes(sec as any);
  const isMobile = format === 'mobile';
  const metaText = formatCandidateMeta(personal, data.language || 'ru');
  const photoFilter = personal.photoFilter || 'natural';
  const photoShape = personal.photoShape || 'circle';

  if (isMobile) {
    return (
      <div className="cvb-tpl-modern cvb-modern-mobile">
        <header className="cvb-modern-mobile-header">
          {photoUrl && (
            <div className="cvb-photo-circle-wrap">
              <img
                src={photoUrl}
                alt={personal.fullName}
                className="cvb-photo-circle"
                data-photo-filter={photoFilter}
                data-photo-shape={photoShape}
              />
            </div>
          )}
          <h1 className="cvb-candidate-name">{personal.fullName || 'Ваше Имя'}</h1>
          <div className="cvb-candidate-position">{personal.position || 'Желаемая должность'}</div>
          {metaText && <div className="cvb-candidate-city">{metaText}</div>}
        </header>

        <ContactsList contacts={contacts} format="mobile" className="mb-4" />

        {design.sectionOrder.map((sectionKey) => {
          if (isHidden(sectionKey)) return null;
          switch (sectionKey) {
            case 'summary':
              return ai.summary ? (
                <section key="summary" className="cvb-section-block">
                  <SectionHeader title={t('summary')} style="modern" />
                  <SummarySection summary={ai.summary} />
                </section>
              ) : null;
            case 'strengths':
              return ai.strengths && ai.strengths.length > 0 ? (
                <section key="strengths" className="cvb-section-block">
                  <SectionHeader title={t('strengths')} style="modern" />
                  <StrengthsSection items={ai.strengths} />
                </section>
              ) : null;
            case 'experience':
              return !data.noExperience && experience && experience.length > 0 ? (
                <section key="experience" className="cvb-section-block">
                  <SectionHeader title={t('experience')} style="modern" />
                  <ExperienceSection items={experience} lang={data.language} templateStyle="modern" />
                </section>
              ) : null;
            case 'projects':
              return projects && projects.length > 0 ? (
                <section key="projects" className="cvb-section-block">
                  <SectionHeader title={t('projects')} style="modern" />
                  <ProjectsSection items={projects} templateStyle="modern" />
                </section>
              ) : null;
            case 'education':
              return education && education.length > 0 ? (
                <section key="education" className="cvb-section-block">
                  <SectionHeader title={t('education')} style="modern" />
                  <EducationSection items={education} lang={data.language} templateStyle="modern" />
                </section>
              ) : null;
            case 'skills':
              return (
                <section key="skills" className="cvb-section-block">
                  <SectionHeader title={t('skills')} style="modern" />
                  <SkillsSection skills={skills} lang={data.language} layout="tags" />
                </section>
              );
            default:
              return null;
          }
        })}
      </div>
    );
  }

  return (
    <div className="cvb-tpl-modern cvb-modern-desktop">
      <aside className="cvb-modern-sidebar">
        {photoUrl && (
          <div className="cvb-photo-circle-wrap mb-4">
            <img
              src={photoUrl}
              alt={personal.fullName}
              className="cvb-photo-circle"
              data-photo-filter={photoFilter}
              data-photo-shape={photoShape}
            />
          </div>
        )}

        <div className="cvb-sidebar-group">
          <SectionHeader title={t('contacts')} style="modern" />
          <ContactsList contacts={contacts} format="desktop" themeStyle="sidebar" />
          {metaText && <div className="cvb-sidebar-city">{metaText}</div>}
        </div>

        {!isHidden('skills') && (
          <div className="cvb-sidebar-group mt-5">
            <SectionHeader title={t('skills')} style="modern" />
            <SkillsSection skills={skills} lang={data.language} layout="sidebar" />
          </div>
        )}
      </aside>

      <main className="cvb-modern-main">
        <header className="cvb-modern-header">
          <h1 className="cvb-candidate-name">{personal.fullName || 'Ваше Имя'}</h1>
          <div className="cvb-candidate-position">{personal.position || 'Желаемая должность'}</div>
        </header>

        {design.sectionOrder.map((sectionKey) => {
          if (isHidden(sectionKey) || sectionKey === 'skills') return null;

          switch (sectionKey) {
            case 'summary':
              return ai.summary ? (
                <section key="summary" className="cvb-section-block">
                  <SectionHeader title={t('summary')} style="modern" />
                  <SummarySection summary={ai.summary} />
                </section>
              ) : null;

            case 'strengths':
              return ai.strengths && ai.strengths.length > 0 ? (
                <section key="strengths" className="cvb-section-block">
                  <SectionHeader title={t('strengths')} style="modern" />
                  <StrengthsSection items={ai.strengths} />
                </section>
              ) : null;

            case 'experience':
              return !data.noExperience && experience && experience.length > 0 ? (
                <section key="experience" className="cvb-section-block">
                  <SectionHeader title={t('experience')} style="modern" />
                  <ExperienceSection items={experience} lang={data.language} templateStyle="modern" />
                </section>
              ) : null;

            case 'projects':
              return projects && projects.length > 0 ? (
                <section key="projects" className="cvb-section-block">
                  <SectionHeader title={t('projects')} style="modern" />
                  <ProjectsSection items={projects} templateStyle="modern" />
                </section>
              ) : null;

            case 'education':
              return education && education.length > 0 ? (
                <section key="education" className="cvb-section-block">
                  <SectionHeader title={t('education')} style="modern" />
                  <EducationSection items={education} lang={data.language} templateStyle="modern" />
                </section>
              ) : null;

            default:
              return null;
          }
        })}
      </main>
    </div>
  );
};
