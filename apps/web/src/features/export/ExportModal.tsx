import React, { useState, useEffect } from 'react';
import { useResumeStore } from '../../store/resumeStore.js';
import { requestExport, pollExportStatus, checkResumeCompletenessApi } from '../../lib/api.js';
import { CheckIssue, ExportFormat, generateExportFileName } from '@cvb/shared';
import { X, Monitor, Smartphone, FileText, Award, Download, AlertCircle, Printer } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DocOption {
  id: ExportFormat;
  docParam: 'cv' | 'cover' | 'recommendation';
  formatParam: 'desktop' | 'mobile';
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ReactNode;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { data } = useResumeStore();
  const [selectedDocs, setSelectedDocs] = useState<Record<string, boolean>>({
    'pdf-desktop': true,
    'pdf-mobile': true,
    'pdf-cover-letter': true,
    'pdf-recommendation': true,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [issues, setIssues] = useState<CheckIssue[]>([]);
  const [showIssues, setShowIssues] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkResumeCompletenessApi(data.id).then((res) => {
        setIssues(res.issues || []);
      });
    }
  }, [isOpen, data.id]);

  if (!isOpen) return null;

  const docOptions: DocOption[] = [
    {
      id: 'pdf-desktop',
      docParam: 'cv',
      formatParam: 'desktop',
      title: 'РЕЗЮМЕ ДЛЯ ПК',
      subtitle: 'Идеально для печати, отправки по почте и прохождения ATS-систем',
      badge: 'PDF · A4',
      icon: <Monitor size={18} />,
    },
    {
      id: 'pdf-mobile',
      docParam: 'cv',
      formatParam: 'mobile',
      title: 'РЕЗЮМЕ ДЛЯ ТЕЛЕФОНА',
      subtitle: 'Одна колонка 390 px для комфортного чтения рекрутером в Telegram',
      badge: 'PDF · 390 px',
      icon: <Smartphone size={18} />,
    },
    {
      id: 'pdf-cover-letter',
      docParam: 'cover',
      formatParam: 'desktop',
      title: 'МОТИВАЦИОННОЕ ПИСЬМО',
      subtitle: data.documents?.coverLetter?.targetCompany
        ? `Персонализировано для ${data.documents.coverLetter.targetCompany}`
        : 'Сформировано на основе вашего резюме',
      badge: 'PDF · A4',
      icon: <FileText size={18} />,
    },
    {
      id: 'pdf-recommendation',
      docParam: 'recommendation',
      formatParam: 'desktop',
      title: 'РЕКОМЕНДАТЕЛЬНОЕ ПИСЬМО',
      subtitle: data.documents?.recommendationLetter?.recommenderName
        ? `От ${data.documents.recommendationLetter.recommenderName}`
        : 'Фирменный бланк с подписью руководителя',
      badge: 'PDF · A4',
      icon: <Award size={18} />,
    },
  ];

  const toggleDoc = (id: string) => {
    setSelectedDocs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenPrintPdf = (opt: DocOption) => {
    const url = `/render/${data.id}?doc=${opt.docParam}&format=${opt.formatParam}&autoprint=1`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadZipKit = async () => {
    setIsExporting(true);
    setExportProgress(25);
    try {
      const { exportId } = await requestExport(data.id, 'zip-kit');
      setExportProgress(60);

      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        setExportProgress(Math.min(95, 60 + attempts * 10));
        const res = await pollExportStatus(exportId);
        if (res.status === 'done' || attempts >= 8) {
          clearInterval(interval);
          setExportProgress(100);
          const link = document.createElement('a');
          link.href = res.url || `/api/v1/exports/${exportId}/download`;
          link.download =
            res.fileName ||
            generateExportFileName(data.personal.fullName, data.personal.position, 'zip-kit');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setTimeout(() => {
            setIsExporting(false);
          }, 600);
        }
      }, 450);
    } catch (err) {
      console.error(err);
      setIsExporting(false);
    }
  };

  const kitFileName = generateExportFileName(
    data.personal.fullName,
    data.personal.position,
    'zip-kit'
  );

  return (
    <div
      className="no-print"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(9, 9, 11, 0.35)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 500,
          height: '100%',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--rule)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--rule)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div className="font-caption" style={{ color: 'var(--ink-2)' }}>
              КОМПЛЕКТ СОИСКАТЕЛЯ // СКАЧИВАНИЕ
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginTop: 2 }}>
              Экспорт документов в PDF
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--ink-2)', cursor: 'pointer', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="font-body-s" style={{ color: 'var(--ink-2)', marginBottom: 4 }}>
            Нажмите «PDF» напротив нужного документа для сохранения или скачайте комплект архивом:
          </div>

          {docOptions.map((opt) => {
            const checked = Boolean(selectedDocs[opt.id]);
            return (
              <div
                key={opt.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-1)',
                  border: checked ? '1px solid var(--ink)' : '1px solid var(--rule)',
                  background: checked ? 'var(--paper)' : 'var(--surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    cursor: 'pointer',
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleDoc(opt.id)}
                    style={{ accentColor: 'var(--lazur)', marginTop: 3 }}
                  />
                  <div style={{ color: 'var(--ink)', marginTop: 1 }}>{opt.icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink)' }}>
                      {opt.title}
                    </div>
                    <div className="font-body-s" style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>
                      {opt.subtitle}
                    </div>
                    <div className="font-caption" style={{ color: 'var(--ink-2)', marginTop: 4 }}>
                      {opt.badge}
                    </div>
                  </div>
                </label>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleOpenPrintPdf(opt)}
                  style={{ height: 32, padding: '0 10px', fontSize: 12.5, flexShrink: 0 }}
                  title="Открыть и сохранить в PDF"
                >
                  <Printer size={13} />
                  <span>PDF</span>
                </button>
              </div>
            );
          })}

          {/* Completeness Hints */}
          {issues.length > 0 && (
            <div
              style={{
                marginTop: 8,
                padding: '10px 12px',
                borderRadius: 'var(--radius-1)',
                background: 'var(--paper)',
                border: '1px solid var(--rule)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ochre)' }}>
                  <AlertCircle size={14} />
                  <span>
                    Замечаний к тексту: {issues.length}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-text"
                  style={{ fontSize: 12 }}
                  onClick={() => setShowIssues(!showIssues)}
                >
                  {showIssues ? 'Скрыть' : 'Показать'}
                </button>
              </div>

              {showIssues && (
                <ul style={{ margin: '8px 0 0 0', paddingLeft: 18, fontSize: 12.5, color: 'var(--ink-2)' }}>
                  {issues.map((iss, i) => (
                    <li key={i}>{iss.message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--rule)',
            background: 'var(--paper)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <button
            type="button"
            className="btn-primary"
            onClick={handleDownloadZipKit}
            disabled={isExporting}
            style={{ width: '100%', height: 40 }}
          >
            <Download size={15} />
            <span>
              {isExporting
                ? `Собираем архив ${exportProgress}%...`
                : 'Скачать комплект документов (ZIP)'}
            </span>
          </button>

          <div className="font-caption" style={{ textAlign: 'center', color: 'var(--ink-2)' }}>
            Файл: {kitFileName}
          </div>
        </div>
      </aside>
    </div>
  );
};
