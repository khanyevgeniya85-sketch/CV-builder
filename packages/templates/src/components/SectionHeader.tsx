import React from 'react';

interface SectionHeaderProps {
  title: string;
  className?: string;
  style?: 'classic' | 'modern' | 'minimal' | 'creative' | 'ats';
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, className = '', style = 'modern' }) => {
  return (
    <div className={`cvb-section-header cvb-header-${style} ${className}`}>
      <h2 className="cvb-section-title">{title}</h2>
      {style !== 'minimal' && style !== 'ats' && <div className="cvb-header-line" />}
    </div>
  );
};
