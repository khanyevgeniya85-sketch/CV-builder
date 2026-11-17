import React from 'react';
import { useResumeStore } from '../../store/resumeStore.js';
import { Plus, Trash2 } from 'lucide-react';
import { EducationLevel } from '@cvb/shared';

const EDUCATION_LEVEL_OPTIONS: Array<{ value: EducationLevel; label: string }> = [
  { value: 'bachelor', label: 'Бакалавриат' },
  { value: 'master', label: 'Магистратура' },
  { value: 'vocational', label: 'Среднее специальное' },
  { value: 'secondary', label: 'Среднее образование' },
  { value: 'course', label: 'Курсы / тренинг' },
  { value: 'certificate', label: 'Сертификат' },
];

export const EducationStep: React.FC = () => {
  const { data, addEducation, updateEducation, removeEducation } = useResumeStore();

  return (
    <div className="space-y-6">
      {(data.education || []).map((edu) => (
        <div
          key={edu.id}
          style={{
            border: '1px solid var(--rule)',
            borderRadius: 'var(--radius-1)',
            background: 'var(--surface)',
            padding: 16,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 12 }}>
            <div>
              <label className="input-label">Учебное заведение *</label>
              <input
                type="text"
                className="input-field"
                placeholder="Ташкентский университет информационных технологий"
                value={edu.institution}
                onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
              />
            </div>

            <div>
              <label className="input-label">Специальность / направление *</label>
              <input
                type="text"
                className="input-field"
                placeholder="Программная инженерия"
                value={edu.specialty}
                onChange={(e) => updateEducation(edu.id, { specialty: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 14 }}>
            <div>
              <label className="input-label">Уровень образования *</label>
              <select
                className="input-field"
                value={edu.level}
                onChange={(e) => updateEducation(edu.id, { level: e.target.value as any })}
              >
                {EDUCATION_LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="input-label">Год окончания *</label>
              <input
                type="number"
                className="input-field"
                min={1960}
                max={2040}
                value={edu.graduationYear}
                onChange={(e) => updateEducation(edu.id, { graduationYear: parseInt(e.target.value, 10) || 2024 })}
              />
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => removeEducation(edu.id)}
              className="btn-danger"
              style={{ fontSize: 13 }}
            >
              <Trash2 size={13} />
              <span>Удалить образование</span>
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        className="btn-secondary"
        onClick={addEducation}
        style={{ width: '100%', height: 42, gap: 8 }}
      >
        <Plus size={16} />
        <span>Добавить образование</span>
      </button>
    </div>
  );
};
