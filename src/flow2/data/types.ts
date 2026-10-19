export type Lang = 'nl' | 'en';
export type Bilingual = { nl: string; en: string };

export type Plan = 'free' | 'gold' | 'platinum';
export type Availability = 'full' | 'partial' | 'conditional' | 'none';
export type Vegetarian = 'no' | 'full' | 'mixed';
export type YesNo = 'no' | 'yes';

export type RequestStatus = 'draft' | 'submitted' | 'collecting' | 'proposals' | 'contact' | 'closed';
export type ProposalStatus = 'new' | 'interested' | 'contact' | 'rejected' | 'sent';
export type LeadStatus = 'invited' | 'opened' | 'availability' | 'proposal' | 'declined';
export type Fulfilment = 'delivery' | 'pickup' | 'onsite';
export type TaskKey = 'decorate' | 'buffet' | 'serve' | 'bar' | 'wash' | 'clean';

export interface DishCounts {
  base: number;
  chicken: number;
  pork: number;
  beef: number;
  fish: number;
  shrimp: number;
  veg: number;
  extraVeg: number;
  starter: number;
  dessert: number;
}

export interface Provider {
  id: string;
  name: string;
  photo?: string;
  cuisine: Bilingual;
  city: string;
  radiusKm: number;
  fromPrice: number;
  rating: number;
  reviews: number;
  vegetarian: Vegetarian;
  halal: boolean;
  vegan: boolean;
  fulfilment: Fulfilment[];
  capabilities: string[];
  description: Bilingual;
  plan: Plan;
  approved: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  active: boolean;
  imageUri?: string;
}

export interface FlowChatMessage {
  id: string;
  text: string;
  createdAt: number;
  sender: 'customer' | 'vendor';
}

export interface RequestDraft {
  id: string;
  reference: string;
  status: RequestStatus;
  providerId?: string;

  guests: number;
  date: string;
  city: string;
  postcode: string;
  venueType: 'home' | 'venue';
  venueName: string;
  setting: 'indoor' | 'outdoor' | 'both';
  occasion: string;
  access: string;

  cuisine: string;
  cuisineStyle: string;
  vegetarian: Vegetarian;
  counts: DishCounts;
  format: 'buffet' | 'plated' | 'bites';

  staff: YesNo;
  warm: YesNo;
  fulfilment: 'delivery' | 'pickup';
  handoverTime: string;
  ware: 'real' | 'plastic' | 'own';
  plates: YesNo;
  cutlery: YesNo;
  glasses: YesNo;
  start: string;
  endDate: string;
  end: string;
  tasks: Record<TaskKey, YesNo>;

  drinks: YesNo;
  drinkType: 'soft' | 'alcohol' | 'both';
  drinkQuantity: string;
  halal: YesNo;
  allergies: string;
  forbidden: string;
  vegan: YesNo;
  dietNotes: string;
  budget: number;
  comments: string;

  consent: boolean;
  submittedAt?: string;
}

export interface ProposalLine {
  label: Bilingual;
  requested: string;
  offered: string;
  differs: boolean;
}

export interface Proposal {
  id: string;
  requestId: string;
  providerId: string;
  providerName: string;
  availability: Availability;
  matchScore: number;
  total: number;
  perGuest: number;
  deposit: number;
  validUntil: string;
  description: Bilingual;
  notes: Bilingual;
  lines: ProposalLine[];
  status: ProposalStatus;
  contactReleased: boolean;
}

export interface OnboardingDraft {
  name: string;
  email: string;
  phone: string;
  password: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  type: 'private' | 'business';
  profileName: string;
  profileImageUri?: string;
  company: string;
  kvk: string;
  street: string;
  house: string;
  postal: string;
  city: string;
  radius: number;
  delivery: boolean;
  pickup: boolean;
  onsite: boolean;
  minDelivery: number;
  maxDelivery: number;
  minPickup: number;
  maxPickup: number;
  minOnsite: number;
  maxOnsite: number;
  cuisines: string[];
  cuisineStyles: string[];
  capabilities: string[];
  leadDays: number;
  description: string;
  fromPrice: string;
  trialConsent: boolean;
  terms: boolean;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  adminReason: string;
}

export interface Lead {
  id: string;
  providerId: string;
  reference: string;
  request: RequestDraft;
  status: LeadStatus;
  deadlineHours: number;
  quality: number;
  proposal?: Proposal;
}
