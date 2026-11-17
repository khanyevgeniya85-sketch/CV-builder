import React, { useState, useEffect } from 'react';
import { useResumeStore } from '../store/resumeStore.js';
import { fetchResume, initSession, subscribeAiGeneration } from '../lib/api.js';
import { PersonalStep } from '../features/wizard/PersonalStep.js';
import { ContactsStep } from '../features/wizard/ContactsStep.js';
import { ExperienceStep } from '../features/wizard/ExperienceStep.js';
import { EducationStep } from '../features/wizard/EducationStep.js';
import { SkillsStep } from '../features/wizard/SkillsStep.js';
import { DesignStep } from '../features/wizard/DesignStep.js';
import { LivePreview } from '../features/preview/LivePreview.js';
import { ExportModal } from '../features/export/ExportModal.js';
import { InterviewChecklistDrawer } from '../features/audit/InterviewChecklistDrawer.js';
import {
  Download,
  Sun,
  Moon,
  ArrowLeft,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
  ClipboardCheck,
  Pencil,
} from 'lucide-react';
import { Lang } from '@cvb/shared';

const STEPS = [
  { id: 'personal', title: 'Личное и адрес', num: '01' },
  { id: 'contacts', title: 'Контакты', num: '02' },
  { id: 'experience', title: 'Опыт работы', num: '03' },
  { id: 'education', title: 'Образование', num: '04' },
  { id: 'skills', title: 'Навыки', num: '05' },
  { id: 'design', title: 'Оформление', num: '06' },
] as const;

type StepId = typeof STEPS[number]['id'];

interface EditorProps {
  resumeId: string;
  onNavigateHome: () => void;
}

