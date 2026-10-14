import type { LeadPreferences, NotifyPrefs, Plan, PlanId, Provider, QuoteDraft, RequestAnswers, SearchFilters, Session } from '@/data/types';

// No sample data lives here. Lists start empty and fill from the API. Only empty defaults and form
// choices that have no API yet are kept.

export const ME = 'me';

export function emptyFilters(): SearchFilters {
  return {
    city: '',
    distanceKm: null,
    cuisine: null,
    category: null,
    eventType: null,
    guests: '',
    maxPrice: '',
    dietary: [],
    fulfillment: [],
    staff: false,
    minRating: null,
    verifiedOnly: false,
    maxMinOrder: '',
  };
}

export function emptyAnswers(): RequestAnswers {
  return {
    venueKind: '',
    venueName: '',
    accessNotes: '',
    occasion: '',
    cuisine: '',
    cuisineStyle: '',
    vegetarian: '',
    base: '0',
    chicken: '0',
    pork: '0',
    beef: '0',
    fish: '0',
    shrimp: '0',
    vegetables: '0',
    extraVegetarian: '0',
    starters: '0',
    desserts: '0',
    servingFormat: '',
    staffed: '',
    warming: '',
    tableware: '',
    plates: '',
    cutlery: '',
    glasses: '',
    cateringStart: '',
    cateringEndDate: '',
    cateringEnd: '',
    decoration: '',
    buffetSetup: '',
    serving: '',
    drinksService: '',
    dishwashing: '',
    cleanup: '',
    handoff: '',
    handoffTime: '',
    drinks: '',
    drinkDetails: '',
    halal: '',
    forbidden: '',
    vegan: '',
    otherDiet: '',
  };
}

export function blankDraft(): QuoteDraft {
  return {
    step: 0,
    rawText: '',
    eventType: '',
    date: '',
    startTime: '',
    endTime: '',
    flexibleDate: false,
    postcode: '',
    city: '',
    location: '',
    setting: '',
    guests: '',
    adults: '',
    children: '',
    needs: [],
    cuisines: [],
    dishes: '',
    servingStyle: '',
    dietary: [],
    allergies: '',
    halal: false,
    halalConfirmed: false,
    servicePrefs: [],
    budgetType: 'per_person',
    budget: '',
    budgetTotal: '',
    notes: '',
    missing: [],
    understood: false,
    answers: emptyAnswers(),
  };
}

// getPlans sends the limits it knows (dishes, leads, contact, calendar, templates, statistics).
// These cover the rest until the API sends them too.
const entitlements = {
  free: { maxOfferings: 0, quoteLeads: false, maxRadiusKm: 15, advancedLeadFilters: false, contactVisible: false, templateLimit: 0, aiCredits: 0, analytics: 'none' as const, calendar: false, teamSeats: 1 },
  gold: { maxOfferings: 0, quoteLeads: false, maxRadiusKm: 60, advancedLeadFilters: false, contactVisible: false, templateLimit: 15, aiCredits: 40, analytics: 'none' as const, calendar: false, teamSeats: 3 },
  platinum: { maxOfferings: 0, quoteLeads: false, maxRadiusKm: 200, advancedLeadFilters: false, contactVisible: false, templateLimit: 99, aiCredits: 120, analytics: 'none' as const, calendar: false, teamSeats: 8 },
};

/** An empty plan of the given code. getPlans fills in the name, price, features and limits. */
export function planBase(id: PlanId): Plan {
  return { id, name: '', range: '', monthlyCents: 0, annualCents: 0, summary: '', includes: [], entitlements: entitlements[id] };
}

/** The signed-in vendor's own provider before getVendorProfile replies. */
export function blankProvider(): Provider {
  return {
    id: ME,
    name: '',
    legalName: '',
    type: '',
    city: '',
    postcode: '',
    province: '',
    radiusKm: 0,
    distanceKm: 0,
    intro: '',
    description: '',
    cuisines: [],
    services: [],
    eventTypes: [],
    rating: 0,
    reviewCount: 0,
    verified: false,
    kvkState: 'unverified',
    kvkNumber: '',
    vatNumber: '',
    responseTime: '',
    minGuests: 0,
    maxGuests: 0,
    minOrderCents: 0,
    languages: [],
    dietary: [],
    startingPriceCents: 0,
    plan: 'free',
    email: '',
    phone: '',
    website: '',
    contactPerson: '',
    address: '',
    cover: '',
    photo: '',
  };
}

export const leadPreferences: LeadPreferences = {
  radiusKm: 25,
  cities: '',
  minGuests: '',
  maxGuests: '',
  minOrder: '',
  minPerPerson: '',
  cuisines: [],
  services: [],
  eventTypes: [],
  weekdays: [],
  leadTimeDays: '',
  audience: 'any',
  excluded: '',
  timeWindow: '',
};

export const notifyPrefs: NotifyPrefs = {
  push: true,
  email: true,
  requests: true,
  messages: true,
  proposals: true,
  reviews: true,
};

export const guestSession: Session = {
  signedIn: false,
  emailVerified: false,
  phoneVerified: false,
  name: '',
  email: '',
  phone: '',
  photo: '',
  mode: 'customer',
  hasProviderProfile: false,
  planId: 'free',
  billing: 'monthly',
  aiUsed: 0,
};

export const profileViews = { profile: 0, offerings: 0, search: 0, responseHours: 0 };
