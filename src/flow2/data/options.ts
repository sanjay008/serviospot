import type { DishCounts, TaskKey } from '@/flow2/data/types';

export const b = (nl: string, en: string) => ({ nl, en });

export const CUISINES: { value: string; label: { nl: string; en: string } }[] = [
  { value: 'surinamese', label: b('Surinaams', 'Surinamese') },
  { value: 'turkish', label: b('Turks', 'Turkish') },
  { value: 'dutch', label: b('Nederlands', 'Dutch') },
  { value: 'african', label: b('Afrikaans', 'African') },
  { value: 'indian', label: b('Indiaas', 'Indian') },
  { value: 'mixed', label: b('Meerdere keukens', 'Mixed cuisines') },
  { value: 'other', label: b('Anders', 'Other') },
];

export const CUISINE_STYLES: { value: string; label: { nl: string; en: string } }[] = [
  { value: 'hindustani', label: b('Hindoestaans', 'Hindustani') },
  { value: 'creole', label: b('Creools', 'Creole') },
  { value: 'javanese', label: b('Javaans', 'Javanese') },
  { value: 'mixedStyle', label: b('Gemixt', 'Mixed') },
  { value: 'none', label: b('Geen voorkeur', 'No preference') },
];

export const OCCASIONS: { value: string; label: { nl: string; en: string } }[] = [
  { value: 'birthday', label: b('Verjaardag', 'Birthday') },
  { value: 'wedding', label: b('Bruiloft', 'Wedding') },
  { value: 'business', label: b('Zakelijk evenement', 'Business event') },
  { value: 'other', label: b('Anders', 'Other') },
];

export const VENUE_TYPES: { value: 'home' | 'venue'; label: { nl: string; en: string } }[] = [
  { value: 'home', label: b('Thuis', 'Home') },
  { value: 'venue', label: b('Venue / zaal', 'Venue / hall') },
];

export const SETTINGS: { value: 'indoor' | 'outdoor' | 'both'; label: { nl: string; en: string } }[] = [
  { value: 'indoor', label: b('Binnen', 'Indoor') },
  { value: 'outdoor', label: b('Buiten', 'Outdoor') },
  { value: 'both', label: b('Beide', 'Both') },
];

export const VEGETARIANS: { value: 'no' | 'full' | 'mixed'; label: { nl: string; en: string } }[] = [
  { value: 'no', label: b('Nee', 'No') },
  { value: 'full', label: b('Ja, volledig vegetarisch', 'Yes, fully vegetarian') },
  { value: 'mixed', label: b('Gemixt', 'Mixed') },
];

export const FORMATS: { value: 'buffet' | 'plated' | 'bites'; label: { nl: string; en: string } }[] = [
  { value: 'buffet', label: b('Buffet', 'Buffet') },
  { value: 'plated', label: b('Uitgeserveerd', 'Plated') },
  { value: 'bites', label: b('Hapjes', 'Bites') },
];

export const YES_NO: { value: 'no' | 'yes'; label: { nl: string; en: string } }[] = [
  { value: 'no', label: b('Nee', 'No') },
  { value: 'yes', label: b('Ja', 'Yes') },
];

export const FULFILMENTS: { value: 'delivery' | 'pickup'; label: { nl: string; en: string } }[] = [
  { value: 'delivery', label: b('Bezorgen', 'Delivery') },
  { value: 'pickup', label: b('Ophalen', 'Pickup') },
];

export const WARE: { value: 'real' | 'plastic' | 'own'; label: { nl: string; en: string } }[] = [
  { value: 'real', label: b('Echt servies', 'Real tableware') },
  { value: 'plastic', label: b('Plastic / wegwerp', 'Plastic / disposable') },
  { value: 'own', label: b('Ik regel zelf servies', 'I arrange my own tableware') },
];

export const DRINK_TYPES: { value: 'soft' | 'alcohol' | 'both'; label: { nl: string; en: string } }[] = [
  { value: 'soft', label: b('Alcoholvrij', 'Non-alcoholic') },
  { value: 'alcohol', label: b('Alcohol', 'Alcohol') },
  { value: 'both', label: b('Beide', 'Both') },
];

export const COUNT_FIELDS: { key: keyof DishCounts; label: { nl: string; en: string }; animal: boolean }[] = [
  { key: 'base', label: b('Aantal basisgerechten', 'Base dishes'), animal: false },
  { key: 'chicken', label: b('Aantal kipgerechten', 'Chicken dishes'), animal: true },
  { key: 'pork', label: b('Aantal varkensgerechten', 'Pork dishes'), animal: true },
  { key: 'beef', label: b('Aantal rundgerechten', 'Beef dishes'), animal: true },
  { key: 'fish', label: b('Aantal visgerechten', 'Fish dishes'), animal: true },
  { key: 'shrimp', label: b('Aantal garnalengerechten', 'Shrimp dishes'), animal: true },
  { key: 'veg', label: b('Aantal groentegerechten', 'Vegetable dishes'), animal: false },
  { key: 'extraVeg', label: b('Aantal extra vegetarische gerechten', 'Extra vegetarian dishes'), animal: false },
  { key: 'starter', label: b('Aantal voorgerechten', 'Starters'), animal: false },
  { key: 'dessert', label: b('Aantal nagerechten', 'Desserts'), animal: false },
];

export const TASKS: { key: TaskKey; label: { nl: string; en: string } }[] = [
  { key: 'decorate', label: b('Aankleden / opbouwen', 'Decoration / setup') },
  { key: 'buffet', label: b('Buffet klaarzetten', 'Buffet setup') },
  { key: 'serve', label: b('Serveren', 'Serving') },
  { key: 'bar', label: b('Drank bedienen', 'Drinks service') },
  { key: 'wash', label: b('Afwassen', 'Dishwashing') },
  { key: 'clean', label: b('Opruimen / afbouwen', 'Cleanup / teardown') },
];

export const CAPABILITIES: { value: string; label: { nl: string; en: string } }[] = [
  { value: 'food', label: b('Eten / buffet', 'Food / buffet') },
  { value: 'vegetarian', label: b('Volledig vegetarisch', 'Fully vegetarian') },
  { value: 'vegan', label: b('Veganistische opties', 'Vegan options') },
  { value: 'halal', label: b('Halal', 'Halal') },
  { value: 'staff', label: b('Bediening', 'Staff') },
  { value: 'decoration', label: b('Aankleden / opbouwen', 'Decoration / setup') },
  { value: 'warm', label: b('Warmhoudbakken', 'Warming trays') },
  { value: 'realWare', label: b('Echt servies', 'Real tableware') },
  { value: 'drinks', label: b('Drank', 'Drinks') },
  { value: 'equipment', label: b('Materialen / verhuur', 'Equipment / rental') },
];

export const emptyCounts = (): DishCounts => ({
  base: 0,
  chicken: 0,
  pork: 0,
  beef: 0,
  fish: 0,
  shrimp: 0,
  veg: 0,
  extraVeg: 0,
  starter: 0,
  dessert: 0,
});

export const totalDishes = (counts: DishCounts): number =>
  COUNT_FIELDS.reduce((sum, field) => sum + Number(counts[field.key] || 0), 0);

export const labelOf = <T extends { value: string; label: { nl: string; en: string } }>(list: T[], value: string, lang: 'nl' | 'en'): string =>
  list.find((item) => item.value === value)?.label[lang] ?? value;
