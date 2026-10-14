import type { Category, QuoteDraft } from '@/data/types';

const CITIES: Record<string, string> = {
  utrecht: '3511',
  amsterdam: '1012',
  rotterdam: '3011',
  haarlem: '2011',
  'den haag': '2511',
  'the hague': '2511',
};

export function interpretRequest(text: string, current: QuoteDraft, categories: Category[]) {
  const lower = text.toLowerCase();
  const next: QuoteDraft = { ...current, rawText: text, notes: current.notes || text, missing: [] };
  if (/birthday|verjaardag/.test(lower)) next.eventType = 'Birthday';
  if (/wedding|bruiloft/.test(lower)) next.eventType = 'Wedding';
  if (/corporate|kantoor|office|company/.test(lower)) next.eventType = 'Corporate';
  const guests = lower.match(/(\d{1,4})\s*(people|guests|personen|gasten|persons)/);
  if (guests) next.guests = guests[1];
  for (const [city, postcode] of Object.entries(CITIES)) {
    if (lower.includes(city)) {
      next.city = city === 'the hague' || city === 'den haag' ? 'Den Haag' : city[0].toUpperCase() + city.slice(1);
      next.postcode = postcode;
    }
  }
  const needs = categories
    .filter((item) => lower.includes(item.name.toLowerCase()) || lower.includes(item.code.replace('_', ' ')))
    .map((item) => item.code);
  if (/eten|buffet|nasi|catering/.test(lower)) needs.push('food');
  if (/serv|bedien/.test(lower)) needs.push('staff');
  if (/ijs/.test(lower)) needs.push('ice_cream');
  if (/koffie/.test(lower)) needs.push('coffee');
  const known = new Set(categories.map((item) => item.code));
  next.needs = [...new Set(needs)].filter((code) => known.has(code));
  if (/halal/.test(lower)) next.halal = true;
  if (/vegetarian|vegetar/.test(lower)) next.dietary = [...new Set([...next.dietary, 'Vegetarian'])];
  if (/vegan/.test(lower)) next.dietary = [...new Set([...next.dietary, 'Vegan'])];
  const budget = lower.match(/€\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*(euro|eur)/);
  if (budget) {
    next.budgetType = /total|budget of/.test(lower) ? 'total' : 'per_person';
    next.budget = (budget[1] || budget[2]).replace('.', ',');
  }
  if (/serv/.test(lower)) next.servicePrefs = [...new Set([...next.servicePrefs, 'Serving staff'])];
  const missing: string[] = [];
  if (!next.eventType) missing.push('Event type');
  if (!next.date) missing.push('Event date');
  if (!next.city && !next.postcode) missing.push('City or postcode');
  if (!next.guests) missing.push('Guest count');
  if (!next.needs.length) missing.push('What you need: food, staff, or something else');
  missing.push('Allergy information — add it yourself. This assist will not guess.');
  if (next.halal) missing.push('Confirm the halal preference. It was only spotted in your text.');
  next.missing = missing;
  return next;
}

export function draftDescription(title: string, cuisine: string, offerType: string) {
  const cuisineLine = cuisine ? `${cuisine} ` : '';
  return `${title} is a ${cuisineLine}${offerType.replace('_', ' ')} for events in the Netherlands. Guest count, timing and the venue can change what is included. The price shown is a starting indication. Allergens and dietary claims must be confirmed by the provider before they are published.`;
}

export function improveText(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return draftDescription('This offering', '', 'offering');
  const sentence = trimmed.endsWith('.') ? trimmed : `${trimmed}.`;
  return `${sentence} Final quantities, staffing and travel are agreed directly with the customer. The listed price is indicative.`;
}

export function draftProposalIntro(eventType: string, city: string, guests: number) {
  return `Thank you for the ${eventType.toLowerCase()} request${city ? ` in ${city}` : ''}${guests ? ` for about ${guests} guests` : ''}. This note is a draft you can edit. The amounts below are an indication, not a final agreement.`;
}

export function leadSummary(eventType: string, city: string, guests: number, needs: string[], budget: string) {
  return `${eventType} in ${city || 'the Netherlands'} for ${guests || 'an unstated number of'} guests. Needs: ${needs.join(', ') || 'not specified'}. Budget: ${budget}.`;
}

export function suggestedQuestions(allergies: string, setting: string, halal: boolean) {
  const questions = ['What time should service start and end?'];
  if (!setting) questions.push('Is the event indoor, outdoor, or both?');
  if (!allergies || allergies === 'Not stated') questions.push('Are there allergies we should know about? Please state them explicitly.');
  if (halal) questions.push('Please confirm the halal requirement so we do not assume certification.');
  questions.push('Is there a lift, ground-floor entrance, and power on site?');
  return questions;
}

export function draftTemplate(cuisine: string) {
  const name = cuisine ? `${cuisine} buffet` : 'Standard buffet';
  return {
    name,
    message: `Our usual ${name.toLowerCase()}. Edit the dishes and prices before you save it.`,
    items: cuisine === 'Surinamese' ? ['Nasi', 'Bami', 'Chicken', 'Vegetables'] : ['Main', 'Side', 'Salad'],
    services: ['Delivery'],
    included: ['Food', 'Delivery'],
    excluded: ['Staff', 'Venue'],
    assumptions: 'Guest count is close to the request. Price is indicative.',
  };
}