export const Editor: React.FC<EditorProps> = ({ resumeId, onNavigateHome }) => {
  const {
    data,
    ai,
    setResume,
    saveState,
    lastSavedAt,
    setLanguage,
    setAiStatus,
    setAiSummary,
    setAiStrengths,
    setAiWeaknesses,
    setDocuments,
    updateExperience,
    updateProject,
  } = useResumeStore();

  const [currentStep, setCurrentStep] = useState<StepId>('personal');
  const [showInspector, setShowInspector] = useState(true);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('preview');

  useEffect(() => {
    initSession().then(() => {
      fetchResume(resumeId)
        .then((res) => {
          setResume(res.data, res.version);
        })
        .catch((err) => {
          console.error(err);
        });
    });
  }, [resumeId]);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const handleQuickAiAssemble = () => {
    setAiStatus('streaming', 'starting');
    subscribeAiGeneration(
      data.id,
      { tone: data.ai?.tone || 'confident', language: data.language },
      {
        onStage: (stage) => setAiStatus('streaming', stage),
        onSummary: (text) => setAiSummary(text),
        onStrengths: (items) => setAiStrengths(items),
        onWeaknesses: (payload) => setAiWeaknesses(payload.items, payload.completenessScore),
        onDocuments: (docs) => setDocuments(docs),
        onExperience: (expEvent) => {
          updateExperience(expEvent.itemId, {
            aiBullets: expEvent.bullets,
            highlights: expEvent.highlights,
            notes: expEvent.notes,
            useAi: true,
          });
        },
        onProjects: (projEvent) => {
          updateProject(projEvent.itemId, {
            aiBullets: projEvent.bullets,
            notes: projEvent.notes,
            useAi: true,
          });
        },
        onDone: () => setAiStatus('idle'),
        onError: (err) => setAiStatus('error', undefined, err.message),
      }
    );
  };

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const weaknessesCount = data.ai?.weaknesses?.length || 0;
  const unresolvedCount = (data.ai?.weaknesses || []).filter((w) => !w.resolved).length;

  const canRunAi = Boolean(
    data.personal?.position?.trim() &&
      ((!data.noExperience && data.experience?.some((e) => e.rawDescription?.trim())) ||
        (data.noExperience && data.projects?.some((p) => p.rawDescription?.trim())) ||
        (data.skills?.hard?.length || 0) > 0)
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
      {/* 1. Top Command Bar (DESIGN v2.0 §3.1) */}
      <header
        className="no-print"
        style={{
          height: 48,
          borderBottom: '1px solid var(--rule)',
          background: 'var(--surface)',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <button
            type="button"
            onClick={onNavigateHome}
            className="btn-text"
            style={{ color: 'var(--ink)', fontWeight: 600, fontSize: 13.5 }}
          >
            <ArrowLeft size={15} />
            <span>Документы</span>
          </button>

          <span style={{ color: 'var(--rule-strong)' }}>/</span>

          <span
            style={{
              fontSize: 13.5,
              color: 'var(--ink-2)',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {data.personal?.fullName || 'Новое резюме'}
          </span>

          <span className="font-caption" style={{ color: saveState === 'offline' ? 'var(--ochre)' : 'var(--ink-3)', marginLeft: 6 }}>
            {saveState === 'saving'
              ? '○ Сохранение...'
              : saveState === 'offline'
              ? '○ Офлайн'
              : lastSavedAt
              ? `● Сохранено ${lastSavedAt}`
              : '● Сохранено'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Toggle Form Inspector */}
          <button
            type="button"
            className="btn-secondary hidden lg:inline-flex"
            onClick={() => setShowInspector(!showInspector)}
            style={{ height: 32, padding: '0 10px', fontSize: 12.5 }}
            title={showInspector ? 'Скрыть боковую форму (фокус на лист)' : 'Открыть боковую форму'}
          >
            {showInspector ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
            <span>{showInspector ? 'Скрыть форму' : 'Форма полей'}</span>
          </button>

          {/* AI Assembly Button */}
          <button
            type="button"
            className="btn-secondary"
            onClick={handleQuickAiAssemble}
            disabled={!canRunAi || ai.status === 'streaming'}
            style={{ height: 32, padding: '0 10px', fontSize: 12.5 }}
            title={canRunAi ? 'Собрать описание, достижения, аудит и письма' : 'Сначала укажите должность и опыт/навыки'}
          >
            <Pencil size={13} />
            <span>{ai.status === 'streaming' ? 'Редакция...' : 'Собрать с ИИ'}</span>
          </button>

          {/* Interview Checklist Drawer Trigger */}
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setIsChecklistOpen(true)}
            style={{ height: 32, padding: '0 10px', fontSize: 12.5 }}
          >
            <ClipboardCheck size={14} />
            <span>
              Чеклист интервью{weaknessesCount > 0 ? ` (${unresolvedCount}/${weaknessesCount})` : ''}
            </span>
          </button>

          {/* Language selector */}
          <select
            className="input-field"
            value={data.language || 'ru'}
            onChange={(e) => setLanguage(e.target.value as Lang)}
            style={{ height: 32, padding: '0 6px', fontSize: 12.5, width: 62 }}
          >
            <option value="ru">RU</option>
            <option value="uz">UZ</option>
            <option value="en">EN</option>
          </select>

          {/* Dark mode toggle */}
          <button
            type="button"
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Светлая тема' : 'Тёмная тема'}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink-2)',
              cursor: 'pointer',
              display: 'flex',
              padding: 4,
            }}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Export Kit Drawer Button */}
          <button
            type="button"
            className="btn-primary"
            onClick={() => setIsExportOpen(true)}
            style={{ height: 32, padding: '0 12px', fontSize: 12.5 }}
          >
            <Download size={13} />
            <span>Экспорт комплекта</span>
          </button>
        </div>
      </header>

      {/* 2. Main Studio Workspace */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Collapsible Structured Form Inspector */}
        {showInspector && (
          <div
            className={`no-print ${mobileTab === 'form' ? 'flex' : 'hidden lg:flex'}`}
            style={{
              width: '100%',
              maxWidth: 460,
              borderRight: '1px solid var(--rule)',
              background: 'var(--paper)',
              flexDirection: 'column',
              overflow: 'hidden',
              flexShrink: 0,
              minHeight: 0,
            }}
          >
            {/* Step Tabs Bar */}
            <div
              className="tabs-scroll-clean"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                borderBottom: '1px solid var(--rule)',
                background: 'var(--surface)',
                padding: '4px 8px 0 8px',
                gap: 2,
                flexShrink: 0,
              }}
            >
              {STEPS.map((step) => {
                const active = currentStep === step.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setCurrentStep(step.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      borderBottom: active ? '2px solid var(--lazur)' : '2px solid transparent',
                      padding: '10px 10px',
                      fontSize: 12.5,
                      fontWeight: active ? 600 : 400,
                      color: active ? 'var(--ink)' : 'var(--ink-2)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <span className="font-caption" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
                      {step.num}
                    </span>
                    <span>{step.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Step Form Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
              {currentStep === 'personal' && <PersonalStep />}
              {currentStep === 'contacts' && <ContactsStep />}
              {currentStep === 'experience' && <ExperienceStep />}
              {currentStep === 'education' && <EducationStep />}
              {currentStep === 'skills' && <SkillsStep />}
              {currentStep === 'design' && <DesignStep />}
            </div>

            {/* Step Footer Nav */}
            <div
              style={{
                padding: '10px 16px',
                borderTop: '1px solid var(--rule)',
                background: 'var(--surface)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                onClick={() => currentStepIndex > 0 && setCurrentStep(STEPS[currentStepIndex - 1].id)}
                disabled={currentStepIndex === 0}
                style={{ height: 32, padding: '0 10px', fontSize: 12.5 }}
              >
                <ArrowLeft size={13} />
                <span>Назад</span>
              </button>

              <span className="font-caption" style={{ color: 'var(--ink-3)' }}>
                {currentStepIndex + 1} / {STEPS.length}
              </span>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => currentStepIndex < STEPS.length - 1 && setCurrentStep(STEPS[currentStepIndex + 1].id)}
                disabled={currentStepIndex === STEPS.length - 1}
                style={{ height: 32, padding: '0 10px', fontSize: 12.5 }}
              >
                <span>Далее</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Right/Main Area: Continuous Multi-Document Stream & WYSIWYG Canvas */}
        <div
          style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}
          className={mobileTab === 'preview' ? 'flex' : 'hidden lg:flex'}
        >
          <LivePreview />
        </div>
      </div>

      {/* Mobile Bottom Switcher */}
      <div
        className="lg:hidden no-print"
        style={{
          height: 48,
          borderTop: '1px solid var(--rule)',
          background: 'var(--surface)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setShowInspector(true);
            setMobileTab('form');
          }}
          style={{
            border: 'none',
            background: mobileTab === 'form' ? 'var(--paper)' : 'var(--surface)',
            fontWeight: mobileTab === 'form' ? 600 : 400,
            color: 'var(--ink)',
            fontSize: 13.5,
            cursor: 'pointer',
          }}
        >
          Поля формы
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          style={{
            border: 'none',
            borderLeft: '1px solid var(--rule)',
            background: mobileTab === 'preview' ? 'var(--paper)' : 'var(--surface)',
            fontWeight: mobileTab === 'preview' ? 600 : 400,
            color: 'var(--ink)',
            fontSize: 13.5,
            cursor: 'pointer',
          }}
        >
          Листы документов
        </button>
      </div>

      {/* Drawers */}
      <InterviewChecklistDrawer isOpen={isChecklistOpen} onClose={() => setIsChecklistOpen(false)} />
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </div>
  );
};
