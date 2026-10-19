import { skipToken } from '@reduxjs/toolkit/query/react';
import { useEffect, useEffectEvent, useMemo, useState } from 'react';

import {
  useGetAnalyticsQuery,
  useGetCalendarQuery,
  useGetCategoriesQuery,
  useGetConversationsQuery,
  useGetFavoritesQuery,
  useGetInvoicesQuery,
  useGetLeadQuery,
  useGetLeadsQuery,
  useGetLegalQuery,
  useGetMeQuery,
  useGetMessagesQuery,
  useGetNotificationSettingsQuery,
  useGetNotificationsQuery,
  useGetOfferingQuery,
  useGetPlansQuery,
  useGetPreferencesQuery,
  useGetProposalQuery,
  useGetProposalsQuery,
  useGetProviderDetailsQuery,
  useGetProviderOfferingsQuery,
  useGetProviderReviewsQuery,
  useGetProvidersQuery,
  useGetReleasedContactsQuery,
  useGetRequestDetailsQuery,
  useGetRequestsQuery,
  useGetSubscriptionQuery,
  useGetTemplatesQuery,
  useGetUnreadCountQuery,
  useGetVendorDashboardQuery,
  useGetVendorOfferingsQuery,
  useGetVendorProfileQuery,
  useGetVendorReviewsQuery,
  useSearchProvidersQuery,
} from '@/api';
import {
  planCodeOf,
  planOf,
  recordOf,
  rowsOf,
  textOf,
  toCategory,
  toConversation,
  toDays,
  favoriteCards,
  toFavoriteIds,
  toInvoice,
  toLead,
  toMessage,
  toNotification,
  toNotify,
  toOffering,
  toPlan,
  toPreferences,
  toProposal,
  toProvider,
  toRequest,
  toReview,
  toSessionPatch,
  toTemplate,
  toViews,
} from '@/api/mappers';
import { parseEuro } from '@/data/format';
import { ME, planBase } from '@/data/mock';
import type { SearchFilters } from '@/data/types';
import { useApp } from '@/state/store';

// Each screen calls its hook once. The query runs when the screen opens, and a reply with data
// replaces the matching rows in the store. Every call and reply shows in the API log.

const hasId = <T extends { id: string }>(item: T) => item.id !== '';

function useOnData(data: unknown, apply: (data: unknown) => void) {
  const onData = useEffectEvent(apply);
  useEffect(() => {
    if (data !== undefined) onData(data);
  }, [data]);
}

function useSignedIn() {
  return useApp().session.signedIn;
}

/* Shared */

export function useMeSync() {
  const { hydrate } = useApp();
  const signedIn = useSignedIn();
  const me = useGetMeQuery(undefined, { skip: !signedIn });
  useOnData(me.data, (data) => {
    const record = recordOf(data, 'user');
    if (record) hydrate({ session: toSessionPatch(record) });
  });
}

export function useNotificationsSync(audience: 'customer' | 'provider') {
  const { fill } = useApp();
  const signedIn = useSignedIn();
  const list = useGetNotificationsQuery(undefined, { skip: !signedIn });
  useGetUnreadCountQuery(undefined, { skip: !signedIn });
  useOnData(list.data, (data) =>
    fill('notifications', rowsOf(data).map((row) => toNotification(row, audience)).filter(hasId), (item) => item.audience === audience),
  );
}

export function useNotifySettingsSync() {
  const { hydrate, notify } = useApp();
  const signedIn = useSignedIn();
  const settings = useGetNotificationSettingsQuery(undefined, { skip: !signedIn });
  useOnData(settings.data, (data) => {
    const record = recordOf(data, 'settings');
    if (record) hydrate({ notify: toNotify(record, notify) });
  });
}

export function useConversationsSync(box: 'customer' | 'provider') {
  const { fill } = useApp();
  const signedIn = useSignedIn();
  const list = useGetConversationsQuery(undefined, { skip: !signedIn });
  useOnData(list.data, (data) =>
    fill('conversations', rowsOf(data).map((row) => toConversation(row, box)).filter(hasId), (item) => item.box === box),
  );
}

export function useMessagesSync(conversationId: string | undefined, box: 'customer' | 'provider') {
  const { setMessages } = useApp();
  const signedIn = useSignedIn();
  const messages = useGetMessagesQuery(signedIn && conversationId ? conversationId : skipToken);
  useOnData(messages.data, (data) => {
    if (conversationId) setMessages(conversationId, rowsOf(data).map((row) => toMessage(row, box)).filter(hasId));
  });
  // Chat socket room joining is temporarily disabled while investigating APK crashes.
}

export function useLegalText(doc: 'terms' | 'privacy') {
  const legal = useGetLegalQuery(doc);
  return textOf(recordOf(legal.data), 'content', 'body', 'text', 'html');
}

export function usePlansSync() {
  const { hydrate } = useApp();
  const plans = useGetPlansQuery();
  useOnData(plans.data, (data) => {
    const next = rowsOf(data).flatMap((row) => {
      const code = planCodeOf(row);
      return code ? [toPlan(row, planBase(code))] : [];
    });
    hydrate({ plans: next });
  });
  return plans.isLoading;
}

