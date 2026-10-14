import type { ApiRecord } from '@/api/types';
import { euro } from '@/data/format';
import { ME } from '@/data/mock';
import type {
  AppNotification,
  Category,
  ChatMessage,
  Conversation,
  DayStatus,
  Invoice,
  Lead,
  LeadPreferences,
  NotifyPrefs,
  Offering,
  Plan,
  PlanId,
  Proposal,
  ProposalTemplate,
  Provider,
  QuoteRequest,
  Review,
  Session,
} from '@/data/types';

// The backend has not shared sample replies yet, so every field accepts the common key spellings.

type R = ApiRecord;

const isRecord = (value: unknown): value is R => !!value && typeof value === 'object' && !Array.isArray(value);

/** Finds the list in a reply: the data itself, or the first array inside it (data.items, data.providers, ...). */
export function rowsOf(data: unknown): R[] {
  if (Array.isArray(data)) return data.filter(isRecord);
  if (isRecord(data)) {
    for (const value of Object.values(data)) {
      if (Array.isArray(value) && value.some(isRecord)) return value.filter(isRecord);
    }
  }
  return [];
}

function nested(r: R, ...keys: string[]): R | null {
  for (const key of keys) if (isRecord(r[key])) return r[key] as R;
  return null;
}

/** Finds the object in a reply, unwrapping `{ provider: {...} }` style wrappers when one of `keys` is present. */
export function recordOf(data: unknown, ...keys: string[]): R | null {
  const base = Array.isArray(data) ? data[0] : data;
  if (!isRecord(base)) return null;
  return nested(base, ...keys) ?? base;
}

export function textOf(r: R | null, ...keys: string[]) {
  return r ? str(r, ...keys) : undefined;
}

function str(r: R, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = r[key];
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
  }
  return undefined;
}

function num(r: R, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = r[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  }
  return undefined;
}

function bool(r: R, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = r[key];
    if (typeof value === 'boolean') return value;
    if (value === 1 || value === '1' || value === 'true' || value === 'yes') return true;
    if (value === 0 || value === '0' || value === 'false' || value === 'no') return false;
  }
  return undefined;
}

