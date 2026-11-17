import React, { useState } from 'react';
import { useResumeStore } from '../../store/resumeStore.js';
import { subscribeAiGeneration } from '../../lib/api.js';
import { Pencil, Plus, Trash2, ChevronDown, ChevronUp, Check, Undo2, ArrowUp, ArrowDown } from 'lucide-react';

export const ExperienceStep: React.FC = () => {
  const {
    data,
    addExperience,
    updateExperience,
    removeExperience,
    reorderExperience,
    addProject,
    updateProject,
    removeProject,
    setNoExperience,
    setAiSummary,
    setAiStrengths,
    setAiWeaknesses,
    setDocuments,
    setAiStatus,
    ai,
  } = useResumeStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<'neutral' | 'confident' | 'creative'>('confident');
  const [showDiffMap, setShowDiffMap] = useState<Record<string, boolean>>({});

  const handleEditAllWithAi = () => {
    setAiStatus('streaming', 'starting');
    subscribeAiGeneration(
      data.id,
      { tone: selectedTone, language: data.language },
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
          setShowDiffMap((prev) => ({ ...prev, [expEvent.itemId]: true }));
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

  const hasMinimumData = Boolean(
    data.personal?.position?.trim() &&
      ((!data.noExperience && data.experience?.some((e) => e.rawDescription?.trim())) ||
        (data.noExperience && data.projects?.some((p) => p.rawDescription?.trim())) ||
        (data.skills?.hard?.length || 0) > 0)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Editorial Assistant Control Bar (DESIGN v2.0 §5) */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 'var(--radius-1)',
          background: 'var(--surface)',
          border: '1px solid var(--rule)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={handleEditAllWithAi}
            disabled={!hasMinimumData || ai.status === 'streaming'}
            style={{ height: 36, padding: '0 14px' }}
          >
            <Pencil size={14} />
            <span>
              {ai.status === 'streaming'
                ? 'Вычитка и сборка...'
                : data.ai?.summary
                ? 'Пересобрать с редактором'
                : 'Запустить редакторскую сборку'}
            </span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span style={{ color: 'var(--ink-2)' }}>Тон:</span>
            <select
              className="input-field"
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value as any)}
              style={{ height: 34, width: 124, padding: '0 8px', fontSize: 13 }}
            >
              <option value="neutral">Сдержанный</option>
              <option value="confident">Уверенный</option>
              <option value="creative">Живой</option>
            </select>
          </div>
        </div>

        {!hasMinimumData && (
          <div className="font-note" style={{ fontSize: 12 }}>
            Укажите должность и описание опыта, чтобы редактор структурировал достижения и провёл аудит.
          </div>
        )}
      </div>

      {/* No experience toggle */}
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13.5 }}>
        <input
          type="checkbox"
          checked={Boolean(data.noExperience)}
          onChange={(e) => setNoExperience(e.target.checked)}
          style={{ accentColor: 'var(--lazur)' }}
        />
        <span>Нет коммерческого опыта (показать проекты и стажировки)</span>
      </label>

      {!data.noExperience ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(data.experience || []).map((exp, idx) => {
            const isExpanded = expandedId === exp.id || (expandedId === null && idx === 0);
            const hasAi = Boolean(exp.aiBullets && exp.aiBullets.length > 0);
            const showDiff = showDiffMap[exp.id] !== undefined ? showDiffMap[exp.id] : hasAi;

            return (
              <div
                key={exp.id}
                style={{
                  border: '1px solid var(--rule)',
                  borderRadius: 'var(--radius-1)',
                  background: 'var(--surface)',
                  overflow: 'hidden',
                }}
              >
                {/* Record Header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? '' : exp.id)}
                  style={{
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: isExpanded ? 'var(--paper)' : 'var(--surface)',
                    borderBottom: isExpanded ? '1px solid var(--rule)' : 'none',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--ink)' }}>
                      {exp.role || 'Должность'} {exp.company ? `· ${exp.company}` : ''}
                    </div>
                    <div className="font-caption" style={{ color: 'var(--ink-2)', marginTop: 2 }}>
                      {exp.startDate || 'Начало'} — {exp.endDate || 'по настоящее время'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          reorderExperience(idx, idx - 1);
                        }}
                        title="Переместить выше"
                        style={{ background: 'none', border: 'none', color: 'var(--ink-2)', cursor: 'pointer', padding: 2 }}
                      >
                        <ArrowUp size={14} />
                      </button>
                    )}
                    {idx < (data.experience?.length || 0) - 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          reorderExperience(idx, idx + 1);
                        }}
                        title="Переместить ниже"
                        style={{ background: 'none', border: 'none', color: 'var(--ink-2)', cursor: 'pointer', padding: 2 }}
                      >
                        <ArrowDown size={14} />
                      </button>
                    )}
                    {hasAi && (
                      <span
                        className="font-caption"
                        style={{
                          background: exp.useAi ? 'var(--brick-wash)' : 'var(--paper)',
                          color: exp.useAi ? 'var(--brick)' : 'var(--ink-2)',
                          border: `1px solid ${exp.useAi ? 'var(--brick)' : 'var(--rule)'}`,
                          padding: '2px 6px',
                          borderRadius: 2,
                        }}
                      >
                        {exp.useAi ? 'DIFF ПРИНЯТ' : 'ЧЕРНОВИК'}
                      </span>
                    )}
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expanded Body */}
                {isExpanded && (
                  <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label className="input-label">Компания *</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Saber Publisher"
                          value={exp.company}
                          onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="input-label">Должность *</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="TeamLead"
                          value={exp.role}
                          onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label className="input-label">Дата начала *</label>
                        <input
                          type="month"
                          className="input-field"
                          value={exp.startDate}
                          onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="input-label">Дата окончания</label>
                        <input
                          type="month"
                          className="input-field"
                          disabled={!exp.endDate}
                          value={exp.endDate || ''}
                          onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                        />
                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            marginTop: 6,
                            fontSize: 12.5,
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!exp.endDate}
                            onChange={(e) => updateExperience(exp.id, { endDate: e.target.checked ? null : '2024-01' })}
                            style={{ accentColor: 'var(--lazur)' }}
                          />
                          <span>По настоящее время</span>
                        </label>
                      </div>
                    </div>

                    {/* Raw Input */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <label className="input-label">Обязанности и результаты (своими словами) *</label>
                        <span className="font-caption" style={{ color: 'var(--ink-3)' }}>
                          {(exp.rawDescription || '').length} / 2000
                        </span>
                      </div>
                      <textarea
                        className="textarea-field"
                        maxLength={2000}
                        placeholder="Опишите задачи и цифры, если есть: что сделали, как изменились метрики..."
                        value={exp.rawDescription || ''}
                        onChange={(e) => updateExperience(exp.id, { rawDescription: e.target.value })}
                      />
                    </div>

                    {/* Redline Diff Engine (DESIGN v2.0 §5) */}
                    {hasAi && (
                      <div
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Tab') {
                            e.preventDefault();
                            updateExperience(exp.id, { useAi: true });
                            setShowDiffMap((prev) => ({ ...prev, [exp.id]: false }));
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            updateExperience(exp.id, { useAi: false });
                          }
                        }}
                        style={{
                          padding: 14,
                          borderRadius: 'var(--radius-1)',
                          border: '1px solid var(--rule)',
                          background: 'var(--surface)',
                          outline: 'none',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 10,
                          }}
                        >
                          <span className="font-caption" style={{ color: 'var(--ink-2)', textTransform: 'uppercase' }}>
                            ОПЫТ РАБОТЫ // РЕДАКТОРСКАЯ ВЫЧИТКА
                          </span>
                          <button
                            type="button"
                            className="btn-text"
                            style={{ fontSize: 12 }}
                            onClick={() => setShowDiffMap((prev) => ({ ...prev, [exp.id]: !showDiff }))}
                          >
                            {showDiff ? 'Скрыть исходник' : 'Показать Redline Diff'}
                          </button>
                        </div>

                        {showDiff && exp.rawDescription && (
                          <div className="editorial-deleted" style={{ marginBottom: 10 }}>
                            {exp.rawDescription}
                          </div>
                        )}

                        <div className="editorial-inserted" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {exp.aiBullets?.map((bullet, bIdx) => (
                            <div key={bIdx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                              <span style={{ color: 'var(--brick)', fontWeight: 700 }}>·</span>
                              <input
                                type="text"
                                className="wysiwyg-input"
                                value={bullet}
                                onChange={(e) => {
                                  const nextBullets = [...(exp.aiBullets || [])];
                                  nextBullets[bIdx] = e.target.value;
                                  updateExperience(exp.id, { aiBullets: nextBullets });
                                }}
                              />
                            </div>
                          ))}
                        </div>

                        {/* Monospace Editor Notes */}
                        {exp.notes && exp.notes.length > 0 && (
                          <div className="font-note" style={{ marginTop: 8, fontSize: 11.5 }}>
                            [NOTE] {exp.notes.join(' · ')}
                          </div>
                        )}

                        {/* Redline Actions */}
                        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className={exp.useAi ? 'btn-primary' : 'btn-secondary'}
                            style={{ height: 30, padding: '0 10px', fontSize: 12.5 }}
                            onClick={() => {
                              updateExperience(exp.id, { useAi: true });
                              setShowDiffMap((prev) => ({ ...prev, [exp.id]: false }));
                            }}
                          >
                            <Check size={13} />
                            <span>Принять формулировку (Tab)</span>
                          </button>

                          <button
                            type="button"
                            className={!exp.useAi ? 'btn-primary' : 'btn-secondary'}
                            style={{ height: 30, padding: '0 10px', fontSize: 12.5 }}
                            onClick={() => updateExperience(exp.id, { useAi: false })}
                          >
                            <Undo2 size={13} />
                            <span>Отклонить (Esc)</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => removeExperience(exp.id)}
                        className="btn-danger"
                        style={{ fontSize: 12.5 }}
                      >
                        <Trash2 size={13} />
                        <span>Удалить место работы</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            className="btn-secondary"
            onClick={addExperience}
            style={{ width: '100%', height: 40 }}
          >
            <Plus size={15} />
            <span>Добавить место работы</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="font-body-s" style={{ color: 'var(--ink-2)' }}>
            Опишите учебные, пет-проекты или стажировки — редактор переведёт их в формат опыта.
          </div>

          {(data.projects || []).map((proj) => (
            <div
              key={proj.id}
              style={{
                border: '1px solid var(--rule)',
                borderRadius: 'var(--radius-1)',
                background: 'var(--surface)',
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="input-label">Название проекта *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Сервис аналитики"
                    value={proj.name}
                    onChange={(e) => updateProject(proj.id, { name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="input-label">Ссылка (GitHub / демо)</label>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://github.com/..."
                    value={proj.link || ''}
                    onChange={(e) => updateProject(proj.id, { link: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Что сделали и на каком стеке *</label>
                <textarea
                  className="textarea-field"
                  value={proj.rawDescription || ''}
                  onChange={(e) => updateProject(proj.id, { rawDescription: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => removeProject(proj.id)}
                  className="btn-danger"
                  style={{ fontSize: 12.5 }}
                >
                  <Trash2 size={13} />
                  <span>Удалить проект</span>
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="btn-secondary"
            onClick={addProject}
            style={{ width: '100%', height: 40 }}
          >
            <Plus size={15} />
            <span>Добавить проект</span>
          </button>
        </div>
      )}
    </div>
  );
};
