import React from 'react';

interface SummarySectionProps {
  summary?: string;
  className?: string;
}

export const SummarySection: React.FC<SummarySectionProps> = ({ summary, className = '' }) => {
  if (!summary || !summary.trim()) return null;

  return (
    <div className={`cvb-summary-text ${className}`}>
      <p>{summary}</p>
    </div>
  );
};
