import { Lang } from './resume.js';

export interface Theme {
  id: string;
  name: Record<Lang, string>;
  accent: string;
}

export const themes: Theme[] = [
  {
    id: 'blue',
    name: { ru: 'Синий', uz: 'Moviy', en: 'Blue' },
    accent: '#2563EB',
  },
  {
    id: 'emerald',
    name: { ru: 'Изумрудный', uz: 'Zumrad', en: 'Emerald' },
    accent: '#059669',
  },
  {
    id: 'graphite',
    name: { ru: 'Графит', uz: 'Grafit', en: 'Graphite' },
    accent: '#374151',
  },
  {
    id: 'burgundy',
    name: { ru: 'Бордо', uz: 'Bordo', en: 'Burgundy' },
    accent: '#9F1239',
  },
  {
    id: 'violet',
    name: { ru: 'Фиолетовый', uz: 'Binafsha', en: 'Violet' },
    accent: '#7C3AED',
  },
  {
    id: 'terracotta',
    name: { ru: 'Терракота', uz: 'Terrakota', en: 'Terracotta' },
    accent: '#C2410C',
  },
  {
    id: 'teal',
    name: { ru: 'Бирюзовый', uz: 'Feruza', en: 'Teal' },
    accent: '#0F766E',
  },
  {
    id: 'mono',
    name: { ru: 'Чёрно-белый', uz: 'Oq-qora', en: 'Monochrome' },
    accent: '#111111',
  },
];

export interface Palette {
  accent: string;
  accentStrong: string;
  accentSoft: string;
  sidebarBg: string;
  headerBg: string;
  headerText: string;
  text: string;
  muted: string;
  bg: string;
  rule: string;
  wasDarkened: boolean;
  contrastWithWhite: number;
}

// Convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Calculate relative luminance according to WCAG 2.1
function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Calculate contrast ratio against white (1.0)
export function getContrastRatioWithWhite(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const lum = getLuminance(r, g, b);
  return (1.0 + 0.05) / (lum + 0.05);
}

// Darken hex color
function darkenColor(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * factor, g * factor, b * factor);
}

// Tint/lighten color (soft pastel)
function tintColor(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * factor, g + (255 - g) * factor, b + (255 - b) * factor);
}

export function buildPalette(accentHex: string): Palette {
  let hex = accentHex.startsWith('#') ? accentHex : `#${accentHex}`;
  let wasDarkened = false;

  let contrast = getContrastRatioWithWhite(hex);
  // Auto-darken if contrast with white < 4.5:1
  let attempts = 0;
  while (contrast < 4.5 && attempts < 25) {
    hex = darkenColor(hex, 0.94);
    contrast = getContrastRatioWithWhite(hex);
    wasDarkened = true;
    attempts++;
  }

  const accentStrong = darkenColor(hex, 0.85);
  const accentSoft = tintColor(hex, 0.92);
  const sidebarBg = tintColor(hex, 0.95);
  const headerBg = hex;
  const headerText = getContrastRatioWithWhite(headerBg) >= 4.5 ? '#FFFFFF' : '#111827';

  return {
    accent: hex,
    accentStrong,
    accentSoft,
    sidebarBg,
    headerBg,
    headerText,
    text: '#111827',
    muted: '#4B5563',
    bg: '#FFFFFF',
    rule: '#E5E7EB',
    wasDarkened,
    contrastWithWhite: Math.round(contrast * 10) / 10,
  };
}
