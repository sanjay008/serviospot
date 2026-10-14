import type { Lang } from '@/data/types';

export const money = (value: number, lang: Lang = 'nl'): string =>
  new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value);

export const dateLong = (iso: string, lang: Lang = 'nl'): string => {
  if (!iso) return '—';
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(lang === 'nl' ? 'nl-NL' : 'en-GB', { dateStyle: 'long' }).format(date);
};

export const pluralGuests = (count: number, lang: Lang = 'nl'): string =>
  lang === 'nl' ? `${count} personen` : `${count} guests`;
