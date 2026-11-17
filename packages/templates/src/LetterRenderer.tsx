import React, { useMemo } from 'react';
import { ResumeData, buildPalette, themes } from '@cvb/shared';
import { getCommonLabel, formatCandidateMeta } from './i18n.js';
import './styles.css';

export interface LetterRendererProps {
  data: ResumeData;
  type: 'cover' | 'recommendation';
  format?: 'desktop' | 'mobile';
  className?: string;
}

export const LetterRenderer: React.FC<LetterRendererProps> = ({
  data,
  type,
  format = 'desktop',
  className = '',
}) => {
  const lang = data.language || 'ru';
  const palette = useMemo(() => {
    let accentHex = '#2563EB';
    if (data.design?.customAccent) {
      accentHex = data.design.customAccent;
    } else if (data.design?.themeId) {
      const found = themes.find((t) => t.id === data.design.themeId);
      if (found) accentHex = found.accent;
    }
    return buildPalette(accentHex);
  }, [data.design?.themeId, data.design?.customAccent]);

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

  const isCover = type === 'cover';
  const cover = data.documents?.coverLetter;
  const rec = data.documents?.recommendationLetter;
  const body = isCover ? cover?.body : rec?.body;

  const metaLine = formatCandidateMeta(data.personal, lang);
  const contactParts = [
    data.contacts.phone,
    data.contacts.email,
    data.contacts.telegram,
    metaLine,
  ].filter(Boolean);

  const todayFormatted = new Date().toLocaleDateString(
    lang === 'en' ? 'en-US' : lang === 'uz' ? 'uz-UZ' : 'ru-RU',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  const paragraphs = (body || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div
      className={`cvb-resume-container cvb-letter-container ${fontClass} ${sizeClass} ${className}`}
      data-format={format}
      data-letter-type={type}
      style={styleVariables}
    >
      {/* Letterhead */}
      <header className="cvb-letter-header">
        <div className="cvb-letter-sender-name">
          {isCover
            ? data.personal.fullName || 'Ваше Имя'
            : rec?.recommenderName || 'Рекомендатель'}
        </div>
        <div className="cvb-letter-sender-role">
          {isCover
            ? data.personal.position || 'Желаемая должность'
            : [rec?.recommenderRole, rec?.recommenderCompany].filter(Boolean).join(' · ') ||
              'Руководитель / Коллега'}
        </div>
        {isCover && contactParts.length > 0 && (
          <div className="cvb-letter-contacts">{contactParts.join('  ·  ')}</div>
        )}
      </header>

      <div className="cvb-letter-divider" />

      {/* Meta Block */}
      <div className="cvb-letter-meta-row">
        <div>
          <div className="cvb-letter-doc-title">
            {getCommonLabel(isCover ? 'coverLetterTitle' : 'recommendationLetterTitle', lang)}
          </div>
          {isCover && (cover?.targetCompany || cover?.targetVacancy) && (
            <div className="cvb-letter-target">
              {cover.targetCompany && (
                <span>
                  {getCommonLabel('toLabel', lang)}: <strong>{cover.targetCompany}</strong>
                </span>
              )}
              {cover.targetCompany && cover.targetVacancy && ' · '}
              {cover.targetVacancy && (
                <span>
                  {getCommonLabel('vacancyLabel', lang)}: {cover.targetVacancy}
                </span>
              )}
            </div>
          )}
          {!isCover && data.personal.fullName && (
            <div className="cvb-letter-target">
              {lang === 'en' ? 'Candidate: ' : lang === 'uz' ? 'Nomzod: ' : 'Кандидат: '}
              <strong>{data.personal.fullName}</strong>
              {data.personal.position ? ` — ${data.personal.position}` : ''}
            </div>
          )}
        </div>
        <div className="cvb-letter-date">{todayFormatted}</div>
      </div>

      {/* Body */}
      <div className="cvb-letter-body">
        {paragraphs.length > 0 ? (
          paragraphs.map((p, idx) => (
            <p key={idx} className="cvb-letter-paragraph">
              {p.split('\n').map((line, lIdx) => (
                <React.Fragment key={lIdx}>
                  {line}
                  {lIdx < p.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
          ))
        ) : (
          <p className="cvb-letter-empty">
            {isCover
              ? lang === 'en'
                ? 'Generate or enter your cover letter text.'
                : 'Сформируйте или введите текст мотивационного письма на основе вашего резюме.'
              : lang === 'en'
              ? 'Generate or enter your recommendation letter text.'
              : 'Сформируйте или введите текст рекомендательного письма от лица руководителя.'}
          </p>
        )}
      </div>

      {/* Footer Signature Line for Recommendation */}
      {!isCover && paragraphs.length > 0 && (
        <div className="cvb-letter-signature-block">
          <div className="cvb-letter-signature-line" />
          <div className="cvb-letter-signature-caption">
            {rec?.recommenderName || 'Подпись рекомендателя'}
            {rec?.recommenderRole ? `, ${rec.recommenderRole}` : ''}
          </div>
        </div>
      )}
    </div>
  );
};
