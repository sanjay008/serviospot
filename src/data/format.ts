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
  invited: 'New invite',
  viewed: 'Viewed',
  available: 'Available',
  partial: 'Partially available',
  maybe: 'Needs confirmation',
  unavailable: 'Not available',
  proposal_draft: 'Proposal draft',
  proposal_submitted: 'Proposal sent',
  continued: 'Customer continued',
  not_selected: 'Not selected',
  expired: 'Expired',
  withdrawn: 'Withdrawn',
};

export function euro(cents: number | null | undefined) {
  if (cents == null) return 'On request';
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export function parseEuro(input: string) {
  const n = Number(input.replace(/\s/g, '').replace(',', '.').replace(/[^\d.]/g, ''));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('nl-NL', {
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

export function containsContact(text: string) {
  return /(\+?\d[\d\s\-()]{8,}\d)|([^\s@]+@[^\s@]+\.[^\s@]+)|(https?:\/\/|www\.)/i.test(text);
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
