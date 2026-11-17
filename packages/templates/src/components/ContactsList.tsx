import React from 'react';
import { Contacts } from '@cvb/shared';
import { Phone, Mail, Send, Linkedin, Globe } from 'lucide-react';

interface ContactsListProps {
  contacts: Contacts;
  format: 'desktop' | 'mobile';
  className?: string;
  themeStyle?: 'sidebar' | 'inline' | 'header';
}

export const ContactsList: React.FC<ContactsListProps> = ({ contacts, format, className = '', themeStyle = 'inline' }) => {
  const isMobile = format === 'mobile';

  const telegramUrl = contacts.telegram
    ? contacts.telegram.startsWith('http')
      ? contacts.telegram
      : `https://t.me/${contacts.telegram.replace('@', '')}`
    : undefined;

  const linkedinUrl = contacts.linkedin
    ? contacts.linkedin.startsWith('http')
      ? contacts.linkedin
      : `https://${contacts.linkedin}`
    : undefined;

  const websiteUrl = contacts.website
    ? contacts.website.startsWith('http')
      ? contacts.website
      : `https://${contacts.website}`
    : undefined;

  const items = [
    contacts.phone && {
      icon: <Phone size={14} className="shrink-0" />,
      label: contacts.phone,
      href: `tel:${contacts.phone.replace(/[^0-9+]/g, '')}`,
    },
    contacts.email && {
      icon: <Mail size={14} className="shrink-0" />,
      label: contacts.email,
      href: `mailto:${contacts.email}`,
    },
    contacts.telegram && {
      icon: <Send size={14} className="shrink-0" />,
      label: contacts.telegram.startsWith('@') ? contacts.telegram : `@${contacts.telegram}`,
      href: telegramUrl,
    },
    contacts.linkedin && {
      icon: <Linkedin size={14} className="shrink-0" />,
      label: 'LinkedIn',
      href: linkedinUrl,
    },
    contacts.website && {
      icon: <Globe size={14} className="shrink-0" />,
      label: contacts.website.replace(/^https?:\/\//, ''),
      href: websiteUrl,
    },
  ].filter(Boolean) as Array<{ icon: React.ReactNode; label: string; href?: string }>;

  if (items.length === 0) return null;

  if (isMobile) {
    return (
      <div className={`cvb-contacts cvb-contacts-mobile ${className}`}>
        {items.map((item, idx) => (
          item.href ? (
            <a
              key={idx}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="cvb-contact-chip-mobile"
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </a>
          ) : (
            <div key={idx} className="cvb-contact-chip-mobile">
              {item.icon}
              <span className="truncate">{item.label}</span>
            </div>
          )
        ))}
      </div>
    );
  }

  return (
    <div className={`cvb-contacts cvb-contacts-${themeStyle} ${className}`}>
      {items.map((item, idx) => (
        item.href ? (
          <a
            key={idx}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="cvb-contact-item"
          >
            {item.icon}
            <span className="truncate">{item.label}</span>
          </a>
        ) : (
          <div key={idx} className="cvb-contact-item">
            {item.icon}
            <span className="truncate">{item.label}</span>
          </div>
        )
      ))}
    </div>
  );
};
