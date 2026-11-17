import React from 'react';
import { useResumeStore } from '../../store/resumeStore.js';
import { subscribeAiGeneration } from '../../lib/api.js';
import { X, Check, HelpCircle, Lightbulb, Pencil } from 'lucide-react';

interface InterviewChecklistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InterviewChecklistDrawer: React.FC<InterviewChecklistDrawerProps> = ({ isOpen, onClose }) => {
  const {
    data,
    ai,
    toggleWeaknessResolved,
    setAiStatus,
    setAiSummary,
    setAiStrengths,
    setAiWeaknesses,
    setDocuments,
    updateExperience,
    updateProject,
  } = useResumeStore();

  if (!isOpen) return null;

  const strengths = data.ai?.strengths || [];
  const weaknesses = data.ai?.weaknesses || [];
  const score = data.ai?.completenessScore;
  const resolvedCount = weaknesses.filter((w) => w.resolved).length;

  const handleRunAudit = () => {
    setAiStatus('streaming', 'audit');
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

  return (
    <div
      className="no-print"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(9, 9, 11, 0.35)',
        zIndex: 90,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
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
            <div className="font-caption" style={{ color: 'var(--ink-2)', textTransform: 'uppercase' }}>
              ПОДГОТОВКА К ИНТЕРВЬЮ // РАЗБОР СЛЕПЫХ ЗОН
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginTop: 2 }}>
              Сильные стороны и вопросы рекрутера
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
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {weaknesses.length === 0 && strengths.length === 0 ? (
            <div
              style={{
                padding: 20,
                border: '1px solid var(--rule)',
                borderRadius: 'var(--radius-1)',
                background: 'var(--paper)',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Аудит ещё не проведён</div>
              <div className="font-body-s" style={{ color: 'var(--ink-2)', marginBottom: 16 }}>
                Редактор проанализирует ваш опыт и навыки, подчеркнёт конкурентные преимущества и составит список вопросов, которые рекрутер может задать по пробелам в резюме.
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={handleRunAudit}
                disabled={ai.status === 'streaming'}
              >
                <Pencil size={14} />
                <span>{ai.status === 'streaming' ? 'Проводим разбор...' : 'Провести аудит профиля'}</span>
              </button>
            </div>
          ) : (
            <>
              {/* Summary Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  border: '1px solid var(--rule)',
                  borderRadius: 'var(--radius-1)',
                  background: 'var(--paper)',
                }}
              >
                <div>
                  <div className="font-caption" style={{ color: 'var(--ink-2)' }}>
                    ПОЛНОТА ПРОФИЛЯ
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
                    {score ?? 82}%
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div className="font-caption" style={{ color: 'var(--ink-2)' }}>
                    ОТРЕПЕТИРОВАНО ВОПРОСОВ
                  </div>
                  <div className="font-mono" style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
                    {resolvedCount} / {weaknesses.length}
                  </div>
                </div>
              </div>

              {/* Strengths */}
              {strengths.length > 0 && (
                <div>
                  <div className="font-caption" style={{ color: 'var(--ink-2)', marginBottom: 10 }}>
                    СИЛЬНЫЕ СТОРОНЫ КАНДИДАТА
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {strengths.map((s, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '10px 12px',
                          border: '1px solid var(--rule)',
                          borderLeft: '2px solid var(--olive)',
                          borderRadius: 'var(--radius-1)',
                          background: 'var(--surface)',
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink)' }}>{s.title}</div>
                        <div className="font-body-s" style={{ color: 'var(--ink-2)', marginTop: 2 }}>
                          {s.evidence}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weaknesses -> Interview Prep Checklist (DESIGN v2.0 §6) */}
              <div>
                <div className="font-caption" style={{ color: 'var(--ink-2)', marginBottom: 10 }}>
                  СЛАБЫЕ ЗОНЫ И ОЖИДАЕМЫЕ ВОПРОСЫ НА ИНТЕРВЬЮ
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {weaknesses.map((item, idx) => (
                    <div
                      key={item.id}
                      style={{
                        padding: 16,
                        border: '1px solid var(--rule)',
                        borderRadius: 'var(--radius-1)',
                        background: item.resolved ? 'var(--paper)' : 'var(--surface)',
                        opacity: item.resolved ? 0.78 : 1,
                        transition: 'opacity var(--dur-quick) var(--ease-enter)',
                      }}
                    >
                      <div className="font-caption" style={{ color: 'var(--ink-2)', marginBottom: 10 }}>
                        {String(idx + 1).padStart(2, '0')} · {item.area.toUpperCase()}
                      </div>

                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
                        <HelpCircle size={15} style={{ color: 'var(--brick)', marginTop: 3, flexShrink: 0 }} />
                        <div>
                          <div className="font-caption" style={{ color: 'var(--ink-2)' }}>
                            Вопрос рекрутера:
                          </div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', marginTop: 2 }}>
                            {item.question}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 14 }}>
                        <Lightbulb size={15} style={{ color: 'var(--ochre)', marginTop: 3, flexShrink: 0 }} />
                        <div>
                          <div className="font-caption" style={{ color: 'var(--ink-2)' }}>
                            Стратегия ответа и доработки:
                          </div>
                          <div className="font-body-s" style={{ color: 'var(--ink-2)', marginTop: 2 }}>
                            {item.strategy}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className={item.resolved ? 'btn-primary' : 'btn-secondary'}
                          onClick={() => toggleWeaknessResolved(item.id)}
                          style={{ height: 32, padding: '0 12px', fontSize: 12.5 }}
                        >
                          <Check size={13} />
                          <span>{item.resolved ? 'Репетиция пройдена' : 'Отметить как готовое'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--rule)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            onClick={handleRunAudit}
            disabled={ai.status === 'streaming'}
            style={{ height: 34, fontSize: 13 }}
          >
            <Pencil size={13} />
            <span>{ai.status === 'streaming' ? 'Обновление...' : 'Обновить аудит'}</span>
          </button>

          <button type="button" className="btn-primary" onClick={onClose} style={{ height: 34, fontSize: 13 }}>
            Закрыть
          </button>
        </div>
      </aside>
    </div>
  );
};
