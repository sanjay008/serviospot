export type PlanId = 'free' | 'gold' | 'platinum';
/** A service category from getCategories. `code` is what the API stores, `name` is what people see. */
export type Category = { code: string; name: string };

export type Invoice = { id: string; number: string; amountCents: number; status: string; date: string };
export type OfferType = 'dish' | 'menu' | 'service' | 'beverage' | 'concept' | 'rental';
export type PriceType = 'per_person' | 'per_item' | 'per_tray' | 'per_hour' | 'per_day' | 'fixed' | 'package' | 'on_request';
export type Fulfillment = 'delivery' | 'pickup' | 'on_site';
export type RequestStatus =
  | 'draft'
  | 'submitted'
  | 'matching'
  | 'receiving'
  | 'comparing'
  | 'contact_released'
  | 'event_pending'
  | 'completed'
  | 'closed'
  | 'cancelled'
  | 'expired';
export type LeadStatus =
  | 'invited'
  | 'viewed'
  | 'available'
  | 'partial'
  | 'maybe'
  | 'unavailable'
  | 'proposal_draft'
  | 'proposal_submitted'
  | 'continued'
  | 'not_selected'
  | 'expired'
  | 'withdrawn';
export type Availability = 'available' | 'partial' | 'maybe' | 'unavailable';

export type Entitlements = {
  maxOfferings: number;
  quoteLeads: boolean;
  maxRadiusKm: number;
  advancedLeadFilters: boolean;
  contactVisible: boolean;
  templateLimit: number;
  aiCredits: number;
  analytics: 'none' | 'basic' | 'advanced' | 'business';
  calendar: boolean;
  teamSeats: number;
};

export type Plan = {
  id: PlanId;
  name: string;
  range: string;
  monthlyCents: number;
  annualCents: number;
  summary: string;
  includes: string[];
  entitlements: Entitlements;
};

export type Provider = {
  id: string;
  name: string;
  legalName: string;
  type: string;
  city: string;
  postcode: string;
  province: string;
  radiusKm: number;
  distanceKm: number;
  intro: string;
  description: string;
  cuisines: string[];
  services: string[];
  eventTypes: string[];
  rating: number;
  reviewCount: number;
  verified: boolean;
  kvkState: 'verified' | 'pending' | 'unverified';
  kvkNumber: string;
  vatNumber: string;
  responseTime: string;
  minGuests: number;
  maxGuests: number;
  minOrderCents: number;
  languages: string[];
  dietary: string[];
  startingPriceCents: number;
  plan: PlanId;
  email: string;
  phone: string;
  website: string;
  contactPerson: string;
  address: string;
  cover: string;
  photo: string;
};

export type Offering = {
  id: string;
  providerId: string;
  masterItemId: string | null;
  pendingCatalogName: string | null;
  title: string;
  description: string;
  offerType: OfferType;
  cuisine: string;
  category: string;
  priceType: PriceType;
  priceCents: number | null;
  minQuantity: number;
  maxCapacity: number | null;
  leadTimeDays: number;
  fulfillment: Fulfillment[];
  dietary: string[];
  allergens: string[];
  allergensConfirmed: boolean;
  included: string[];
  active: boolean;
  photo: string;
};

export type MasterItem = {
  id: string;
  name: string;
  type: OfferType;
  cuisine: string;
  category: string;
  aliases: string[];
};

export type YesNo = '' | 'yes' | 'no';

/** Customer request answers from the clickable demo wizard. */
export type RequestAnswers = {
  venueKind: '' | 'home' | 'venue';
  venueName: string;
  accessNotes: string;
  occasion: string;
  cuisine: string;
  cuisineStyle: string;
  vegetarian: string;
  base: string;
  chicken: string;
  pork: string;
  beef: string;
  fish: string;
  shrimp: string;
  vegetables: string;
  extraVegetarian: string;
  starters: string;
  desserts: string;
  servingFormat: string;
  staffed: YesNo;
  warming: YesNo;
  tableware: string;
  plates: YesNo;
  cutlery: YesNo;
  glasses: YesNo;
  cateringStart: string;
  cateringEndDate: string;
  cateringEnd: string;
  decoration: YesNo;
  buffetSetup: YesNo;
  serving: YesNo;
  drinksService: YesNo;
  dishwashing: YesNo;
  cleanup: YesNo;
  handoff: '' | 'delivery' | 'pickup';
  handoffTime: string;
  drinks: YesNo;
  drinkDetails: string;
  halal: YesNo;
  forbidden: string;
  vegan: YesNo;
  otherDiet: string;
};

export type QuoteDraft = {
  step: number;
  rawText: string;
  eventType: string;
  date: string;
  startTime: string;
  endTime: string;
  flexibleDate: boolean;
  postcode: string;
  city: string;
  location: string;
  setting: 'indoor' | 'outdoor' | 'both' | '';
  guests: string;
  adults: string;
  children: string;
  needs: string[];
  cuisines: string[];
  dishes: string;
  servingStyle: string;
  dietary: string[];
  allergies: string;
  halal: boolean;
  halalConfirmed: boolean;
  servicePrefs: string[];
  budgetType: 'total' | 'per_person' | 'open';
  budget: string;
  budgetTotal: string;
  notes: string;
  missing: string[];
  understood: boolean;
  answers: RequestAnswers;
};

