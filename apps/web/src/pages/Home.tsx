import React, { useState, useEffect } from 'react';
import { fetchResumesList, createNewResume, initSession, deleteResume, duplicateResume } from '../lib/api.js';
import { ResumeRenderer } from '@cvb/templates';
import { createDefaultResumeData } from '@cvb/shared';
import { Plus, Trash2, Copy, Sun, Moon } from 'lucide-react';

interface HomeProps {
  onOpenResume: (id: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onOpenResume }) => {
  const [resumes, setResumes] = useState<Array<{ id: string; title: string; updatedAt: string; templateId: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    initSession().then(() => {
      loadResumes();
    });
  }, []);

  const loadResumes = async () => {
    try {
      const list = await fetchResumesList();
      setResumes(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await createNewResume('ru');
      onOpenResume(res.id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Удалить резюме?')) {
      await deleteResume(id);
      loadResumes();
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await duplicateResume(id);
    loadResumes();
  };

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const sampleCandidate = createDefaultResumeData();
  sampleCandidate.personal = {
    fullName: 'Рустам Исмаилов',
    position: 'Frontend-разработчик',
    city: 'Ташкент',
    birthYear: 1996,
    showAge: true,
    hideBirthDate: false,
    photoFilter: 'bw',
    photoShape: 'square',
    address: {
      country: 'Узбекистан',
      city: 'Ташкент',
      willingToRelocate: true,
      remoteWork: true,
    },
  };
  sampleCandidate.contacts = {
    phone: '+998 90 987 65 43',
    email: 'rustam@example.uz',
    telegram: '@rustam_dev',
    linkedin: 'linkedin.com/in/rustam',
  };
  sampleCandidate.experience = [
    {
      id: 'e1',
      company: 'Saber Publisher',
      role: 'Frontend TeamLead',
      startDate: '2022-03',
      endDate: null,
      rawDescription: 'Руководил разработкой веб-платформы, оптимизировал скорость',
      aiBullets: [
        'Руководил командой из 4 инженеров при разработке цифрового журнала на Next.js',
        'Ускорил время начальной загрузки страниц в 3 раза за счёт гидратации и бандлинга',
        'Внедрил строгий дизайн-код и стандарты TypeScript',
      ],
      highlights: [0],
      useAi: true,
    },
  ];
  sampleCandidate.skills = {
    hard: [{ name: 'React' }, { name: 'TypeScript' }, { name: 'Next.js' }, { name: 'Tailwind' }, { name: 'Node.js' }],
    soft: ['Командное лидерство', 'Менторинг'],
    languages: [
      { name: 'Русский', level: 'native' },
      { name: 'O‘zbek', level: 'native' },
      { name: 'English', level: 'B2' },
    ],
  };
  sampleCandidate.ai = {
    summary:
      'Frontend-разработчик с фокусом на React и современной веб-архитектуре. Опыт руководства командой разработки и доведения сложных продуктов до продакшена с измеримыми результатами.',
    tone: 'confident',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
      {/* Header */}
      <header
        style={{
          height: 56,
          borderBottom: '1px solid var(--rule)',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>CV Builder</span>
          <span className="font-caption" style={{ color: 'var(--ink-3)' }}>
            ARCHITECTURAL STUDIO
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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

          <button type="button" className="btn-primary" onClick={handleStart} disabled={loading}>
            <Plus size={14} />
            <span>Создать резюме</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          padding: '64px 32px 48px 32px',
          maxWidth: 1240,
          margin: '0 auto',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 480px',
          gap: 48,
          alignItems: 'center',
        }}
      >
        <div>
          <div className="font-caption" style={{ color: 'var(--ink-2)', marginBottom: 12 }}>
            КОНСТРУКТОР РЕЗЮМЕ · ПИСЬМА · ПОДГОТОВКА К ИНТЕРВЬЮ
          </div>

          <h1 className="font-display" style={{ margin: '0 0 18px 0', color: 'var(--ink)' }}>
            Резюме, письма и разбор слабых зон без лишнего шума
          </h1>

          <p className="font-body" style={{ color: 'var(--ink-2)', maxWidth: 520, margin: '0 0 28px 0' }}>
            Редактируйте текст прямо в листе документа. Редактор переводит обязанности в достижения, подготавливает мотивационное и рекомендательное письма и формирует чеклист вопросов для интервью.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              type="button"
              className="btn-primary"
              onClick={handleStart}
              disabled={loading}
              style={{ height: 44, padding: '0 24px', fontSize: 15 }}
            >
              <span>{loading ? 'Создаём...' : 'Открыть редактор'}</span>
            </button>
            <span className="font-caption" style={{ color: 'var(--ink-3)' }}>
              A4 PDF + MOBILE 390 PX
            </span>
          </div>
        </div>

        {/* Live Fan of real sample resumes */}
        <div style={{ position: 'relative', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              transform: 'rotate(-3deg) scale(0.46) translateX(-36px)',
              transformOrigin: 'center center',
              position: 'absolute',
              pointerEvents: 'none',
            }}
          >
            <div className="paper-sheet" style={{ width: 794, minHeight: 880, background: '#ffffff', border: '1px solid var(--rule)' }}>
              <ResumeRenderer
                data={{ ...sampleCandidate, design: { ...sampleCandidate.design, templateId: 'classic', themeId: 'graphite' } }}
              />
            </div>
          </div>

          <div
            style={{
              transform: 'rotate(2deg) scale(0.50)',
              transformOrigin: 'center center',
              position: 'absolute',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          >
            <div className="paper-sheet" style={{ width: 794, minHeight: 880, background: '#ffffff', border: '1px solid var(--rule)' }}>
              <ResumeRenderer
                data={{ ...sampleCandidate, design: { ...sampleCandidate.design, templateId: 'modern', themeId: 'blue' } }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Existing Resumes List */}
      {resumes.length > 0 && (
        <section style={{ maxWidth: 1240, margin: '0 auto', width: '100%', padding: '0 32px 40px 32px' }}>
          <div className="font-caption" style={{ color: 'var(--ink-2)', marginBottom: 12 }}>
            ВАШИ ДОКУМЕНТЫ
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 14 }}>
            {resumes.map((r) => (
              <div
                key={r.id}
                onClick={() => onOpenResume(r.id)}
                style={{
                  border: '1px solid var(--rule)',
                  borderRadius: 'var(--radius-1)',
                  background: 'var(--surface)',
                  padding: 16,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 112,
                  transition: 'border-color var(--dur-instant) var(--ease-enter)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--ink)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--rule)')}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)', marginBottom: 4 }}>
                    {r.title}
                  </div>
                  <div className="font-caption" style={{ color: 'var(--ink-2)' }}>
                    {new Date(r.updatedAt).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={(e) => handleDuplicate(e, r.id)}
                    title="Дублировать"
                    style={{ background: 'none', border: 'none', color: 'var(--ink-2)', cursor: 'pointer', padding: 4 }}
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, r.id)}
                    title="Удалить"
                    style={{ background: 'none', border: 'none', color: 'var(--brick)', cursor: 'pointer', padding: 4 }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Architecture Overview */}
      <section
        style={{
          borderTop: '1px solid var(--rule)',
          padding: '48px 32px',
          maxWidth: 1240,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          <div>
            <div className="font-caption" style={{ color: 'var(--ink-2)', marginBottom: 8 }}>
              01 // ВВОД ПО МЕСТУ
            </div>
            <div className="font-h3" style={{ marginBottom: 8 }}>
              Прямое редактирование в листе
            </div>
            <div className="font-body-s" style={{ color: 'var(--ink-2)' }}>
              Заполните фото, Ф.И.О., адрес, год рождения, опыт, образование и навыки прямо в бланке резюме или в структурированном инспекторе.
            </div>
          </div>

          <div>
            <div className="font-caption" style={{ color: 'var(--ink-2)', marginBottom: 8 }}>
              02 // REDLINE DIFF И АУДИТ
            </div>
            <div className="font-h3" style={{ marginBottom: 8 }}>
              Честная вычитка и чеклист интервью
            </div>
            <div className="font-body-s" style={{ color: 'var(--ink-2)', marginBottom: 12 }}>
              Редактор показывает правки через зачёркивание, выделяет сильные стороны и готовит ответы на каверзные вопросы по пробелам.
            </div>
            <div
              style={{
                padding: 10,
                borderRadius: 'var(--radius-1)',
                background: 'var(--surface)',
                border: '1px solid var(--rule)',
              }}
            >
              <div className="editorial-deleted" style={{ marginBottom: 6 }}>
                руковожу командой, сделали сайт журнала
              </div>
              <div className="editorial-inserted" style={{ marginBottom: 6 }}>
                Руководил командой из 4 инженеров при запуске журнала
              </div>
              <div className="font-note" style={{ fontSize: 11.5 }}>
                [NOTE] перевёл в достижения
              </div>
            </div>
          </div>

          <div>
            <div className="font-caption" style={{ color: 'var(--ink-2)', marginBottom: 8 }}>
              03 // КОМПЛЕКТ ОТКЛИКА
            </div>
            <div className="font-h3" style={{ marginBottom: 8 }}>
              Письма и два формата PDF
            </div>
            <div className="font-body-s" style={{ color: 'var(--ink-2)' }}>
              В едином свитке под резюме формируются мотивационное и рекомендательное письма. Скачивайте версию A4 для ПК и 390 px для смартфона.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
