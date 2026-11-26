import type { Lang } from '@/flow2/data/types';

const localeOf = (lang: Lang) => (lang === 'nl' ? 'nl-NL' : lang === 'ar' ? 'ar' : 'en-GB');

export const money = (value: number, lang: Lang = 'en'): string =>
  new Intl.NumberFormat(localeOf(lang), { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value);

export const dateLong = (iso: string, lang: Lang = 'en'): string => {
  if (!iso) return '—';
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(localeOf(lang), { dateStyle: 'long' }).format(date);
};

export const pluralGuests = (count: number, lang: Lang = 'en'): string => {
  if (lang === 'nl') return `${count} personen`;
  if (lang === 'ar') return `${count} ضيوف`;
  return `${count} guests`;
};