/** Loads the service categories once; every screen with category chips calls this. Returns true while loading. */
export function useCategoriesSync() {
  const { hydrate } = useApp();
  const categories = useGetCategoriesQuery();
  useOnData(categories.data, (data) => hydrate({ categories: rowsOf(data).map(toCategory).filter((item) => item.code !== '') }));
  return categories.isLoading;
}

/* Customer */

export function useCustomerHomeSync() {
  const { fill } = useApp();
  const providers = useGetProvidersQuery();
  const categoriesLoading = useCategoriesSync();
  useOnData(providers.data, (data) => fill('providers', rowsOf(data).map((row) => toProvider(row)).filter(hasId)));
  return providers.isLoading || categoriesLoading;
}

export function useSearchSync(query: string, filters: SearchFilters) {
  const { fill } = useApp();
  const [body, setBody] = useState({ q: query, filters });
  useEffect(() => {
    const timer = setTimeout(() => setBody({ q: query, filters }), 500);
    return () => clearTimeout(timer);
  }, [query, filters]);
  const search = useSearchProvidersQuery({
    q: body.q.trim() || undefined,
    city: body.filters.city || undefined,
    guests: Number(body.filters.guests) || undefined,
    category: body.filters.category ?? undefined,
    cuisine: body.filters.cuisine ?? undefined,
    diet: body.filters.dietary[0],
    price_max: body.filters.maxPrice ? parseEuro(body.filters.maxPrice) : undefined,
  });
  useOnData(search.data, (data) => fill('providers', rowsOf(data).map((row) => toProvider(row)).filter(hasId), () => false));
}

export function useProviderSync(providerId: string | undefined) {
  const { fill } = useApp();
  const id = providerId && providerId !== ME ? providerId : skipToken;
  const details = useGetProviderDetailsQuery(id);
  const offerings = useGetProviderOfferingsQuery(id);
  const reviews = useGetProviderReviewsQuery(id);
  useOnData(details.data, (data) => {
    const record = recordOf(data, 'provider', 'vendor');
    if (record && providerId) fill('providers', [toProvider(record, providerId)], () => false);
  });
  useOnData(offerings.data, (data) => {
    if (providerId) fill('offerings', rowsOf(data).map((row) => toOffering(row, providerId)).filter(hasId), (item) => item.providerId === providerId);
  });
  useOnData(reviews.data, (data) => {
    if (providerId) fill('reviews', rowsOf(data).map((row) => toReview(row, providerId)).filter(hasId), (item) => item.providerId === providerId);
  });
}

export function useOfferingSync(offeringId: string | undefined) {
  const { fill, offerings } = useApp();
  const offering = useGetOfferingQuery(offeringId ?? skipToken);
  useOnData(offering.data, (data) => {
    const record = recordOf(data, 'offering');
    if (!record || !offeringId) return;
    const known = offerings.find((item) => item.id === offeringId);
    fill('offerings', [{ ...toOffering(record, known?.providerId), id: offeringId }], () => false);
  });
}

export function useFavoritesSync() {
  const { hydrate, fill } = useApp();
  const signedIn = useSignedIn();
  const favorites = useGetFavoritesQuery(undefined, { skip: !signedIn });
  useOnData(favorites.data, (data) => {
    const rows = rowsOf(data);
    hydrate({ favorites: toFavoriteIds(rows) });
    const cards = favoriteCards(rows);
    if (cards.offerings.length) fill('offerings', cards.offerings);
    if (cards.providers.length) fill('providers', cards.providers);
  });
}

export function useRequestsSync() {
  const { fill } = useApp();
  const signedIn = useSignedIn();
  const requests = useGetRequestsQuery(undefined, { skip: !signedIn });
  useOnData(requests.data, (data) => fill('requests', rowsOf(data).map(toRequest).filter(hasId)));
}

export function useRequestSync(requestId: string | undefined) {
  const { fill } = useApp();
  const signedIn = useSignedIn();
  const id = signedIn && requestId ? requestId : skipToken;
  const details = useGetRequestDetailsQuery(id);
  const proposals = useGetProposalsQuery(id);
  useOnData(details.data, (data) => {
    const record = recordOf(data, 'request');
    if (record && requestId) fill('requests', [{ ...toRequest(record), id: requestId }], () => false);
  });
  useOnData(proposals.data, (data) => {
    if (requestId) fill('proposals', rowsOf(data).map((row) => toProposal(row, requestId)).filter(hasId), (item) => item.requestId === requestId);
  });
}

export function useProposalSync(proposalId: string | undefined) {
  const { fill, proposals } = useApp();
  const signedIn = useSignedIn();
  const proposal = useGetProposalQuery(signedIn && proposalId ? proposalId : skipToken);
  useOnData(proposal.data, (data) => {
    const record = recordOf(data, 'proposal');
    if (!record || !proposalId) return;
    const known = proposals.find((item) => item.id === proposalId);
    fill('proposals', [{ ...toProposal(record, known?.requestId), id: proposalId }], () => false);
  });
}

