const cyrillicToLatinMap: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
  з: 'z', и: 'i', й: 'j', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu',
  я: 'ya',
  А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Е: 'E', Ё: 'Yo', Ж: 'Zh',
  З: 'Z', И: 'I', Й: 'J', К: 'K', Л: 'L', М: 'M', Н: 'N', О: 'O',
  П: 'P', Р: 'R', С: 'S', Т: 'T', У: 'U', Ф: 'F', Х: 'Kh', Ц: 'Ts',
  Ч: 'Ch', Ш: 'Sh', Щ: 'Shch', Ъ: '', Ы: 'Y', Ь: '', Э: 'E', Ю: 'Yu',
  Я: 'Ya',
  ў: 'o', Ў: 'O', ғ: 'g', Ғ: 'G', қ: 'q', Қ: 'Q', ҳ: 'h', Ҳ: 'H',
};

export type ExportFormat =
  | 'pdf-desktop'
  | 'pdf-mobile'
  | 'png-mobile'
  | 'pdf-cover-letter'
  | 'pdf-recommendation'
  | 'zip-kit';

export function transliterate(text: string): string {
  // Normalize Uzbek apostrophes
  const result = text
    .replace(/o['‘’ʻ`]/gi, (match) => (match[0] === 'O' ? 'O' : 'o'))
    .replace(/g['‘’ʻ`]/gi, (match) => (match[0] === 'G' ? 'G' : 'g'));

  let out = '';
  for (const char of result) {
    if (cyrillicToLatinMap[char] !== undefined) {
      out += cyrillicToLatinMap[char];
    } else {
      out += char;
    }
  }

  // Clean special characters for file names
  return out
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

export function generateExportFileName(
  fullName: string,
  position: string,
  format: ExportFormat
): string {
  const namePart = transliterate(fullName || 'Resume') || 'Resume';
  const posPart = transliterate(position || 'CV') || 'CV';

  switch (format) {
    case 'pdf-mobile':
      return `${namePart}_${posPart}_CV_mobile.pdf`;
    case 'png-mobile':
      return `${namePart}_${posPart}_CV_mobile.png`;
    case 'pdf-cover-letter':
      return `${namePart}_${posPart}_Cover_Letter.pdf`;
    case 'pdf-recommendation':
      return `${namePart}_${posPart}_Recommendation.pdf`;
    case 'zip-kit':
      return `${namePart}_${posPart}_Application_Kit.zip`;
    case 'pdf-desktop':
    default:
      return `${namePart}_${posPart}_CV.pdf`;
  }
}
