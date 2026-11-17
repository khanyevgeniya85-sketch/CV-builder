export function normalizeUzApostrophe(text: string): string {
  // Normalize various apostrophe-like chars (', `, ʻ, etc.) to U+2018 (‘)
  return text.replace(/[ʻ`']/g, '‘');
}

export function typograf(text: string): string {
  if (!text) return text;
  // Non-breaking space after 1-2 letter words
  let result = text.replace(/(^|\s)([a-zA-Zа-яА-ЯёЁ]{1,2})\s+/g, '$1$2\u00A0');
  // Em-dash with non-breaking space before it
  result = result.replace(/\s+([—–])\s+/g, '\u00A0$1 ');
  return normalizeUzApostrophe(result);
}
