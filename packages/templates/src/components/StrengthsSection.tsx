import React from 'react';
import { StrengthItem } from '@cvb/shared';

interface StrengthsSectionProps {
  items?: StrengthItem[];
}

export const StrengthsSection: React.FC<StrengthsSectionProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="cvb-strengths-grid">
      {items.map((item, idx) => (
        <div key={idx} className="cvb-strength-card break-inside-avoid">
          <div className="cvb-strength-title">{item.title}</div>
          <div className="cvb-strength-evidence">{item.evidence}</div>
        </div>
      ))}
    </div>
  );
};
