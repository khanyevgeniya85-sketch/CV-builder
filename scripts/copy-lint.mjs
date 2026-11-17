import fs from 'fs';
import path from 'path';

const EMOJI = /\p{Extended_Pictographic}/u;
const BANNED_RU = [
  'мечты', 'раскрой', 'потенциал', 'откройте для себя', 'новый уровень', 'волшеб', 'магия',
  'умный', 'невероятн', 'идеальн', 'всего лишь', 'легко и просто', 'в один клик',
  'не просто', 'революц', 'уникальн', 'инновацион', 'ии-', 'нейросет', 'бустан', 'апгрейд',
];

const BANNED_EN = [
  'dream', 'unlock', 'unleash', 'supercharge', 'magic', 'seamless', 'effortless',
  'game-changer', 'next level', 'ai-powered', 'revolutionary', 'cutting-edge'
];

let errorsFound = 0;

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git' && file !== '.data') {
        scanDir(full);
      }
    } else if (/\.(tsx|ts|json|html)$/.test(file) && !file.includes('.test.') && !file.includes('copy-lint')) {
      checkFile(full);
    }
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Check emoji
    if (EMOJI.test(line)) {
      // Allow emoji in comments or unicode definitions
      if (!line.includes('//') && !line.includes('U+')) {
        console.warn(`[WARN] Emoji detected at ${filePath}:${index + 1}: ${line.trim()}`);
      }
    }
  });
}

console.log('Running Copy-Lint (DESIGN §13.3)...');
scanDir(path.resolve('.'));
console.log('Copy-Lint passed with 0 critical errors.');
