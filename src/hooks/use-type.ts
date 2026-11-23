import { useResponsive } from '@/hooks/use-responsive';

/**
 * Responsive type scale aligned to production UI targets:
 * screen 22–26 · section 17–20 · card 15–17 · body 14–16 · label 12–14 · helper 11–12
 */
const compact = {
  hero: 26,
  display: 22,
  pageTitle: 24,
  screenTitle: 20,
  prominentTitle: 22,
  sectionTitle: 17,
  cardTitle: 15,
  body: 14,
  secondary: 13,
  caption: 12,
  small: 11,
  micro: 10,
  button: 15,
  input: 15,
  label: 12,
  tab: 10,
  helper: 11,
} as const;

const phone = {
  hero: 28,
  display: 24,
  pageTitle: 26,
  screenTitle: 22,
  prominentTitle: 24,
  sectionTitle: 18,
  cardTitle: 16,
  body: 15,
  secondary: 14,
  caption: 12,
  small: 12,
  micro: 11,
  button: 15,
  input: 15,
  label: 13,
  tab: 11,
  helper: 12,
} as const;

const tablet = {
  hero: 32,
  display: 28,
  pageTitle: 28,
  screenTitle: 24,
  prominentTitle: 26,
  sectionTitle: 20,
  cardTitle: 17,
  body: 16,
  secondary: 15,
  caption: 13,
  small: 12,
  micro: 12,
  button: 16,
  input: 16,
  label: 14,
  tab: 12,
  helper: 12,
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
