import React, { useMemo } from 'react';
import { ResumeData, SectionKey, buildPalette, themes } from '@cvb/shared';
import { templates } from './registry.js';
import { getSectionTitle } from './i18n.js';
import './styles.css';

export interface ResumeRendererProps {
  data: ResumeData;
  format?: 'desktop' | 'mobile';
  photoUrl?: string;
  className?: string;
}

export const ResumeRenderer: React.FC<ResumeRendererProps> = ({
  data,
  format = 'desktop',
  photoUrl,
  className = '',
}) => {
  const templateId = data.design?.templateId || 'modern';
  const templateDef = templates[templateId] || templates.modern;
  const Component = templateDef.Component;

  // Compute theme palette
  const palette = useMemo(() => {
    let accentHex = '#2563EB'; // default blue
    if (data.design?.customAccent) {
      accentHex = data.design.customAccent;
    } else if (data.design?.themeId) {
      const found = themes.find(t => t.id === data.design.themeId);
      if (found) accentHex = found.accent;
    }
    return buildPalette(accentHex);
  }, [data.design?.themeId, data.design?.customAccent]);

  // CSS variables for this resume
  const styleVariables: React.CSSProperties = {
    ['--accent' as any]: palette.accent,
    ['--accent-strong' as any]: palette.accentStrong,
    ['--accent-soft' as any]: palette.accentSoft,
    ['--sidebar-bg' as any]: palette.sidebarBg,
    ['--header-bg' as any]: palette.headerBg,
    ['--header-text' as any]: palette.headerText,
    ['--text' as any]: palette.text,
    ['--muted' as any]: palette.muted,
    ['--bg' as any]: palette.bg,
    ['--rule' as any]: palette.rule,
  };

  const fontClass = `cvb-font-${data.design?.font || 'inter'}`;
  const sizeClass = `cvb-size-${data.design?.fontSize || 'M'}`;

  const t = (key: SectionKey | 'contacts') => getSectionTitle(key, data.language || 'ru');

  return (
    <div
      className={`cvb-resume-container ${fontClass} ${sizeClass} ${className}`}
      data-format={format}
      data-template={templateId}
      style={styleVariables}
    >
      <Component
        data={data}
        format={format}
        photoUrl={photoUrl || data.personal?.photoUrl}
        t={t}
      />
    </div>
  );
};
