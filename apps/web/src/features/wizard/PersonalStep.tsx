import React, { useState } from 'react';
import { useResumeStore } from '../../store/resumeStore.js';
import { POSITIONS_LIST } from '@cvb/shared';
import { uploadResumePhoto, deleteResumePhoto } from '../../lib/api.js';
import { Camera, Trash2 } from 'lucide-react';

export const PersonalStep: React.FC = () => {
  const { data, updatePersonal, updateAddress } = useResumeStore();
  const personal = data.personal || {};
  const address = personal.address || {
    country: 'Узбекистан',
    city: personal.city || '',
    districtOrStreet: '',
    willingToRelocate: false,
    remoteWork: false,
  };

  const [positionSuggestions, setPositionSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  const handlePositionChange = (val: string) => {
    updatePersonal({ position: val });
    if (val.trim().length > 1) {
      const filtered = POSITIONS_LIST.filter((p) => p.toLowerCase().includes(val.toLowerCase())).slice(0, 6);
      setPositionSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Фото больше 5 МБ. Выберите файл поменьше.');
      return;
    }

    setPhotoUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const res = await uploadResumePhoto(data.id, dataUrl);
        updatePersonal({ photoUrl: res.photoUrl, photoKey: `photo-${data.id}` });
      } catch (err) {
        console.error(err);
      } finally {
        setPhotoUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoDelete = async () => {
    try {
      await deleteResumePhoto(data.id);
      updatePersonal({ photoUrl: undefined, photoKey: undefined });
    } catch (err) {
      console.error(err);
    }
  };

  const birthDate = personal.birthDate ? new Date(personal.birthDate) : null;
  const currentDay = birthDate && !isNaN(birthDate.getTime()) ? birthDate.getDate() : '';
  const currentMonth = birthDate && !isNaN(birthDate.getTime()) ? birthDate.getMonth() + 1 : '';
  const currentYear =
    personal.birthYear || (birthDate && !isNaN(birthDate.getTime()) ? birthDate.getFullYear() : '');

  const handleBirthYearChange = (yStr: string) => {
    const y = yStr ? parseInt(yStr, 10) : undefined;
    if (y && currentDay && currentMonth) {
      const formatted = `${y}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
      updatePersonal({ birthYear: y, birthDate: formatted });
    } else {
      updatePersonal({ birthYear: y, birthDate: undefined });
    }
  };

  const handleFullDatePart = (d: any, m: any) => {
    if (d && m && currentYear) {
      const formatted = `${currentYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      updatePersonal({ birthDate: formatted });
    } else {
      updatePersonal({ birthDate: undefined });
    }
  };

  const photoShape = personal.photoShape || 'square';
  const photoFilter = personal.photoFilter || 'natural';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Photo & Geometric Controls (DESIGN v2.0 §9) */}
      <div>
        <label className="input-label">Фотография</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: photoShape === 'circle' ? '50%' : '3px',
              border: '1px solid var(--rule)',
              background: 'var(--surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {personal.photoUrl ? (
              <img
                src={personal.photoUrl}
                alt={personal.fullName}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: photoFilter === 'bw' ? 'grayscale(100%) contrast(1.12)' : 'none',
                }}
              />
            ) : (
              <Camera size={22} style={{ color: 'var(--ink-3)' }} />
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <label className="btn-secondary" style={{ cursor: 'pointer', height: 34, padding: '0 12px' }}>
                <span>{photoUploading ? 'Загрузка...' : personal.photoUrl ? 'Заменить' : 'Загрузить фото'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  style={{ display: 'none' }}
                />
              </label>

              {personal.photoUrl && (
                <button
                  type="button"
                  onClick={handlePhotoDelete}
                  className="btn-danger"
                  style={{ fontSize: 13 }}
                >
                  <Trash2 size={13} />
                  <span>Удалить</span>
                </button>
              )}
            </div>

            {/* Shape and High-Contrast B&W Filter Toggles */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'inline-flex', border: '1px solid var(--rule)', borderRadius: 3, overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => updatePersonal({ photoShape: 'square' })}
                  style={{
                    padding: '4px 10px',
                    fontSize: 12,
                    border: 'none',
                    cursor: 'pointer',
                    background: photoShape === 'square' ? 'var(--lazur)' : 'var(--surface)',
                    color: photoShape === 'square' ? 'var(--on-lazur)' : 'var(--ink-2)',
                  }}
                >
                  Квадрат 3px
                </button>
                <button
                  type="button"
                  onClick={() => updatePersonal({ photoShape: 'circle' })}
                  style={{
                    padding: '4px 10px',
                    fontSize: 12,
                    border: 'none',
                    borderLeft: '1px solid var(--rule)',
                    cursor: 'pointer',
                    background: photoShape === 'circle' ? 'var(--lazur)' : 'var(--surface)',
                    color: photoShape === 'circle' ? 'var(--on-lazur)' : 'var(--ink-2)',
                  }}
                >
                  Круг
                </button>
              </div>

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={photoFilter === 'bw'}
                  onChange={(e) => updatePersonal({ photoFilter: e.target.checked ? 'bw' : 'natural' })}
                  style={{ accentColor: 'var(--lazur)' }}
                />
                <span>Ч/Б фильтр (монохром)</span>
              </label>
            </div>
          </div>
        </div>
        <div className="input-hint">JPG, PNG или WEBP до 5 МБ. Если фото нет, шаблон перестраивается автоматически.</div>
      </div>

      {/* Full Name */}
      <div>
        <label className="input-label">Ф.И.О. *</label>
        <input
          type="text"
          className="input-field"
          placeholder="Иванов Иван Сергеевич"
          value={personal.fullName || ''}
          onChange={(e) => updatePersonal({ fullName: e.target.value })}
        />
      </div>

      {/* Target Position */}
      <div style={{ position: 'relative' }}>
        <label className="input-label">Желаемая должность *</label>
        <input
          type="text"
          className="input-field"
          placeholder="Frontend-разработчик"
          value={personal.position || ''}
          onChange={(e) => handlePositionChange(e.target.value)}
          onFocus={() => personal.position && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        {showSuggestions && positionSuggestions.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'var(--surface)',
              border: '1px solid var(--rule)',
              borderRadius: 'var(--radius-1)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              zIndex: 30,
              marginTop: 4,
            }}
          >
            {positionSuggestions.map((pos, idx) => (
              <div
                key={idx}
                onMouseDown={() => {
                  updatePersonal({ position: pos });
                  setShowSuggestions(false);
                }}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: 13.5,
                  borderBottom: idx < positionSuggestions.length - 1 ? '1px solid var(--rule)' : 'none',
                }}
              >
                {pos}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Structured Address (FR-2) */}
      <div
        style={{
          padding: 14,
          border: '1px solid var(--rule)',
          borderRadius: 'var(--radius-1)',
          background: 'var(--surface)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div className="font-caption" style={{ color: 'var(--ink-2)', textTransform: 'uppercase' }}>
          Адрес и локация
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label className="input-label">Страна *</label>
            <input
              type="text"
              className="input-field"
              placeholder="Узбекистан"
              value={address.country || ''}
              onChange={(e) => updateAddress({ country: e.target.value })}
            />
          </div>
          <div>
            <label className="input-label">Город *</label>
            <input
              type="text"
              className="input-field"
              placeholder="Ташкент"
              value={address.city || ''}
              onChange={(e) => updateAddress({ city: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="input-label">Район / улица (опционально)</label>
          <input
            type="text"
            className="input-field"
            placeholder="Юнусабадский район"
            value={address.districtOrStreet || ''}
            onChange={(e) => updateAddress({ districtOrStreet: e.target.value })}
          />
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={Boolean(address.remoteWork)}
              onChange={(e) => updateAddress({ remoteWork: e.target.checked })}
              style={{ accentColor: 'var(--lazur)' }}
            />
            <span>Удалённая работа</span>
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={Boolean(address.willingToRelocate)}
              onChange={(e) => updateAddress({ willingToRelocate: e.target.checked })}
              style={{ accentColor: 'var(--lazur)' }}
            />
            <span>Готов к релокации</span>
          </label>
        </div>
      </div>

      {/* Birth Year & Optional Full Date (FR-2) */}
      <div>
        <label className="input-label">Год рождения и возраст</label>
        <div style={{ display: 'grid', gridTemplateColumns: '110px 80px 1fr', gap: 10 }}>
          <select
            className="input-field"
            value={currentYear}
            onChange={(e) => handleBirthYearChange(e.target.value)}
          >
            <option value="">Год *</option>
            {Array.from({ length: 70 }, (_, i) => new Date().getFullYear() - 14 - i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            className="input-field"
            value={currentDay}
            onChange={(e) => handleFullDatePart(e.target.value, currentMonth)}
          >
            <option value="">День</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            className="input-field"
            value={currentMonth}
            onChange={(e) => handleFullDatePart(currentDay, e.target.value)}
          >
            <option value="">Месяц (опц.)</option>
            {[
              'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
              'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
            ].map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={Boolean(personal.showAge)}
              onChange={(e) => updatePersonal({ showAge: e.target.checked })}
              style={{ accentColor: 'var(--lazur)' }}
            />
            <span>Показывать возраст (число лет) вместо года рождения</span>
          </label>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={Boolean(personal.hideBirthDate)}
              onChange={(e) => updatePersonal({ hideBirthDate: e.target.checked })}
              style={{ accentColor: 'var(--lazur)' }}
            />
            <span>Скрыть год рождения и возраст из итогового документа</span>
          </label>
        </div>
      </div>
    </div>
  );
};
