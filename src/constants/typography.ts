import { typeForWidth } from '@/hooks/use-type';

const phone = typeForWidth(400);

export const typography = {
  screenTitle: phone.screenTitle,
  prominentScreenTitle: phone.prominentTitle,
  pageTitle: phone.pageTitle,
  compactPageTitle: typeForWidth(320).pageTitle,
  sectionTitle: phone.sectionTitle,
  cardTitle: phone.cardTitle,
  body: phone.body,
  secondary: phone.secondary,
  caption: phone.caption,
  small: phone.small,
  helper: phone.helper,
  label: phone.label,
  button: phone.button,
} as const;