export function useContactsSync(requestId: string | undefined) {
  const { fill, providers } = useApp();
  const signedIn = useSignedIn();
  const contacts = useGetReleasedContactsQuery(signedIn && requestId ? requestId : skipToken);
  useOnData(contacts.data, (data) => {
    const updated = rowsOf(data)
      .map((row) => toProvider(row))
      .filter(hasId)
      .map((contact) => {
        const known = providers.find((item) => item.id === contact.id);
        return known ? { ...known, email: contact.email || known.email, phone: contact.phone || known.phone, contactPerson: contact.contactPerson || known.contactPerson } : contact;
      });
    fill('providers', updated, () => false);
  });
}

/* Vendor */

export function useVendorProfileSync() {
  const { fill, me } = useApp();
  const signedIn = useSignedIn();
  const profile = useGetVendorProfileQuery(undefined, { skip: !signedIn });
  useOnData(profile.data, (data) => {
    const record = recordOf(data, 'vendor', 'provider', 'profile');
    if (record) fill('providers', [{ ...toProvider(record, ME), plan: planOf(textOf(record, 'plan', 'plan_name')) ?? me.plan }], () => false);
  });
}

export function useLeadsSync() {
  const { fill } = useApp();
  const signedIn = useSignedIn();
  const leads = useGetLeadsQuery(undefined, { skip: !signedIn });
  useOnData(leads.data, (data) => fill('leads', rowsOf(data).map(toLead).filter(hasId)));
}

export function useLeadSync(leadId: string | undefined) {
  const { fill } = useApp();
  const signedIn = useSignedIn();
  const lead = useGetLeadQuery(signedIn && leadId ? leadId : skipToken);
  useOnData(lead.data, (data) => {
    const record = recordOf(data, 'lead');
    if (record && leadId) fill('leads', [{ ...toLead(record), id: leadId }], () => false);
  });
}

export function useVendorOfferingsSync() {
  const { fill } = useApp();
  const signedIn = useSignedIn();
  const offerings = useGetVendorOfferingsQuery(undefined, { skip: !signedIn });
  useOnData(offerings.data, (data) =>
    fill('offerings', rowsOf(data).map((row) => toOffering(row, ME)).filter(hasId), (item) => item.providerId === ME),
  );
}

export function useVendorHomeSync() {
  const { hydrate } = useApp();
  const signedIn = useSignedIn();
  const dashboard = useGetVendorDashboardQuery(undefined, { skip: !signedIn });
  usePlansSync();
  useVendorProfileSync();
  useLeadsSync();
  useVendorOfferingsSync();
  useOnData(dashboard.data, (data) => {
    const record = recordOf(data);
    if (record) hydrate({ profileViews: toViews(record) });
  });
}

export function useTemplatesSync() {
  const { fill } = useApp();
  const signedIn = useSignedIn();
  const templates = useGetTemplatesQuery(undefined, { skip: !signedIn });
  useOnData(templates.data, (data) => fill('templates', rowsOf(data).map(toTemplate).filter(hasId)));
}

export function usePreferencesSync() {
  const { hydrate, preferences } = useApp();
  const signedIn = useSignedIn();
  const prefs = useGetPreferencesQuery(undefined, { skip: !signedIn });
  useOnData(prefs.data, (data) => {
    const record = recordOf(data, 'preferences');
    if (record) hydrate({ preferences: toPreferences(record, preferences) });
  });
}

export function useCalendarSync() {
  const { hydrate } = useApp();
  const signedIn = useSignedIn();
  const calendar = useGetCalendarQuery(undefined, { skip: !signedIn });
  useOnData(calendar.data, (data) => hydrate({ days: toDays(rowsOf(data)) }));
}

export function useVendorReviewsSync() {
  const { fill } = useApp();
  const signedIn = useSignedIn();
  const reviews = useGetVendorReviewsQuery(undefined, { skip: !signedIn });
  useOnData(reviews.data, (data) =>
    fill('reviews', rowsOf(data).map((row) => toReview(row, ME)).filter(hasId), (item) => item.providerId === ME),
  );
}

export function useAnalyticsSync() {
  const { hydrate } = useApp();
  const signedIn = useSignedIn();
  const analytics = useGetAnalyticsQuery(undefined, { skip: !signedIn });
  useOnData(analytics.data, (data) => {
    const record = recordOf(data);
    if (record) hydrate({ profileViews: toViews(record) });
  });
}

export function useSubscriptionSync() {
  const { hydrate } = useApp();
  const signedIn = useSignedIn();
  const subscription = useGetSubscriptionQuery(undefined, { skip: !signedIn });
  const invoices = useGetInvoicesQuery(undefined, { skip: !signedIn });
  usePlansSync();
  useOnData(subscription.data, (data) => {
    const plan = planOf(textOf(recordOf(data, 'subscription'), 'plan', 'plan_name', 'name'));
    if (plan) hydrate({ session: { planId: plan } });
  });
  const rows = useMemo(() => rowsOf(invoices.data).map(toInvoice).filter(hasId), [invoices.data]);
  return { invoices: rows, invoicesLoading: invoices.isLoading };
}
