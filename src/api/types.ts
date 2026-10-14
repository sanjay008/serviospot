// Request bodies match the Postman collection. Replies are kept loose until the backend shares sample responses.
export type ApiRecord = Record<string, unknown>;
export type ApiList = ApiRecord[];
export type Id = number | string;

export type Role = 'customer' | 'vendor';
export type PlanName = 'free' | 'gold' | 'platinum';

export type AuthReply = ApiRecord & { token: string };

export type RegisterBody = {
  role: Role;
  full_name: string;
  email: string;
  password: string;
  country_code: string;
  phone: string;
  city?: string;
};

export type LoginBody = { email: string; password: string; role: Role };

export type ProviderFilters = {
  q?: string;
  city?: string;
  guests?: number;
  category?: string;
  cuisine?: string;
  diet?: string;
  price_min?: number;
  price_max?: number;
  lat?: number;
  lng?: number;
};

export type NotificationSettingsBody = {
  push: boolean;
  email: boolean;
  request: boolean;
  message: boolean;
  proposal: boolean;
  review: boolean;
};

export type ReportBody = { target_type: string; target_id: Id; reason: string; details?: string };

export type RequestBody = {
  event_type: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  flexible_date?: boolean;
  city: string;
  postcode?: string;
  location?: string;
  indoor_outdoor?: 'indoor' | 'outdoor' | 'both';
  guest_count: number;
  needs: string[];
  cuisines?: string[];
  dietary?: string[];
  services?: string[];
  budget_total_cents?: number;
  budget_per_person_cents?: number;
  description?: string;
  /** Structured answers from the request wizard. The top-level fields stay filled for the current API. */
  details?: Record<string, unknown>;
};

export type OutcomeBody = { request_id: Id; outcome: string; provider_id?: Id };

export type ReviewBody = {
  request_id: Id;
  provider_id: Id;
  overall: number;
  food: number;
  communication: number;
  reliability: number;
  value: number;
  service: number;
  body: string;
};

export type AvailabilityBody = { lead_id: Id; status: 'available' | 'partial' | 'maybe' | 'unavailable'; note?: string };

export type ProposalBody = {
  lead_id: Id;
  message: string;
  guest_count: number;
  food_cents: number;
  drinks_cents: number;
  staff_cents: number;
  delivery_cents: number;
  equipment_cents: number;
  other_cents: number;
  discount_cents: number;
  included?: string;
  excluded?: string;
  assumptions?: string;
  expires_at?: string;
  details?: Record<string, unknown>;
};

export type OfferingBody = {
  title: string;
  category: string;
  description?: string;
  price_cents: number;
  price_type?: string;
  cuisine?: string;
  diet?: string[];
  photo?: string;
};

/** `logo` and `photo` are data URIs (`data:image/jpeg;base64,…`) for a new image, or '' to remove it. */
export type VendorProfileBody = { name?: string; city?: string; story?: string; logo?: string };

export type VerificationBody = { kvk_number: string; vat_number?: string; legal_name: string };

export type PreferencesBody = { city?: string; min_guests?: number; max_guests?: number; cuisines?: string[]; radius_km?: number };

export type CalendarBody = { date: string; status: 'available' | 'limited' | 'unavailable' };

export type TemplateBody = { name: string; body: ApiRecord };
