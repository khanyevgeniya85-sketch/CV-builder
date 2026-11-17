import React from 'react';
import { ProjectItem } from '@cvb/shared';
import { Globe } from 'lucide-react';

interface ProjectsSectionProps {
  items: ProjectItem[];
  templateStyle?: 'classic' | 'modern' | 'minimal' | 'creative' | 'ats';
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({ items, templateStyle = 'modern' }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className={`cvb-projects-list cvb-proj-${templateStyle}`}>
      {items.map((proj) => {
        const bullets = proj.useAi !== false && proj.aiBullets && proj.aiBullets.length > 0
          ? proj.aiBullets
          : proj.rawDescription
          ? proj.rawDescription.split('\n').filter(Boolean)
          : [];

        return (
          <div key={proj.id} className="cvb-proj-item break-inside-avoid">
            <div className="cvb-proj-header-row">
              <span className="cvb-proj-name">{proj.name}</span>
              {proj.link && (
                <a
                  href={proj.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cvb-proj-link"
                >
                  <Globe size={13} />
                  <span>{proj.link.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
            </div>

            {bullets.length > 0 && (
              <ul className="cvb-bullets-list">
                {bullets.map((bullet, idx) => (
                  <li key={idx} className="cvb-bullet-item">
                    {bullet}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};
