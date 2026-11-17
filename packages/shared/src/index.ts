export * from './resume.js';
export * from './errors.js';
export * from './palette.js';
export * from './translit.js';
export * from './typograf.js';
export * from './completeness.js';
import positionsData from './data/positions.json' with { type: 'json' };
import skillsData from './data/skills-dictionary.json' with { type: 'json' };

export const POSITIONS_LIST = positionsData as string[];
export const SKILLS_DICTIONARY = skillsData as {
  hard: string[];
  soft: string[];
  synonyms: Record<string, string>;
};
