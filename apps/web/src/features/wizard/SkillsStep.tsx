import React, { useState } from 'react';
import { useResumeStore } from '../../store/resumeStore.js';
import { SKILLS_DICTIONARY, LangLevel } from '@cvb/shared';
import { X, Plus, Trash2 } from 'lucide-react';

export const SkillsStep: React.FC = () => {
  const {
    data,
    addHardSkill,
    removeHardSkill,
    addSoftSkill,
    removeSoftSkill,
    addLanguage,
    removeLanguage,
  } = useResumeStore();

  const [hardInput, setHardInput] = useState('');
  const [softInput, setSoftInput] = useState('');
  const [langInput, setLangInput] = useState('');
  const [langLevel, setLangLevel] = useState<LangLevel>('B2');

  const hardSkills = data.skills?.hard || [];
  const softSkills = data.skills?.soft || [];
  const languages = data.skills?.languages || [];

  const handleAddHard = (name: string) => {
    if (name.trim()) {
      addHardSkill(name);
      setHardInput('');
    }
  };

  const handleAddSoft = (name: string) => {
    if (name.trim()) {
      addSoftSkill(name);
      setSoftInput('');
    }
  };

  const handleAddLang = () => {
    if (langInput.trim()) {
      addLanguage(langInput.trim(), langLevel);
      setLangInput('');
    }
  };

  // Quick suggestions
  const suggestedHard = SKILLS_DICTIONARY.hard
    .filter((s) => !hardSkills.some((hs) => hs.name.toLowerCase() === s.toLowerCase()))
    .slice(0, 10);

  const suggestedSoft = SKILLS_DICTIONARY.soft
    .filter((s) => !softSkills.some((ss) => ss.toLowerCase() === s.toLowerCase()))
    .slice(0, 8);

  return (
    <div className="space-y-8">
      {/* 1. Hard Skills */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <label className="input-label" style={{ margin: 0 }}>
            Профессиональные навыки (Hard Skills)
          </label>
          <span className="font-caption" style={{ color: 'var(--ink-2)' }}>
            {hardSkills.length} / 30
          </span>
        </div>

        {/* Input box */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            type="text"
            className="input-field"
            placeholder="Начните вводить навык (например React, TypeScript, Docker)..."
            value={hardInput}
            onChange={(e) => setHardInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddHard(hardInput);
              }
            }}
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => handleAddHard(hardInput)}
            style={{ width: 110, flexShrink: 0 }}
          >
            <Plus size={16} />
            <span>Добавить</span>
          </button>
        </div>

        {/* Tags List */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 34, marginBottom: 12 }}>
          {hardSkills.map((skill, idx) => (
            <span
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--surface)',
                border: '1px solid var(--rule)',
                fontSize: 13.5,
                color: 'var(--ink)',
              }}
            >
              <span>{skill.name}</span>
              <button
                type="button"
                onClick={() => removeHardSkill(idx)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'var(--ink-3)',
                  display: 'flex',
                }}
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>

        {/* Suggested Hard Skills */}
        {suggestedHard.length > 0 && (
          <div style={{ fontSize: 13 }}>
            <span style={{ color: 'var(--ink-2)', marginRight: 6 }}>Подсказки:</span>
            {suggestedHard.slice(0, 6).map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddHard(s)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--lazur)',
                  cursor: 'pointer',
                  marginRight: 8,
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                +{s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Soft Skills */}
      <div>
        <label className="input-label">Личные качества (Soft Skills)</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            type="text"
            className="input-field"
            placeholder="Например, Наставничество, Решение проблем..."
            value={softInput}
            onChange={(e) => setSoftInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSoft(softInput);
              }
            }}
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => handleAddSoft(softInput)}
            style={{ width: 110, flexShrink: 0 }}
          >
            <Plus size={16} />
            <span>Добавить</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 34, marginBottom: 12 }}>
          {softSkills.map((soft, idx) => (
            <span
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--surface)',
                border: '1px solid var(--rule)',
                fontSize: 13.5,
              }}
            >
              <span>{soft}</span>
              <button
                type="button"
                onClick={() => removeSoftSkill(idx)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'var(--ink-3)',
                  display: 'flex',
                }}
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>

        {suggestedSoft.length > 0 && (
          <div style={{ fontSize: 13 }}>
            <span style={{ color: 'var(--ink-2)', marginRight: 6 }}>Подсказки:</span>
            {suggestedSoft.slice(0, 5).map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddSoft(s)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--lazur)',
                  cursor: 'pointer',
                  marginRight: 8,
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                +{s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Languages */}
      <div>
        <label className="input-label">Языки</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 110px', gap: 10, marginBottom: 12 }}>
          <input
            type="text"
            className="input-field"
            placeholder="Английский, Русский, Узбекский..."
            value={langInput}
            onChange={(e) => setLangInput(e.target.value)}
          />
          <select
            className="input-field"
            value={langLevel}
            onChange={(e) => setLangLevel(e.target.value as any)}
          >
            <option value="native">Родной</option>
            <option value="C2">C2 (Совершенный)</option>
            <option value="C1">C1 (Продвинутый)</option>
            <option value="B2">B2 (Выше среднего)</option>
            <option value="B1">B1 (Средний)</option>
            <option value="A2">A2 (Базовый)</option>
            <option value="A1">A1 (Начальный)</option>
          </select>
          <button type="button" className="btn-secondary" onClick={handleAddLang}>
            <Plus size={16} />
            <span>Добавить</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {languages.map((l, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: 'var(--radius-1)',
                background: 'var(--surface)',
                border: '1px solid var(--rule)',
                fontSize: 14,
              }}
            >
              <div>
                <span style={{ fontWeight: 500 }}>{l.name}</span>
                <span style={{ color: 'var(--ink-2)', marginLeft: 8 }}>· {l.level}</span>
              </div>
              <button
                type="button"
                onClick={() => removeLanguage(idx)}
                className="btn-danger"
                style={{ fontSize: 13 }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
