import React, { useState, useDeferredValue } from 'react';
import { useResumeStore } from '../../store/resumeStore.js';
import { ResumeRenderer, LetterRenderer, templates } from '@cvb/templates';
import {
  TemplateId,
  themes,
  buildPalette,
  RecommendationRelationship,
} from '@cvb/shared';
import {
  generateCoverLetterApi,
  generateRecommendationLetterApi,
} from '../../lib/api.js';
import {
  Monitor,
  Smartphone,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Pencil,
  Eye,
  Plus,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Check,
  Undo2,
} from 'lucide-react';

export const LivePreview: React.FC = () => {
  const {
    data,
    previewMode,
    setPreviewMode,
    updatePersonal,
    updateAddress,
    updateContacts,
    updateDesign,
    setAiSummary,
    addExperience,
    updateExperience,
    removeExperience,
    reorderExperience,
    addEducation,
    updateEducation,
    removeEducation,
    addHardSkill,
    removeHardSkill,
    updateCoverLetter,
    updateRecommendationLetter,
  } = useResumeStore();

  const deferredData = useDeferredValue(data);
  const [scale, setScale] = useState(0.88);
  const [wysiwygMode, setWysiwygMode] = useState(true);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [coverLoading, setCoverLoading] = useState(false);
  const [recLoading, setRecLoading] = useState(false);

  const design = data.design || { templateId: 'modern', themeId: 'blue', font: 'inter', fontSize: 'M' };
  const activeAccent =
    design.customAccent || themes.find((t) => t.id === design.themeId)?.accent || '#2563EB';
  const palette = buildPalette(activeAccent);

  const cover = data.documents?.coverLetter || {
    targetCompany: '',
    targetVacancy: data.personal?.position || '',
    recipientName: '',
    body: '',
    isEnabled: true,
  };

  const rec = data.documents?.recommendationLetter || {
    recommenderName: '',
    recommenderRole: '',
    recommenderCompany: data.experience?.[0]?.company || '',
    relationship: 'supervisor' as RecommendationRelationship,
    body: '',
    isEnabled: true,
  };

  const handleGenerateCover = async () => {
    setCoverLoading(true);
    try {
      const res = await generateCoverLetterApi(data.id, {
        targetCompany: cover.targetCompany,
        targetVacancy: cover.targetVacancy || data.personal.position,
        recipientName: cover.recipientName,
      });
      updateCoverLetter(res.coverLetter);
    } catch (e) {
      console.error(e);
    } finally {
      setCoverLoading(false);
    }
  };

  const handleGenerateRec = async () => {
    setRecLoading(true);
    try {
      const res = await generateRecommendationLetterApi(data.id, {
        recommenderName: rec.recommenderName,
        recommenderRole: rec.recommenderRole,
        recommenderCompany: rec.recommenderCompany || data.experience?.[0]?.company,
        relationship: rec.relationship,
      });
      updateRecommendationLetter(res.recommendationLetter);
    } catch (e) {
      console.error(e);
    } finally {
      setRecLoading(false);
    }
  };

  const isMobile = previewMode === 'mobile';
  const sheetWidth = isMobile ? 390 : 794;

  return (
    <div
      className="desk-surface"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Top Preview & Customization Bar (DESIGN v2.0 §3.1) */}
      <div
        className="no-print"
        style={{
          minHeight: 48,
          borderBottom: '1px solid var(--rule)',
          background: 'var(--surface)',
          padding: '6px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          zIndex: 10,
        }}
      >
        {/* Left: Mode & Device Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', border: '1px solid var(--rule)', borderRadius: 3, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setPreviewMode('desktop')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                height: 30,
                padding: '0 10px',
                fontSize: 12.5,
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                background: !isMobile ? 'var(--lazur)' : 'var(--surface)',
                color: !isMobile ? 'var(--on-lazur)' : 'var(--ink-2)',
              }}
            >
              <Monitor size={13} />
              <span>ПК (A4)</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('mobile')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                height: 30,
                padding: '0 10px',
                fontSize: 12.5,
                fontWeight: 500,
                border: 'none',
                borderLeft: '1px solid var(--rule)',
                cursor: 'pointer',
                background: isMobile ? 'var(--lazur)' : 'var(--surface)',
                color: isMobile ? 'var(--on-lazur)' : 'var(--ink-2)',
              }}
            >
              <Smartphone size={13} />
              <span>Телефон (390 px)</span>
            </button>
          </div>

          <div style={{ display: 'inline-flex', border: '1px solid var(--rule)', borderRadius: 3, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setWysiwygMode(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                height: 30,
                padding: '0 10px',
                fontSize: 12.5,
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                background: wysiwygMode ? 'var(--lazur)' : 'var(--surface)',
                color: wysiwygMode ? 'var(--on-lazur)' : 'var(--ink-2)',
              }}
            >
              <Pencil size={12} />
              <span>Ввод в лист</span>
            </button>
            <button
              type="button"
              onClick={() => setWysiwygMode(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                height: 30,
                padding: '0 10px',
                fontSize: 12.5,
                fontWeight: 500,
                border: 'none',
                borderLeft: '1px solid var(--rule)',
                cursor: 'pointer',
                background: !wysiwygMode ? 'var(--lazur)' : 'var(--surface)',
                color: !wysiwygMode ? 'var(--on-lazur)' : 'var(--ink-2)',
              }}
            >
              <Eye size={13} />
              <span>Макет PDF</span>
            </button>
          </div>
        </div>

        {/* Center/Right: Template, Theme Swatches & Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <select
            className="input-field"
            value={design.templateId || 'modern'}
            onChange={(e) => updateDesign({ templateId: e.target.value as TemplateId })}
            style={{ height: 30, width: 132, padding: '0 8px', fontSize: 12.5 }}
            title="Шаблон резюме"
          >
            {(Object.keys(templates) as TemplateId[]).map((tid) => (
              <option key={tid} value={tid}>
                {templates[tid].name[data.language || 'ru']}
              </option>
            ))}
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {themes.slice(0, 6).map((t) => {
              const active = !design.customAccent && design.themeId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  title={t.name.ru}
                  onClick={() => updateDesign({ themeId: t.id, customAccent: undefined })}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 2,
                    background: t.accent,
                    border: active ? '2px solid var(--ink)' : '1px solid rgba(0,0,0,0.15)',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                />
              );
            })}
            <input
              type="color"
              title="Свой цвет палитры"
              value={design.customAccent || activeAccent}
              onChange={(e) => updateDesign({ customAccent: e.target.value })}
              style={{ width: 20, height: 20, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
              style={{ width: 28, height: 28, padding: 0 }}
            >
              <ZoomOut size={13} />
            </button>
            <span className="font-caption" style={{ width: 38, textAlign: 'center', color: 'var(--ink-2)' }}>
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setScale((s) => Math.min(1.25, s + 0.1))}
              style={{ width: 28, height: 28, padding: 0 }}
            >
              <ZoomIn size={13} />
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setScale(0.88)}
              style={{ width: 28, height: 28, padding: 0 }}
              title="Сбросить масштаб"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Continuous Multi-Document Scroll Canvas (DESIGN v2.0 §3) */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '32px 20px 80px 20px',
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            transition: 'transform var(--dur-quick) var(--ease-standard), width var(--dur-base) var(--ease-standard)',
            width: sheetWidth,
            display: 'flex',
            flexDirection: 'column',
            gap: 48,
          }}
        >
          {/* ==========================================================
              DOCUMENT 01: CURRICULUM VITAE
              ========================================================== */}
          <div>
            <div
              className="font-caption no-print"
              style={{
                color: 'var(--ink-2)',
                marginBottom: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>DOCUMENT // 01 · CURRICULUM VITAE</span>
              <span>{isMobile ? 'MOBILE VIEWPORT · 390 PX' : 'DESKTOP PRINT · A4'}</span>
            </div>

            <div
              className="paper-sheet"
              style={{
                background: '#ffffff',
                color: '#09090b',
                border: isMobile ? '1px solid #27272a' : '1px solid var(--rule)',
                borderRadius: isMobile ? 12 : 0,
                overflow: 'hidden',
                width: sheetWidth,
                transition: 'width var(--dur-base) var(--ease-standard)',
              }}
            >
              {!wysiwygMode ? (
                <ResumeRenderer
                  data={deferredData}
                  format={previewMode}
                  photoUrl={data.personal?.photoUrl}
                />
              ) : (
                /* In-Place WYSIWYG Notion-style Document Sheet (DESIGN v2.0 §4) */
                <div
                  style={{
                    padding: isMobile ? '24px 20px' : '44px 48px',
                    minHeight: isMobile ? 540 : 1040,
                    fontFamily: 'var(--font-ui)',
                    color: '#09090b',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 22,
                  }}
                >
                  {/* Header Block */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: isMobile ? 'column-reverse' : 'row',
                      justifyContent: 'space-between',
                      gap: 18,
                      borderBottom: `2px solid ${palette.accent}`,
                      paddingBottom: 18,
                    }}
                  >
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <input
                        type="text"
                        className="wysiwyg-input"
                        placeholder="[Укажите Ф.И.О.]"
                        value={data.personal.fullName || ''}
                        onChange={(e) => updatePersonal({ fullName: e.target.value })}
                        style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#09090b' }}
                      />
                      <input
                        type="text"
                        className="wysiwyg-input"
                        placeholder="[Желаемая должность]"
                        value={data.personal.position || ''}
                        onChange={(e) => updatePersonal({ position: e.target.value })}
                        style={{ fontSize: 16, fontWeight: 600, color: palette.accent }}
                      />
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6, fontSize: 13, color: '#52525b' }}>
                        <input
                          type="text"
                          className="wysiwyg-input"
                          placeholder="[Город]"
                          value={data.personal.address?.city || data.personal.city || ''}
                          onChange={(e) => updateAddress({ city: e.target.value })}
                          style={{ width: 130 }}
                        />
                        <input
                          type="text"
                          className="wysiwyg-input"
                          placeholder="[Телефон]"
                          value={data.contacts.phone || ''}
                          onChange={(e) => updateContacts({ phone: e.target.value })}
                          style={{ width: 140 }}
                        />
                        <input
                          type="email"
                          className="wysiwyg-input"
                          placeholder="[Email]"
                          value={data.contacts.email || ''}
                          onChange={(e) => updateContacts({ email: e.target.value })}
                          style={{ width: 180 }}
                        />
                      </div>
                    </div>

                    {data.personal.photoUrl && (
                      <img
                        src={data.personal.photoUrl}
                        alt={data.personal.fullName}
                        style={{
                          width: 88,
                          height: 88,
                          objectFit: 'cover',
                          borderRadius: data.personal.photoShape === 'circle' ? '50%' : '3px',
                          filter: data.personal.photoFilter === 'bw' ? 'grayscale(100%) contrast(1.12)' : 'none',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>

                  {/* Summary (In-Place) */}
                  <div>
                    <div
                      className="font-caption"
                      style={{ color: palette.accent, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}
                    >
                      О себе (Summary)
                    </div>
                    <textarea
                      className="wysiwyg-input"
                      rows={3}
                      placeholder="[Добавьте профессиональное описание или нажмите «Запустить редакторскую сборку»...]"
                      value={data.ai?.summary || ''}
                      onChange={(e) => setAiSummary(e.target.value)}
                      style={{ fontSize: 14, lineHeight: 1.55, resize: 'vertical' }}
                    />
                  </div>

                  {/* Experience (In-Place Notion blocks) */}
                  {!data.noExperience && (
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 10,
                        }}
                      >
                        <span
                          className="font-caption"
                          style={{ color: palette.accent, fontWeight: 700, textTransform: 'uppercase' }}
                        >
                          Опыт работы
                        </span>
                        <button
                          type="button"
                          onClick={addExperience}
                          style={{
                            background: 'none',
                            border: '1px solid #e4e4e7',
                            borderRadius: 3,
                            padding: '3px 8px',
                            fontSize: 12,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            color: '#18181b',
                          }}
                        >
                          <Plus size={12} />
                          <span>Добавить компанию</span>
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {(data.experience || []).map((exp, idx) => {
                          const hasAi = Boolean(exp.aiBullets && exp.aiBullets.length > 0);
                          return (
                            <div
                              key={exp.id}
                              style={{
                                padding: '8px 10px',
                                border: '1px solid transparent',
                                borderLeft: '2px solid #e4e4e7',
                                transition: 'border-color 150ms ease-out',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#d4d4d8')}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'transparent';
                                e.currentTarget.style.borderLeftColor = '#e4e4e7';
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <GripVertical size={13} style={{ color: '#a1a1aa', flexShrink: 0 }} />
                                <input
                                  type="text"
                                  className="wysiwyg-input"
                                  placeholder="[Должность]"
                                  value={exp.role}
                                  onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                                  style={{ fontWeight: 700, fontSize: 14.5, flex: 1 }}
                                />
                                <input
                                  type="text"
                                  className="wysiwyg-input"
                                  placeholder="[Компания]"
                                  value={exp.company}
                                  onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                                  style={{ fontWeight: 600, fontSize: 13.5, color: palette.accent, width: 160 }}
                                />
                                <span style={{ fontSize: 12, color: '#71717a', whiteSpace: 'nowrap' }}>
                                  {exp.startDate} — {exp.endDate || 'н.в.'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => reorderExperience(idx, idx - 1)}
                                  disabled={idx === 0}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', padding: 2 }}
                                  title="Вверх"
                                >
                                  <ArrowUp size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => reorderExperience(idx, idx + 1)}
                                  disabled={idx === data.experience.length - 1}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', padding: 2 }}
                                  title="Вниз"
                                >
                                  <ArrowDown size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeExperience(exp.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c2410c', padding: 2 }}
                                  title="Удалить"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>

                              {hasAi && exp.useAi ? (
                                <div style={{ marginLeft: 18, marginTop: 4 }}>
                                  {exp.aiBullets!.map((b, bIdx) => (
                                    <div key={bIdx} style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
                                      <span style={{ color: palette.accent }}>·</span>
                                      <input
                                        type="text"
                                        className="wysiwyg-input"
                                        value={b}
                                        onChange={(e) => {
                                          const next = [...exp.aiBullets!];
                                          next[bIdx] = e.target.value;
                                          updateExperience(exp.id, { aiBullets: next });
                                        }}
                                        style={{ fontSize: 13.5 }}
                                      />
                                    </div>
                                  ))}
                                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                                    <button
                                      type="button"
                                      onClick={() => updateExperience(exp.id, { useAi: false })}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: 11.5,
                                        color: '#71717a',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                      }}
                                    >
                                      <Undo2 size={11} />
                                      <span>Показать черновик</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ marginLeft: 18, marginTop: 4 }}>
                                  <textarea
                                    className="wysiwyg-input"
                                    rows={2}
                                    placeholder="[Опишите задачи и достижения своими словами...]"
                                    value={exp.rawDescription || ''}
                                    onChange={(e) => updateExperience(exp.id, { rawDescription: e.target.value })}
                                    style={{ fontSize: 13.5, resize: 'vertical' }}
                                  />
                                  {hasAi && (
                                    <button
                                      type="button"
                                      onClick={() => updateExperience(exp.id, { useAi: true })}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: 11.5,
                                        color: palette.accent,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        marginTop: 4,
                                      }}
                                    >
                                      <Check size={11} />
                                      <span>Вернуть редакцию ИИ</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Education (In-Place) */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <span
                        className="font-caption"
                        style={{ color: palette.accent, fontWeight: 700, textTransform: 'uppercase' }}
                      >
                        Образование
                      </span>
                      <button
                        type="button"
                        onClick={addEducation}
                        style={{
                          background: 'none',
                          border: '1px solid #e4e4e7',
                          borderRadius: 3,
                          padding: '3px 8px',
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          color: '#18181b',
                        }}
                      >
                        <Plus size={12} />
                        <span>Добавить образование</span>
                      </button>
                    </div>

                    {(data.education || []).map((edu) => (
                      <div key={edu.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                        <input
                          type="text"
                          className="wysiwyg-input"
                          placeholder="[Специальность]"
                          value={edu.specialty}
                          onChange={(e) => updateEducation(edu.id, { specialty: e.target.value })}
                          style={{ fontWeight: 600, fontSize: 13.5, flex: 1 }}
                        />
                        <input
                          type="text"
                          className="wysiwyg-input"
                          placeholder="[ВУЗ / Курсы]"
                          value={edu.institution}
                          onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                          style={{ fontSize: 13.5, flex: 1 }}
                        />
                        <input
                          type="number"
                          className="wysiwyg-input"
                          value={edu.graduationYear}
                          onChange={(e) => updateEducation(edu.id, { graduationYear: parseInt(e.target.value, 10) || 2024 })}
                          style={{ width: 64, fontSize: 13, textAlign: 'right' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeEducation(edu.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c2410c' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Skills (In-Place) */}
                  <div>
                    <div
                      className="font-caption"
                      style={{ color: palette.accent, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}
                    >
                      Навыки
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                      {(data.skills?.hard || []).map((s, idx) => (
                        <span
                          key={idx}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '3px 9px',
                            borderRadius: 999,
                            background: palette.accentSoft,
                            fontSize: 12.5,
                            fontWeight: 500,
                          }}
                        >
                          <span>{s.name}</span>
                          <button
                            type="button"
                            onClick={() => removeHardSkill(idx)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#71717a' }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder="+ Навык (Enter)"
                        value={newSkillInput}
                        onChange={(e) => setNewSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newSkillInput.trim()) {
                            e.preventDefault();
                            addHardSkill(newSkillInput);
                            setNewSkillInput('');
                          }
                        }}
                        style={{
                          border: '1px dashed #d4d4d8',
                          borderRadius: 999,
                          padding: '3px 10px',
                          fontSize: 12.5,
                          outline: 'none',
                          width: 130,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ==========================================================
              DOCUMENT 02: COVER LETTER (МОТИВАЦИОННОЕ ПИСЬМО)
              ========================================================== */}
          <div>
            <div
              className="font-caption no-print"
              style={{
                color: 'var(--ink-2)',
                marginBottom: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>DOCUMENT // 02 · МОТИВАЦИОННОЕ ПИСЬМО</span>
              <span>ON CV BASIS</span>
            </div>

            {/* Cover Letter Inline Parameters Bar */}
            <div
              className="no-print"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--rule)',
                padding: '10px 12px',
                marginBottom: 10,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                className="input-field"
                placeholder="Целевая компания (напр. Yandex)"
                value={cover.targetCompany || ''}
                onChange={(e) => updateCoverLetter({ targetCompany: e.target.value })}
                style={{ height: 32, flex: 1, minWidth: 140, fontSize: 12.5 }}
              />
              <input
                type="text"
                className="input-field"
                placeholder="Вакансия"
                value={cover.targetVacancy || ''}
                onChange={(e) => updateCoverLetter({ targetVacancy: e.target.value })}
                style={{ height: 32, flex: 1, minWidth: 140, fontSize: 12.5 }}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={handleGenerateCover}
                disabled={coverLoading}
                style={{ height: 32, padding: '0 12px', fontSize: 12.5 }}
              >
                <Pencil size={12} />
                <span>{coverLoading ? 'Пишем...' : 'Сформировать письмо'}</span>
              </button>
            </div>

            <div
              className="paper-sheet"
              style={{
                background: '#ffffff',
                border: isMobile ? '1px solid #27272a' : '1px solid var(--rule)',
                borderRadius: isMobile ? 12 : 0,
                overflow: 'hidden',
                width: sheetWidth,
              }}
            >
              {wysiwygMode ? (
                <div style={{ padding: isMobile ? '24px 20px' : '44px 48px', color: '#09090b' }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{data.personal.fullName || 'Ваше Имя'}</div>
                  <div style={{ fontSize: 13.5, color: palette.accent, fontWeight: 600, marginBottom: 14 }}>
                    {data.personal.position || 'Желаемая должность'}
                  </div>
                  <div style={{ height: 1, background: '#e4e4e7', marginBottom: 18 }} />
                  <div className="font-caption" style={{ color: palette.accent, marginBottom: 12 }}>
                    МОТИВАЦИОННОЕ ПИСЬМО {cover.targetCompany ? `· ${cover.targetCompany.toUpperCase()}` : ''}
                  </div>
                  <textarea
                    className="wysiwyg-input"
                    rows={14}
                    placeholder="Нажмите «Сформировать письмо» выше или напишите мотивационное письмо..."
                    value={cover.body || ''}
                    onChange={(e) => updateCoverLetter({ body: e.target.value })}
                    style={{ fontSize: 14, lineHeight: 1.65, resize: 'vertical' }}
                  />
                </div>
              ) : (
                <LetterRenderer data={deferredData} type="cover" format={previewMode} />
              )}
            </div>
          </div>

          {/* ==========================================================
              DOCUMENT 03: RECOMMENDATION LETTER (РЕКОМЕНДАТЕЛЬНОЕ ПИСЬМО)
              ========================================================== */}
          <div>
            <div
              className="font-caption no-print"
              style={{
                color: 'var(--ink-2)',
                marginBottom: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>DOCUMENT // 03 · РЕКОМЕНДАТЕЛЬНОЕ ПИСЬМО</span>
              <span>REFERENCE TEMPLATE</span>
            </div>

            {/* Recommendation Parameters Bar */}
            <div
              className="no-print"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--rule)',
                padding: '10px 12px',
                marginBottom: 10,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                className="input-field"
                placeholder="ФИО рекомендателя"
                value={rec.recommenderName || ''}
                onChange={(e) => updateRecommendationLetter({ recommenderName: e.target.value })}
                style={{ height: 32, flex: 1, minWidth: 130, fontSize: 12.5 }}
              />
              <input
                type="text"
                className="input-field"
                placeholder="Должность (напр. CTO)"
                value={rec.recommenderRole || ''}
                onChange={(e) => updateRecommendationLetter({ recommenderRole: e.target.value })}
                style={{ height: 32, width: 130, fontSize: 12.5 }}
              />
              <input
                type="text"
                className="input-field"
                placeholder="Компания"
                value={rec.recommenderCompany || ''}
                onChange={(e) => updateRecommendationLetter({ recommenderCompany: e.target.value })}
                style={{ height: 32, width: 130, fontSize: 12.5 }}
              />
              <select
                className="input-field"
                value={rec.relationship || 'supervisor'}
                onChange={(e) =>
                  updateRecommendationLetter({ relationship: e.target.value as RecommendationRelationship })
                }
                style={{ height: 32, width: 130, fontSize: 12.5, padding: '0 6px' }}
              >
                <option value="supervisor">Руководитель</option>
                <option value="team_lead">Тимлид</option>
                <option value="mentor">Ментор</option>
                <option value="colleague">Коллега</option>
              </select>
              <button
                type="button"
                className="btn-primary"
                onClick={handleGenerateRec}
                disabled={recLoading}
                style={{ height: 32, padding: '0 12px', fontSize: 12.5 }}
              >
                <Pencil size={12} />
                <span>{recLoading ? 'Пишем...' : 'Сформировать'}</span>
              </button>
            </div>

            <div
              className="paper-sheet"
              style={{
                background: '#ffffff',
                border: isMobile ? '1px solid #27272a' : '1px solid var(--rule)',
                borderRadius: isMobile ? 12 : 0,
                overflow: 'hidden',
                width: sheetWidth,
              }}
            >
              {wysiwygMode ? (
                <div style={{ padding: isMobile ? '24px 20px' : '44px 48px', color: '#09090b' }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    {rec.recommenderName || 'Рекомендатель'}
                  </div>
                  <div style={{ fontSize: 13.5, color: palette.accent, fontWeight: 600, marginBottom: 14 }}>
                    {[rec.recommenderRole, rec.recommenderCompany].filter(Boolean).join(' · ') ||
                      'Должность и компания рекомендателя'}
                  </div>
                  <div style={{ height: 1, background: '#e4e4e7', marginBottom: 18 }} />
                  <div className="font-caption" style={{ color: palette.accent, marginBottom: 12 }}>
                    РЕКОМЕНДАТЕЛЬНОЕ ПИСЬМО
                  </div>
                  <textarea
                    className="wysiwyg-input"
                    rows={14}
                    placeholder="Нажмите «Сформировать» выше или введите текст рекомендательного письма..."
                    value={rec.body || ''}
                    onChange={(e) => updateRecommendationLetter({ body: e.target.value })}
                    style={{ fontSize: 14, lineHeight: 1.65, resize: 'vertical' }}
                  />
                </div>
              ) : (
                <LetterRenderer data={deferredData} type="recommendation" format={previewMode} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
