import { Lang, SectionKey, EducationLevel, Personal } from '@cvb/shared';

export const SECTION_TITLES: Record<SectionKey | 'contacts', Record<Lang, string>> = {
  summary: {
    ru: 'О себе',
    uz: 'Men haqimda',
    en: 'Summary',
  },
  strengths: {
    ru: 'Сильные стороны',
    uz: 'Asosiy ustunliklar',
    en: 'Key Strengths',
  },
  experience: {
    ru: 'Опыт работы',
    uz: 'Ish tajribasi',
    en: 'Experience',
  },
  projects: {
    ru: 'Проекты',
    uz: 'Loyihalar',
    en: 'Projects',
  },
  education: {
    ru: 'Образование',
    uz: 'Ta\'lim',
    en: 'Education',
  },
  skills: {
    ru: 'Навыки',
    uz: 'Ko‘nikmalar',
    en: 'Skills',
  },
  languages: {
    ru: 'Языки',
    uz: 'Tillar',
    en: 'Languages',
  },
  contacts: {
    ru: 'Контакты',
    uz: 'Aloqa',
    en: 'Contacts',
  },
};

export const COMMON_LABELS: Record<string, Record<Lang, string>> = {
  present: {
    ru: 'по настоящее время',
    uz: 'hozirgi vaqtgacha',
    en: 'Present',
  },
  hardSkills: {
    ru: 'Профессиональные навыки',
    uz: 'Professional ko‘nikmalar',
    en: 'Technical Skills',
  },
  softSkills: {
    ru: 'Личные качества',
    uz: 'Shaxsiy fazilatlar',
    en: 'Soft Skills',
  },
  yearsOld: {
    ru: 'лет',
    uz: 'yosh',
    en: 'y.o.',
  },
  bornYear: {
    ru: 'г.р.',
    uz: 'y.t.',
    en: 'b.',
  },
  relocate: {
    ru: 'Готов к релокации',
    uz: 'Ko‘chib o‘tishga tayyor',
    en: 'Open to relocate',
  },
  remote: {
    ru: 'Удалённая работа',
    uz: 'Masofaviy ish',
    en: 'Remote ready',
  },
  coverLetterTitle: {
    ru: 'Мотивационное письмо',
    uz: 'Motivatsion xat',
    en: 'Cover Letter',
  },
  recommendationLetterTitle: {
    ru: 'Рекомендательное письмо',
    uz: 'Tavsiyanoma',
    en: 'Letter of Recommendation',
  },
  toLabel: {
    ru: 'Кому',
    uz: 'Kimga',
    en: 'To',
  },
  vacancyLabel: {
    ru: 'Вакансия',
    uz: 'Lavozim',
    en: 'Position',
  },
  recommenderLabel: {
    ru: 'Рекомендатель',
    uz: 'Tavsiya beruvchi',
    en: 'Recommended by',
  },
  level_secondary: {
    ru: 'Среднее образование',
    uz: 'O‘rta ta\'lim',
    en: 'Secondary Education',
  },
  level_vocational: {
    ru: 'Среднее специальное',
    uz: 'O‘rta maxsus ta\'lim',
    en: 'Vocational Education',
  },
  level_bachelor: {
    ru: 'Бакалавриат',
    uz: 'Bakalavr',
    en: 'Bachelor\'s Degree',
  },
  level_master: {
    ru: 'Магистратура',
    uz: 'Magistratura',
    en: 'Master\'s Degree',
  },
  level_course: {
    ru: 'Курсы и тренинги',
    uz: 'Kurslar',
    en: 'Courses & Training',
  },
  level_certificate: {
    ru: 'Сертификация',
    uz: 'Sertifikat',
    en: 'Certification',
  },
};

export function getSectionTitle(key: SectionKey | 'contacts', lang: Lang): string {
  return SECTION_TITLES[key]?.[lang] || SECTION_TITLES[key]?.ru || key;
}

export function getCommonLabel(key: string, lang: Lang): string {
  return COMMON_LABELS[key]?.[lang] || COMMON_LABELS[key]?.ru || key;
}

export function getEducationLevelName(level: EducationLevel, lang: Lang): string {
  const key = `level_${level}`;
  return COMMON_LABELS[key]?.[lang] || level;
}

export function formatCandidateMeta(personal: Personal, lang: Lang): string {
  const parts: string[] = [];

  // Address / Location
  const addrParts: string[] = [];
  if (personal.address?.city) {
    addrParts.push(personal.address.city);
  } else if (personal.city) {
    addrParts.push(personal.city);
  }
  if (personal.address?.districtOrStreet) {
    addrParts.push(personal.address.districtOrStreet);
  }
  if (personal.address?.country && addrParts.length > 0 && personal.address.country !== addrParts[0]) {
    addrParts.push(personal.address.country);
  } else if (personal.address?.country && addrParts.length === 0) {
    addrParts.push(personal.address.country);
  }

  if (addrParts.length > 0) {
    parts.push(addrParts.join(', '));
  }

  if (personal.address?.remoteWork) {
    parts.push(getCommonLabel('remote', lang));
  }
  if (personal.address?.willingToRelocate) {
    parts.push(getCommonLabel('relocate', lang));
  }

  // Birth Year / Age
  if (!personal.hideBirthDate) {
    let year = personal.birthYear;
    if (!year && personal.birthDate) {
      const parsedYear = new Date(personal.birthDate).getFullYear();
      if (!isNaN(parsedYear) && parsedYear >= 1940) {
        year = parsedYear;
      }
    }

    if (year) {
      if (personal.showAge) {
        const currentYear = new Date().getFullYear();
        let age = currentYear - year;
        if (personal.birthDate) {
          const birth = new Date(personal.birthDate);
          const now = new Date();
          const m = now.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
            age--;
          }
        }
        parts.push(`${age} ${getCommonLabel('yearsOld', lang)}`);
      } else {
        parts.push(
          lang === 'en'
            ? `${getCommonLabel('bornYear', lang)} ${year}`
            : `${year} ${getCommonLabel('bornYear', lang)}`
        );
      }
    }
  }

  return parts.join(' · ');
}
