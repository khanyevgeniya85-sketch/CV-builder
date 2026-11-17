import React from 'react';
import { useResumeStore } from '../../store/resumeStore.js';
import { TemplateId, themes, SectionKey, buildPalette } from '@cvb/shared';
import { templates } from '@cvb/templates';
import { Eye, EyeOff, GripVertical } from 'lucide-react';

const FONT_OPTIONS = [
  { id: 'inter', name: 'Inter (Универсальный гротеск)' },
  { id: 'roboto', name: 'Roboto (Чёткий современный)' },
  { id: 'pt', name: 'PT Serif + PT Sans (Классика с засечками)' },
  { id: 'montserrat', name: 'Montserrat (Геометрический гротеск)' },
];

const SECTION_LABELS: Record<SectionKey, string> = {
  summary: 'О себе (Summary)',
  strengths: 'Ключевые компетенции (Сильные стороны)',
  experience: 'Опыт работы',
  projects: 'Проекты',
  education: 'Образование',
  skills: 'Навыки',
  languages: 'Языки',
};

export const DesignStep: React.FC = () => {
  const { data, updateDesign } = useResumeStore();
  const design = data.design || {
    templateId: 'modern',
    themeId: 'blue',
    font: 'inter',
    fontSize: 'M',
    sectionOrder: ['summary', 'strengths', 'experience', 'projects', 'education', 'skills', 'languages'],
    hiddenSections: [],
  };

  const handleTemplateSelect = (id: TemplateId) => {
    updateDesign({ templateId: id });
  };

  const handleThemeSelect = (themeId: string) => {
    updateDesign({ themeId, customAccent: undefined });
  };

  const handleCustomColor = (colorHex: string) => {
    updateDesign({ customAccent: colorHex });
  };

  const toggleSectionVisibility = (sec: SectionKey) => {
    const hidden = design.hiddenSections || [];
    if (hidden.includes(sec)) {
      updateDesign({ hiddenSections: hidden.filter((s) => s !== sec) });
    } else {
      updateDesign({ hiddenSections: [...hidden, sec] });
    }
  };

  // Check custom accent palette
  const activePalette = buildPalette(design.customAccent || themes.find((t) => t.id === design.themeId)?.accent || '#2563EB');

  return (
    <div className="space-y-8">
      {/* 1. Template selection (DESIGN §6.7) */}
      <div>
        <label className="input-label" style={{ marginBottom: 12 }}>
          Шаблон резюме
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
          {(Object.keys(templates) as TemplateId[]).map((tId) => {
            const tDef = templates[tId];
            const isSelected = design.templateId === tId;

            return (
              <div
                key={tId}
                onClick={() => handleTemplateSelect(tId)}
                style={{
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--lazur)' : '1px solid var(--rule)',
                  borderRadius: 'var(--radius-1)',
                  padding: 8,
                  background: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: isSelected ? 'var(--shadow-sheet-lifted)' : 'none',
                  transition: 'box-shadow var(--dur-quick) var(--ease-standard)',
                }}
              >
                {/* Mini paper preview representation */}
                <div
                  style={{
                    width: '100%',
                    height: 110,
                    background: '#ffffff',
                    border: '1px solid var(--rule)',
                    borderRadius: 2,
                    padding: 8,
                    marginBottom: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 5,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ height: 6, width: '60%', background: 'var(--ink)' }} />
                  <div style={{ height: 4, width: '40%', background: activePalette.accent }} />
                  <div style={{ height: 1, background: 'var(--rule)', margin: '3px 0' }} />
                  <div style={{ height: 3, width: '100%', background: 'var(--rule)' }} />
                  <div style={{ height: 3, width: '85%', background: 'var(--rule)' }} />
                  <div style={{ height: 3, width: '90%', background: 'var(--rule)' }} />
                </div>

                <div
                  style={{
                    fontSize: 13,
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? 'var(--ink)' : 'var(--ink-2)',
                    textAlign: 'center',
                  }}
                >
                  {tDef.name[data.language || 'ru'] || tDef.name.ru}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Color Theme Selection (DESIGN §6.8) */}
      <div>
        <label className="input-label" style={{ marginBottom: 10 }}>
          Цветовая тема резюме
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          {themes.map((theme) => {
            const isSelected = !design.customAccent && design.themeId === theme.id;

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleThemeSelect(theme.id)}
                title={theme.name[data.language || 'ru']}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 'var(--radius-1)',
                  background: theme.accent,
                  border: isSelected ? '2px solid var(--ink)' : '1px solid rgba(0,0,0,0.1)',
                  outline: isSelected ? '2px solid var(--paper)' : 'none',
                  outlineOffset: -4,
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            );
          })}

          {/* Custom color picker */}
          <div style={{ position: 'relative' }}>
            <label
              title="Выбрать свой акцентный цвет"
              style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--radius-1)',
                border: design.customAccent ? '2px solid var(--ink)' : '1px dashed var(--rule-strong)',
                background: design.customAccent || 'var(--surface)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 11,
                color: 'var(--ink-2)',
              }}
            >
              <input
                type="color"
                value={design.customAccent || '#2563EB'}
                onChange={(e) => handleCustomColor(e.target.value)}
                style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }}
              />
              {!design.customAccent && '+'}
            </label>
          </div>
        </div>

        {activePalette.wasDarkened && (
          <div className="font-caption" style={{ color: 'var(--ochre)', marginTop: 8 }}>
            Цвет автоматически затемнён для обеспечения высокого контраста текста (WCAG AA).
          </div>
        )}
      </div>

      {/* 3. Typography & Size (SPEC §6.4) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 14 }}>
        <div>
          <label className="input-label">Шрифт резюме</label>
          <select
            className="input-field"
            value={design.font || 'inter'}
            onChange={(e) => updateDesign({ font: e.target.value as any })}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="input-label">Размер текста</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['S', 'M', 'L'] as const).map((sz) => (
              <button
                key={sz}
                type="button"
                className={design.fontSize === sz ? 'btn-primary' : 'btn-secondary'}
                onClick={() => updateDesign({ fontSize: sz })}
                style={{ flex: 1, height: 42, padding: 0 }}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Section Order & Visibility */}
      <div>
        <label className="input-label" style={{ marginBottom: 8 }}>
          Отображение разделов
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {design.sectionOrder.map((sec) => {
            const isHidden = (design.hiddenSections || []).includes(sec);

            return (
              <div
                key={sec}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-1)',
                  background: 'var(--surface)',
                  border: '1px solid var(--rule)',
                  opacity: isHidden ? 0.6 : 1,
                  fontSize: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GripVertical size={14} style={{ color: 'var(--ink-3)' }} />
                  <span style={{ textDecoration: isHidden ? 'line-through' : 'none' }}>
                    {SECTION_LABELS[sec] || sec}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => toggleSectionVisibility(sec)}
                  className="btn-text"
                  style={{ color: isHidden ? 'var(--ink-3)' : 'var(--lazur)', gap: 5 }}
                >
                  {isHidden ? <EyeOff size={15} /> : <Eye size={15} />}
                  <span>{isHidden ? 'Скрыт' : 'Показывается'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
