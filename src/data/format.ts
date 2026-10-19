import type { LeadStatus, Proposal, RequestStatus } from '@/data/types';

export const requestLabel: Record<RequestStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  matching: 'Matching',
  receiving: 'Waiting for proposals',
  comparing: 'Comparing',
  contact_released: 'Contact released',
  event_pending: 'Awaiting outcome',
  completed: 'Completed',
  closed: 'Closed',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

export const leadLabel: Record<LeadStatus, string> = {
  invited: 'New request',
  viewed: 'You opened it',
  available: 'You can do it',
  partial: 'Partly free',
  maybe: 'Need to check',
  unavailable: 'Cannot do it',
  proposal_draft: 'Quote not sent yet',
  proposal_submitted: 'Quote sent',
  continued: 'They picked you',
  not_selected: 'They picked someone else',
  expired: 'Too late',
  withdrawn: 'You cancelled it',
};

export function euro(cents: number | null | undefined) {
  if (cents == null) return 'On request';
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export function parseEuro(input: string) {
  const n = Number(input.replace(/\s/g, '').replace(',', '.').replace(/[^\d.]/g, ''));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/Amsterdam',
  }).format(d);
}

export function proposalTotal(p: Pick<Proposal, 'foodCents' | 'drinksCents' | 'staffCents' | 'deliveryCents' | 'equipmentCents' | 'otherCents' | 'discountCents'>) {
  return p.foodCents + p.drinksCents + p.staffCents + p.deliveryCents + p.equipmentCents + p.otherCents - p.discountCents;
}

export function perPersonCents(total: number, guests: number) {
  if (!guests) return null;
  return Math.round(total / guests);
}

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function toggleIn(list: string[], item: string) {
  return list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item];
}

/** Splits "+31 6 1234 5678" or "06 1234 5678" into the country code and number the API expects. */
export function splitPhone(input: string) {
  const digits = input.replace(/[^\d+]/g, '');
  if (digits.startsWith('+31')) return { country_code: '31', phone: digits.slice(3) };
  if (digits.startsWith('+')) return { country_code: digits.slice(1, 3), phone: digits.slice(3) };
  return { country_code: '31', phone: digits.replace(/^0/, '') };
}

export function containsContact(text: string) {
  return /(\+?\d[\d\s\-()]{8,}\d)|([^\s@]+@[^\s@]+\.[^\s@]+)|(https?:\/\/|www\.)/i.test(text);
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
