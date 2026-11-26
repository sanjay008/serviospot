import type { Lang } from '@/flow2/data/types';
import catalog from '../../translations/bulk.en-nl-ar.json';

type Entry = { en: string; nl: string; ar: string };

const phrases = catalog as Record<string, Entry>;

export function phrase(value: { nl: string; en: string }, lang: Lang) {
  const entry = phrases[value.en];
  if (lang === 'nl') return entry?.nl || value.nl;
  if (lang === 'ar') return entry?.ar || value.en;
  return value.en;
}
