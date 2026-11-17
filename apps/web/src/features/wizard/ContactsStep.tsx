import React from 'react';
import { useResumeStore } from '../../store/resumeStore.js';

export const ContactsStep: React.FC = () => {
  const { data, updateContacts } = useResumeStore();
  const contacts = data.contacts || { phone: '+998', email: '' };

  return (
    <div className="space-y-6">
      {/* Phone */}
      <div>
        <label className="input-label">Телефон *</label>
        <input
          type="tel"
          className="input-field"
          placeholder="+998 90 123 45 67"
          value={contacts.phone || ''}
          onChange={(e) => updateContacts({ phone: e.target.value })}
        />
        <div className="input-hint">Основной номер для звонков и связи в мессенджерах</div>
      </div>

      {/* Email */}
      <div>
        <label className="input-label">Электронная почта *</label>
        <input
          type="email"
          className="input-field"
          placeholder="name@example.uz"
          value={contacts.email || ''}
          onChange={(e) => updateContacts({ email: e.target.value })}
        />
      </div>

      {/* Telegram */}
      <div>
        <label className="input-label">Telegram</label>
        <input
          type="text"
          className="input-field"
          placeholder="@username"
          value={contacts.telegram || ''}
          onChange={(e) => updateContacts({ telegram: e.target.value })}
        />
        <div className="input-hint">Ссылка на ваш контакт в Telegram (@username или t.me/username)</div>
      </div>

      {/* LinkedIn */}
      <div>
        <label className="input-label">LinkedIn</label>
        <input
          type="url"
          className="input-field"
          placeholder="https://linkedin.com/in/username"
          value={contacts.linkedin || ''}
          onChange={(e) => updateContacts({ linkedin: e.target.value })}
        />
      </div>

      {/* Website / Portfolio */}
      <div>
        <label className="input-label">Портфолио или сайт</label>
        <input
          type="url"
          className="input-field"
          placeholder="https://github.com/username или личный сайт"
          value={contacts.website || ''}
          onChange={(e) => updateContacts({ website: e.target.value })}
        />
      </div>
    </div>
  );
};