function list(r: R, ...keys: string[]): string[] | undefined {
  for (const key of keys) {
    const value = r[key];
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === 'string' ? item : isRecord(item) ? (str(item, 'name', 'title', 'label', 'value') ?? '') : String(item)))
        .filter(Boolean);
    }
    if (typeof value === 'string' && value.trim()) {
      try {
        const parsed: unknown = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {
        // Plain comma separated text.
      }
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  return undefined;
}

/** Reads a price that may come as cents (`price_cents`) or euros (`price`). */
function cents(r: R, centKeys: string[], euroKeys: string[]): number | undefined {
  const exact = num(r, ...centKeys);
  if (exact !== undefined) return Math.round(exact);
  const euros = num(r, ...euroKeys);
  return euros === undefined ? undefined : Math.round(euros * 100);
}

function id(r: R, ...keys: string[]) {
  return str(r, ...keys, 'id') ?? '';
}

function oneOf<T extends string>(value: string | undefined, options: readonly T[], fallback: T): T {
  const clean = value?.toLowerCase().replace(/[\s-]+/g, '_');
  return options.find((option) => option === clean) ?? fallback;
}

const PLAN_IDS = ['free', 'gold', 'platinum'] as const;

export function planOf(value: string | undefined): PlanId | undefined {
  if (!value) return undefined;
  return oneOf(value, PLAN_IDS, 'free');
}

export function toCategory(r: R): Category {
  const code = str(r, 'code', 'slug', 'id') ?? '';
  return { code, name: str(r, 'name', 'title', 'label') ?? code };
}

export function toInvoice(r: R): Invoice {
  const invoiceId = id(r, 'id', 'invoice_id');
  return {
    id: invoiceId,
    number: str(r, 'number', 'invoice_number', 'reference') ?? invoiceId,
    amountCents: cents(r, ['amount_cents', 'total_cents'], ['amount', 'total']) ?? 0,
    status: str(r, 'status', 'state') ?? '',
    date: str(r, 'date', 'invoice_date', 'created_at') ?? '',
  };
}

/** Reads a plan code from a getPlans row. Unknown codes are skipped. */
export function planCodeOf(r: R): PlanId | undefined {
  const code = str(r, 'code', 'id', 'name')?.toLowerCase();
  return PLAN_IDS.find((item) => item === code);
}

export function toPlan(r: R, fallback: Plan): Plan {
  const monthly = cents(r, ['price_cents', 'monthly_cents'], ['price']) ?? fallback.monthlyCents;
  const leads = bool(r, 'leads_enabled');
  const templates = bool(r, 'templates_enabled');
  const analytics = bool(r, 'analytics_enabled');
  const base = fallback.entitlements;
  return {
    ...fallback,
    name: str(r, 'name') ?? fallback.name,
    monthlyCents: monthly,
    annualCents: monthly * 12,
    range: monthly === 0 ? '€0 / month' : `${euro(monthly)} / month`,
    summary: str(r, 'summary', 'description') ?? '',
    includes: list(r, 'features') ?? fallback.includes,
    entitlements: {
      ...base,
      maxOfferings: num(r, 'max_offerings') ?? base.maxOfferings,
      quoteLeads: leads ?? base.quoteLeads,
      advancedLeadFilters: leads ?? base.advancedLeadFilters,
      contactVisible: bool(r, 'public_contact') ?? base.contactVisible,
      calendar: bool(r, 'calendar_enabled') ?? base.calendar,
      templateLimit: templates === undefined ? base.templateLimit : templates ? base.templateLimit || 15 : 0,
      analytics: analytics === undefined ? base.analytics : analytics ? (base.analytics === 'none' ? 'basic' : base.analytics) : 'none',
    },
  };
}

export function toProvider(r: R, forcedId?: string): Provider {
  const kvk = str(r, 'kvk_state', 'kvk_status', 'verification_status');
  return {
    id: forcedId ?? id(r, 'provider_id', 'vendor_id'),
    name: str(r, 'name', 'business_name', 'company_name', 'full_name') ?? '',
    legalName: str(r, 'legal_name', 'company_name') ?? '',
    type: str(r, 'type', 'business_type') ?? '',
    city: str(r, 'city') ?? '',
    postcode: str(r, 'postcode', 'zip') ?? '',
    province: str(r, 'province', 'state') ?? '',
    radiusKm: num(r, 'radius_km', 'radius') ?? 0,
    distanceKm: num(r, 'distance_km', 'distance') ?? 0,
    intro: str(r, 'intro', 'tagline', 'short_description') ?? '',
    description: str(r, 'description', 'story', 'about') ?? '',
    cuisines: list(r, 'cuisines', 'cuisine') ?? [],
    services: list(r, 'services', 'categories') ?? [],
    eventTypes: list(r, 'event_types', 'events') ?? [],
    rating: num(r, 'rating', 'avg_rating', 'average_rating') ?? 0,
    reviewCount: num(r, 'review_count', 'reviews_count', 'total_reviews') ?? 0,
    verified: bool(r, 'verified', 'is_verified') ?? false,
    kvkState: oneOf(kvk, ['verified', 'pending', 'unverified'] as const, 'unverified'),
    kvkNumber: str(r, 'kvk_number', 'kvk') ?? '',
    vatNumber: str(r, 'vat_number', 'vat') ?? '',
    responseTime: str(r, 'response_time') ?? '',
    minGuests: num(r, 'min_guests') ?? 0,
    maxGuests: num(r, 'max_guests') ?? 0,
    minOrderCents: cents(r, ['min_order_cents'], ['min_order']) ?? 0,
    languages: list(r, 'languages') ?? [],
    dietary: list(r, 'dietary', 'diet') ?? [],
    startingPriceCents: cents(r, ['starting_price_cents', 'price_cents'], ['starting_price', 'price']) ?? 0,
    plan: planOf(str(r, 'plan', 'plan_name', 'subscription')) ?? 'free',
    email: str(r, 'email') ?? '',
    phone: str(r, 'phone', 'mobile') ?? '',
    website: str(r, 'website', 'url') ?? '',
    contactPerson: str(r, 'contact_person', 'owner_name', 'full_name') ?? '',
    address: str(r, 'address') ?? '',
    cover: str(r, 'cover_color') ?? '#7C5CFF',
    photo: str(r, 'photo', 'image', 'logo', 'cover_image', 'image_url') ?? '',
  };
}

export function toOffering(r: R, providerId?: string): Offering {
  return {
    id: id(r, 'offering_id'),
    providerId: providerId ?? str(r, 'provider_id', 'vendor_id') ?? ME,
    masterItemId: str(r, 'master_item_id', 'catalog_id') ?? null,
    pendingCatalogName: null,
    title: str(r, 'title', 'name') ?? '',
    description: str(r, 'description') ?? '',
    offerType: oneOf(str(r, 'offer_type', 'type'), ['dish', 'menu', 'service', 'beverage', 'concept', 'rental'] as const, 'dish'),
    cuisine: str(r, 'cuisine') ?? '',
    category: str(r, 'category', 'category_name') ?? '',
    priceType: oneOf(str(r, 'price_type'), ['per_person', 'per_item', 'per_tray', 'per_hour', 'per_day', 'fixed', 'package', 'on_request'] as const, 'per_person'),
    priceCents: cents(r, ['price_cents'], ['price']) ?? null,
    minQuantity: num(r, 'min_quantity', 'min_qty') ?? 1,
    maxCapacity: num(r, 'max_capacity') ?? null,
    leadTimeDays: num(r, 'lead_time_days') ?? 0,
    fulfillment: (list(r, 'fulfillment') ?? []).filter((item): item is Offering['fulfillment'][number] => ['delivery', 'pickup', 'on_site'].includes(item)),
    dietary: list(r, 'diet', 'dietary') ?? [],
    allergens: list(r, 'allergens') ?? [],
    allergensConfirmed: bool(r, 'allergens_confirmed') ?? true,
    included: list(r, 'included') ?? [],
    active: bool(r, 'active', 'is_active', 'status') ?? true,
    photo: str(r, 'photo', 'image', 'image_url') ?? '',
  };
}

const REQUEST_STATUSES = ['draft', 'submitted', 'matching', 'receiving', 'comparing', 'contact_released', 'event_pending', 'completed', 'closed', 'cancelled', 'expired'] as const;

function summaryOf(r: R): string[] {
  const lines = [
    ['Venue', str(r, 'venue_name', 'venueName')],
    ['Occasion', str(r, 'occasion')],
    ['Cuisine', [str(r, 'cuisine'), str(r, 'cuisine_style', 'cuisineStyle')].filter(Boolean).join(' · ')],
    ['Vegetarian', str(r, 'vegetarian')],
    ['Serving', str(r, 'serving_format', 'servingFormat')],
    ['Staff', str(r, 'staffed')],
    ['Warming trays', str(r, 'warming')],
    ['Tableware', str(r, 'tableware')],
    ['Drinks', str(r, 'drinks')],
    ['Forbidden', str(r, 'forbidden')],
    ['Other diet', str(r, 'other_diet', 'otherDiet')],
    ['Base dishes', str(r, 'base_dishes')],
    ['Chicken', str(r, 'chicken_dishes')],
    ['Pork', str(r, 'pork_dishes')],
    ['Beef', str(r, 'beef_dishes')],
    ['Fish', str(r, 'fish_dishes')],
    ['Shrimp', str(r, 'shrimp_dishes')],
    ['Vegetables', str(r, 'vegetable_dishes')],
    ['Extra vegetarian', str(r, 'extra_vegetarian_dishes')],
    ['Starters', str(r, 'starters')],
    ['Desserts', str(r, 'desserts')],
    ['Plates', str(r, 'plates')],
    ['Cutlery', str(r, 'cutlery')],
    ['Glasses', str(r, 'glasses')],
    ['Handoff', str(r, 'handoff')],
    ['Handoff time', str(r, 'handoff_time')],
    ['Vegan', str(r, 'vegan')],
  ];
  return lines.flatMap(([label, value]) => (value ? [`${label}: ${value}`] : []));
}

export function toRequest(r: R): QuoteRequest {
  const perPerson = cents(r, ['budget_per_person_cents'], ['budget_per_person']);
  const total = cents(r, ['budget_total_cents'], ['budget_total', 'budget']);
  return {
    id: id(r, 'request_id'),
    status: oneOf(str(r, 'status'), REQUEST_STATUSES, 'submitted'),
    eventType: str(r, 'event_type', 'event') ?? '',
    date: str(r, 'event_date', 'date') ?? '',
    startTime: str(r, 'start_time') ?? '',
    endTime: str(r, 'end_time') ?? '',
    flexibleDate: bool(r, 'flexible_date') ?? false,
    postcode: str(r, 'postcode') ?? '',
    city: str(r, 'city', 'location') ?? '',
    setting: str(r, 'indoor_outdoor', 'setting') ?? '',
    guests: num(r, 'guest_count', 'guests') ?? 0,
    needs: list(r, 'needs') ?? [],
    cuisines: list(r, 'cuisines') ?? [],
    dishes: str(r, 'dishes') ?? '',
    servingStyle: str(r, 'serving_style') ?? '',
    dietary: list(r, 'dietary') ?? [],
    allergies: str(r, 'allergies') ?? '',
    halal: bool(r, 'halal') ?? false,
    servicePrefs: list(r, 'services', 'service_prefs') ?? [],
    budgetType: perPerson !== undefined ? 'per_person' : total !== undefined ? 'total' : 'open',
    budgetCents: perPerson ?? total ?? null,
    notes: str(r, 'description', 'notes') ?? '',
    summary: summaryOf(nested(r, 'details') ?? r),
    createdAt: str(r, 'created_at') ?? '',
    contactProviderIds: list(r, 'contact_provider_ids', 'released_provider_ids') ?? [],
    invitedCount: num(r, 'invited_count', 'invited') ?? 0,
  };
}

export function toProposal(r: R, requestId?: string): Proposal {
  return {
    id: id(r, 'proposal_id'),
    requestId: requestId ?? str(r, 'request_id') ?? '',
    providerId: str(r, 'provider_id', 'vendor_id') ?? '',
    leadId: str(r, 'lead_id'),
    availability: oneOf(str(r, 'availability'), ['available', 'partial', 'maybe'] as const, 'available'),
    partialNote: str(r, 'partial_note') ?? '',
    message: str(r, 'message') ?? '',
    guests: num(r, 'guest_count', 'guests') ?? 0,
    items: list(r, 'items') ?? [],
    services: list(r, 'services') ?? [],
    foodCents: cents(r, ['food_cents'], ['food']) ?? 0,
    drinksCents: cents(r, ['drinks_cents'], ['drinks']) ?? 0,
    staffCents: cents(r, ['staff_cents'], ['staff']) ?? 0,
    deliveryCents: cents(r, ['delivery_cents'], ['delivery']) ?? 0,
    equipmentCents: cents(r, ['equipment_cents'], ['equipment']) ?? 0,
    otherCents: cents(r, ['other_cents'], ['other']) ?? 0,
    discountCents: cents(r, ['discount_cents'], ['discount']) ?? 0,
    vatNote: str(r, 'vat_note') ?? '',
    included: list(r, 'included') ?? [],
    excluded: list(r, 'excluded') ?? [],
    assumptions: str(r, 'assumptions') ?? '',
    expiresAt: str(r, 'expires_at') ?? '',
    status: oneOf(str(r, 'status'), ['draft', 'submitted', 'withdrawn'] as const, 'submitted'),
    matchScore: num(r, 'match_score') ?? 0,
  };
}

const LEAD_STATUSES = ['invited', 'viewed', 'available', 'partial', 'maybe', 'unavailable', 'proposal_draft', 'proposal_submitted', 'continued', 'not_selected', 'expired', 'withdrawn'] as const;

export function toLead(r: R): Lead {
  const request = nested(r, 'request', 'quote_request') ?? r;
  const customer = nested(r, 'customer', 'user') ?? r;
  const completeness = str(r, 'completeness')?.toLowerCase();
  return {
    id: id(r, 'lead_id'),
    status: oneOf(str(r, 'lead_status', 'status'), LEAD_STATUSES, 'invited'),
    customerName: str(customer, 'customer_name', 'full_name', 'name') ?? '',
    customerPhone: str(customer, 'customer_phone', 'phone') ?? '',
    customerEmail: str(customer, 'customer_email', 'email') ?? '',
    contactReleased: bool(r, 'contact_released') ?? false,
    request: toRequest(request),
    quality: {
      phoneVerified: bool(r, 'phone_verified') ?? false,
      completeness: completeness === 'high' ? 'High' : completeness === 'medium' ? 'Medium' : 'Low',
      dateConfirmed: bool(r, 'date_confirmed') ?? false,
      budgetProvided: bool(r, 'budget_provided') ?? false,
    },
    fulfilledNeeds: list(r, 'fulfilled_needs') ?? [],
    availabilityNote: str(r, 'availability_note', 'note') ?? '',
    proposalId: str(r, 'proposal_id'),
  };
}

export function toMessage(r: R, box: 'customer' | 'provider'): ChatMessage {
  const mine = bool(r, 'is_mine', 'mine');
  const sender = str(r, 'from', 'sender', 'sender_role', 'role');
  const from = sender === 'vendor' || sender === 'provider' ? 'provider' : sender === 'customer' ? 'customer' : mine === undefined ? 'customer' : mine === (box === 'provider') ? 'provider' : 'customer';
  return {
    id: id(r, 'message_id'),
    from,
    text: str(r, 'message', 'text', 'body') ?? '',
    at: str(r, 'created_at', 'at', 'sent_at') ?? '',
  };
}

export function toConversation(r: R, box: 'customer' | 'provider'): Conversation {
  return {
    id: id(r, 'conversation_id'),
    box,
    requestId: str(r, 'request_id') ?? '',
    providerId: str(r, 'provider_id', 'vendor_id') ?? '',
    title: str(r, 'title', 'name', 'other_name') ?? '',
    subtitle: str(r, 'subtitle', 'last_message') ?? '',
    messages: rowsOf(r.messages).map((item) => toMessage(item, box)),
  };
}

export function toNotification(r: R, audience: 'customer' | 'provider'): AppNotification {
  return {
    id: id(r, 'notification_id'),
    audience,
    title: str(r, 'title') ?? '',
    body: str(r, 'body', 'message') ?? '',
    at: str(r, 'created_at', 'at') ?? '',
    read: bool(r, 'read', 'is_read') ?? false,
    href: str(r, 'href', 'url', 'link') ?? (audience === 'provider' ? '/business/leads' : '/customer/requests'),
  };
}

export function toReview(r: R, providerId?: string): Review {
  return {
    id: id(r, 'review_id'),
    providerId: providerId ?? str(r, 'provider_id', 'vendor_id') ?? ME,
    requestId: str(r, 'request_id'),
    author: str(r, 'author', 'customer_name', 'name') ?? '',
    overall: num(r, 'overall', 'rating') ?? 0,
    food: num(r, 'food') ?? 0,
    communication: num(r, 'communication') ?? 0,
    reliability: num(r, 'reliability') ?? 0,
    value: num(r, 'value') ?? 0,
    service: num(r, 'service') ?? 0,
    text: str(r, 'body', 'text', 'review') ?? '',
    verified: bool(r, 'verified') ?? true,
    at: str(r, 'created_at', 'at') ?? '',
    response: str(r, 'response', 'reply'),
  };
}

export function toTemplate(r: R): ProposalTemplate {
  const body = nested(r, 'body') ?? r;
  return {
    id: id(r, 'template_id'),
    name: str(r, 'name', 'title') ?? '',
    message: str(body, 'message') ?? '',
    items: list(body, 'items') ?? [],
    services: list(body, 'services') ?? [],
    included: list(body, 'included') ?? [],
    excluded: list(body, 'excluded') ?? [],
    assumptions: str(body, 'assumptions') ?? '',
    foodPerPersonCents: num(body, 'foodPerPersonCents', 'food_per_person_cents') ?? 0,
    drinksPerPersonCents: num(body, 'drinksPerPersonCents', 'drinks_per_person_cents') ?? 0,
    staffPerPersonCents: num(body, 'staffPerPersonCents', 'staff_per_person_cents') ?? 0,
    deliveryCents: num(body, 'deliveryCents', 'delivery_cents') ?? 0,
  };
}

export function toPreferences(r: R, current: LeadPreferences): LeadPreferences {
  const minGuests = num(r, 'min_guests');
  const maxGuests = num(r, 'max_guests');
  return {
    ...current,
    radiusKm: num(r, 'radius_km') ?? current.radiusKm,
    cities: str(r, 'city', 'cities') ?? current.cities,
    minGuests: minGuests === undefined ? current.minGuests : String(minGuests),
    maxGuests: maxGuests === undefined ? current.maxGuests : String(maxGuests),
    cuisines: list(r, 'cuisines') ?? current.cuisines,
  };
}

export function toNotify(r: R, current: NotifyPrefs): NotifyPrefs {
  return {
    push: bool(r, 'push') ?? current.push,
    email: bool(r, 'email') ?? current.email,
    requests: bool(r, 'request', 'requests') ?? current.requests,
    messages: bool(r, 'message', 'messages') ?? current.messages,
    proposals: bool(r, 'proposal', 'proposals') ?? current.proposals,
    reviews: bool(r, 'review', 'reviews') ?? current.reviews,
  };
}

export function toDays(rows: R[]): Record<string, DayStatus> {
  const days: Record<string, DayStatus> = {};
  for (const row of rows) {
    const date = str(row, 'date');
    if (date) days[date] = oneOf(str(row, 'status'), ['available', 'limited', 'unavailable'] as const, 'available');
  }
  return days;
}

export function toViews(r: R) {
  return {
    profile: num(r, 'profile_views', 'profile'),
    offerings: num(r, 'offering_views', 'offerings'),
    search: num(r, 'search_appearances', 'search'),
    responseHours: num(r, 'response_hours', 'avg_response_hours'),
  };
}

export function toSessionPatch(r: R): Partial<Session> {
  const user = nested(r, 'user', 'profile') ?? r;
  const patch: Partial<Session> = {};
  const name = str(user, 'full_name', 'name');
  const email = str(user, 'email');
  const phone = str(user, 'phone');
  const photo = str(user, 'photo', 'avatar', 'profile_image', 'profile_photo', 'image');
  const emailVerified = bool(user, 'email_verified', 'is_email_verified');
  const phoneVerified = bool(user, 'phone_verified', 'is_phone_verified');
  const plan = planOf(str(user, 'plan', 'plan_name'));
  if (name) patch.name = name;
  if (email) patch.email = email;
  if (phone) patch.phone = phone;
  if (photo !== undefined) patch.photo = photo;
  if (emailVerified !== undefined) patch.emailVerified = emailVerified;
  if (phoneVerified !== undefined) patch.phoneVerified = phoneVerified;
  if (plan) patch.planId = plan;
  return patch;
}

export type FavoriteLists = {
  providers: string[];
  offerings: string[];
  /** Favorite row id, keyed by `providers:1` or `offerings:1`, for deleteFavorite. */
  rowIds: Record<string, string>;
};

/** The list row's own id is the favorite. The caterer or dish id sits on the nested object. */
export function toFavoriteIds(rows: R[]): FavoriteLists {
  const providers: string[] = [];
  const offerings: string[] = [];
  const rowIds: Record<string, string> = {};
  for (const row of rows) {
    const type = str(row, 'type', 'favorite_type');
    const favoriteId = str(row, 'favorite_id', 'id');
    const offering = nested(row, 'offering', 'dish');
    const provider = nested(row, 'provider');
    const offeringId = (offering ? str(offering, 'id') : undefined) ?? str(row, 'offering_id', 'target_id', 'item_id');
    const providerId = (provider ? str(provider, 'id') : undefined) ?? str(row, 'provider_id');
    if (type === 'offering' || (offeringId && type !== 'provider')) {
      if (!offeringId) continue;
      offerings.push(offeringId);
      if (favoriteId) rowIds[`offerings:${offeringId}`] = favoriteId;
    } else if (providerId) {
      providers.push(providerId);
      if (favoriteId) rowIds[`providers:${providerId}`] = favoriteId;
    }
  }
  return { providers, offerings, rowIds };
}

export function favoriteCards(rows: R[]) {
  const offerings: Offering[] = [];
  const providers: Provider[] = [];
  for (const row of rows) {
    const offering = nested(row, 'offering', 'dish');
    if (offering && str(offering, 'id')) offerings.push(toOffering(offering));
    const provider = nested(row, 'provider');
    if (provider && str(provider, 'id', 'provider_id')) providers.push(toProvider(provider));
  }
  return { offerings, providers };
}