export type QuoteRequest = {
  id: string;
  status: RequestStatus;
  eventType: string;
  date: string;
  startTime: string;
  endTime: string;
  flexibleDate: boolean;
  postcode: string;
  city: string;
  setting: string;
  guests: number;
  adults?: number;
  children?: number;
  needs: string[];
  cuisines: string[];
  dishes: string;
  servingStyle: string;
  dietary: string[];
  allergies: string;
  halal: boolean;
  servicePrefs: string[];
  budgetType: 'total' | 'per_person' | 'open';
  budgetCents: number | null;
  notes: string;
  summary: string[];
  createdAt: string;
  contactProviderIds: string[];
  invitedCount: number;
  cancelReason?: string;
};

export type Proposal = {
  id: string;
  requestId: string;
  providerId: string;
  leadId?: string;
  availability: Exclude<Availability, 'unavailable'>;
  partialNote: string;
  message: string;
  guests: number;
  items: string[];
  services: string[];
  foodCents: number;
  drinksCents: number;
  staffCents: number;
  deliveryCents: number;
  equipmentCents: number;
  otherCents: number;
  discountCents: number;
  vatNote: string;
  included: string[];
  excluded: string[];
  assumptions: string;
  expiresAt: string;
  details?: Record<string, unknown>;
  status: 'draft' | 'submitted' | 'withdrawn';
  matchScore: number;
  withdrawReason?: string;
};

export type LeadQuality = {
  phoneVerified: boolean;
  completeness: 'High' | 'Medium' | 'Low';
  dateConfirmed: boolean;
  budgetProvided: boolean;
};

export type Lead = {
  id: string;
  status: LeadStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  contactReleased: boolean;
  request: QuoteRequest;
  quality: LeadQuality;
  fulfilledNeeds: string[];
  availabilityNote: string;
  proposalId?: string;
};

export type ChatMessage = { id: string; from: 'customer' | 'provider'; text: string; at: string };

export type Conversation = {
  id: string;
  box: 'customer' | 'provider';
  requestId: string;
  providerId: string;
  title: string;
  subtitle: string;
  messages: ChatMessage[];
};

export type AppNotification = {
  id: string;
  audience: 'customer' | 'provider';
  title: string;
  body: string;
  at: string;
  read: boolean;
  href: string;
};

export type Review = {
  id: string;
  providerId: string;
  requestId?: string;
  author: string;
  overall: number;
  food: number;
  communication: number;
  reliability: number;
  value: number;
  service: number;
  text: string;
  verified: boolean;
  at: string;
  response?: string;
};

export type OutcomeChoice = 'provider' | 'other' | 'no' | 'cancelled' | 'private';

export type Outcome = { requestId: string; choice: OutcomeChoice; providerId?: string };

export type ProposalTemplate = {
  id: string;
  name: string;
  message: string;
  items: string[];
  services: string[];
  included: string[];
  excluded: string[];
  assumptions: string;
  foodPerPersonCents: number;
  drinksPerPersonCents: number;
  staffPerPersonCents: number;
  deliveryCents: number;
};

export type LeadPreferences = {
  radiusKm: number;
  cities: string;
  minGuests: string;
  maxGuests: string;
  minOrder: string;
  minPerPerson: string;
  cuisines: string[];
  services: string[];
  eventTypes: string[];
  weekdays: string[];
  leadTimeDays: string;
  audience: 'any' | 'private' | 'corporate';
  excluded: string;
  timeWindow: string;
};

export type SearchFilters = {
  city: string;
  distanceKm: number | null;
  cuisine: string | null;
  category: string | null;
  eventType: string | null;
  guests: string;
  maxPrice: string;
  dietary: string[];
  fulfillment: Fulfillment[];
  staff: boolean;
  minRating: number | null;
  verifiedOnly: boolean;
  maxMinOrder: string;
};

export type NotifyPrefs = {
  push: boolean;
  email: boolean;
  requests: boolean;
  messages: boolean;
  proposals: boolean;
  reviews: boolean;
};

export type Session = {
  signedIn: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  name: string;
  email: string;
  phone: string;
  photo: string;
  mode: 'customer' | 'provider';
  hasProviderProfile: boolean;
  /** Original successful OTP verification reply, kept with the restored auth session. */
  authResponse?: Record<string, unknown>;
  /** Normalized vendor_profile_complete value from auth/onboarding replies. */
  vendorProfileComplete?: 0 | 1;
  planId: PlanId;
  billing: 'monthly' | 'annual';
  aiUsed: number;
};

export type DayStatus = 'available' | 'limited' | 'unavailable';
