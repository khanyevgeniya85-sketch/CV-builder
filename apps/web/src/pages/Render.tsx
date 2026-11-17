import React, { useEffect, useState } from 'react';
import { ResumeData } from '@cvb/shared';
import { ResumeRenderer, LetterRenderer } from '@cvb/templates';

interface RenderPageProps {
  resumeId: string;
}

export const RenderPage: React.FC<RenderPageProps> = ({ resumeId }) => {
  const [data, setData] = useState<ResumeData | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);

  const urlParams = new URLSearchParams(window.location.search);
  const format = (urlParams.get('format') || 'desktop') as 'desktop' | 'mobile';
  const doc = (urlParams.get('doc') || 'cv') as 'cv' | 'cover' | 'recommendation' | 'kit';
  const autoprint = urlParams.get('autoprint') === '1';

  useEffect(() => {
    fetch(`/api/v1/render-data/${resumeId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          setData(json.data);
          setPhotoUrl(json.photoUrl);
          document.fonts.ready.then(() => {
            (window as any).__RENDER_READY__ = true;
            if (autoprint) {
              setTimeout(() => {
                window.print();
              }, 250);
            }
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }, [resumeId, autoprint]);

  if (!data) {
    return (
      <div style={{ padding: 40, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
        Загрузка документа...
      </div>
    );
  }

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', margin: 0, padding: 0 }}>
      {format === 'mobile' && (
        <style>{`
          @media print {
            @page {
              size: 105mm 297mm;
              margin: 4mm;
            }
          }
        `}</style>
      )}

      {/* Utility print header hidden during actual PDF export */}
      <div
        className="no-print"
        style={{
          padding: '10px 20px',
          background: '#f4f4f5',
          borderBottom: '1px solid #e4e4e7',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--font-ui)',
        }}
      >
        <span style={{ fontSize: 13, color: '#52525b' }}>
          {doc === 'cover'
            ? 'Мотивационное письмо · A4'
            : doc === 'recommendation'
            ? 'Рекомендательное письмо · A4'
            : format === 'mobile'
            ? 'Мобильная версия резюме · 390 px'
            : 'Резюме для ПК · A4'}
        </span>
        <button
          type="button"
          className="btn-primary"
          onClick={() => window.print()}
          style={{ height: 32, fontSize: 12.5 }}
        >
          Сохранить как PDF
        </button>
      </div>

      {doc === 'cover' ? (
        <LetterRenderer data={data} type="cover" format={format} />
      ) : doc === 'recommendation' ? (
        <LetterRenderer data={data} type="recommendation" format={format} />
      ) : doc === 'kit' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          <ResumeRenderer data={data} format={format} photoUrl={photoUrl} />
          <div style={{ pageBreakBefore: 'always' }}>
            <LetterRenderer data={data} type="cover" format={format} />
          </div>
          <div style={{ pageBreakBefore: 'always' }}>
            <LetterRenderer data={data} type="recommendation" format={format} />
          </div>
        </div>
      ) : (
        <ResumeRenderer data={data} format={format} photoUrl={photoUrl} />
      )}
    </div>
  );
};
