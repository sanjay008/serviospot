import { useResponsive } from '@/hooks/use-responsive';

const compact = {
  hero: 26,
  display: 22,
  pageTitle: 22,
  screenTitle: 18,
  prominentTitle: 20,
  sectionTitle: 16,
  cardTitle: 15,
  body: 14,
  secondary: 13,
  caption: 12,
  small: 11,
  micro: 10,
  button: 14,
  input: 15,
  label: 14,
  tab: 10,
} as const;

const phone = {
  hero: 30,
  display: 24,
  pageTitle: 26,
  screenTitle: 20,
  prominentTitle: 22,
  sectionTitle: 18,
  cardTitle: 16,
  body: 15,
  secondary: 14,
  caption: 13,
  small: 12,
  micro: 11,
  button: 15,
  input: 16,
  label: 15,
  tab: 11,
} as const;

const tablet = {
  hero: 34,
  display: 28,
  pageTitle: 30,
  screenTitle: 22,
  prominentTitle: 24,
  sectionTitle: 20,
  cardTitle: 18,
  body: 17,
  secondary: 16,
  caption: 14,
  small: 13,
  micro: 12,
  button: 17,
  input: 17,
  label: 16,
  tab: 12,
} as const;

export type TypeScale = { [K in keyof typeof phone]: number };

export function typeForWidth(width: number): TypeScale {
  if (width < 360) return compact;
  if (width >= 768) return tablet;
  return phone;
}

export function useType(): TypeScale {
  const { width } = useResponsive();
  return typeForWidth(width);
}

export function leading(size: number, extra = 6) {
  return size + extra;
}
