import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { MAX_CONTINUES } from '@/constants/copy';
import { clone, containsContact, parseEuro, uid } from '@/data/format';
import {
  conversations as seedChats,
  demoCustomer,
  favoriteOfferingIds,
  favoriteProviderIds,
  guestSession,
  leadPreferences as seedPrefs,
  leadProposals,
  leads as seedLeads,
  ME,
  notifications as seedNotes,
  notifyPrefs as seedNotify,
  offerings as seedOfferings,
  plans,
  profileViews,
  proposals as seedProposals,
  providers as seedProviders,
  requests as seedRequests,
  reviews as seedReviews,
  templates as seedTemplates,
  planById,
  catalog,
} from '@/data/mock';
import type {
  Conversation,
  DayStatus,
  Lead,
  LeadPreferences,
  NotifyPrefs,
  Offering,
  Outcome,
  PlanId,
  Proposal,
  ProposalTemplate,
  Provider,
  QuoteDraft,
  QuoteRequest,
  Review,
  Session,
  AppNotification,
} from '@/data/types';
import { blankDraft } from '@/data/mock';

type Result = { ok: true } | { ok: false; reason: string };

type Store = {
  session: Session;
  providers: Provider[];
  offerings: Offering[];
  requests: QuoteRequest[];
  proposals: Proposal[];
  leads: Lead[];
  conversations: Conversation[];
  notifications: AppNotification[];
  reviews: Review[];
  outcomes: Outcome[];
  templates: ProposalTemplate[];
  favorites: { providers: string[]; offerings: string[] };
  preferences: LeadPreferences;
  notify: NotifyPrefs;
  quoteDraft: QuoteDraft;
  days: Record<string, DayStatus>;
  catalog: typeof catalog;
  plans: typeof plans;
  profileViews: typeof profileViews;
  me: Provider;
  entitlements: ReturnType<typeof planById>['entitlements'];
  signInDemo: (mode: 'customer' | 'provider') => void;
  signIn: (input: { email: string; password: string }) => Result & { destination?: '/customer' | '/business' | '/setup' };
  registerAccount: (input: { name: string; email: string; phone: string; password: string; mode: 'customer' | 'provider' }) => Result & { destination?: '/customer' | '/setup' };
  register: (input: { name: string; email: string; phone: string }) => void;
  verifyEmail: () => void;
  verifyPhone: () => void;
  signOut: () => void;
  setMode: (mode: 'customer' | 'provider') => void;
  finishSetup: (provider: Provider, planId: PlanId) => void;
  setPlan: (planId: PlanId, billing: Session['billing']) => void;
  updateProvider: (patch: Partial<Provider>) => void;
  saveDraft: (draft: QuoteDraft) => void;
  clearDraft: () => void;
  submitQuote: (draft: QuoteDraft) => Result & { requestId?: string };
  cancelRequest: (id: string, reason: string) => Result;
  continueWith: (proposalId: string) => Result;
  sendMessage: (conversationId: string, text: string) => Result;
  openChat: (input: { box: 'customer' | 'provider'; requestId: string; providerId: string; title: string; subtitle: string }) => string;
  toggleFavorite: (kind: 'providers' | 'offerings', id: string) => void;
  markRead: (id: string) => void;
  markAllRead: (audience: 'customer' | 'provider') => void;
  setNotify: (patch: Partial<NotifyPrefs>) => void;
  setAvailability: (leadId: string, status: Lead['status'], needs: string[], note: string) => void;
  saveLeadProposal: (proposal: Proposal, submit: boolean) => Result;
  withdrawProposal: (id: string, reason: string) => void;
  saveTemplate: (template: ProposalTemplate) => Result;
  removeTemplate: (id: string) => void;
  saveOffering: (offering: Offering) => Result;
  setOfferingActive: (id: string, active: boolean) => void;
  savePreferences: (prefs: LeadPreferences) => void;
  cycleDay: (iso: string) => void;
  submitOutcome: (outcome: Outcome) => void;
  submitReview: (review: Review) => Result;
  respondToReview: (id: string, response: string) => void;
  report: (target: string) => void;
  spendAi: () => Result;
  reports: string[];
};

type Account = {
  name: string;
  email: string;
  phone: string;
  password: string;
  mode: 'customer' | 'provider';
  hasProviderProfile: boolean;
};

const seedAccounts: Account[] = [
  {
    name: 'Anna de Vries',
    email: 'anna.devries@example.nl',
    phone: '+31 6 1000 2000',
    password: 'demo123',
    mode: 'customer',
    hasProviderProfile: true,
  },
  {
    name: 'Mango & Co',
    email: 'hello@mangoandco.nl',
    phone: '+31 6 1111 2222',
    password: 'demo123',
    mode: 'provider',
    hasProviderProfile: true,
  },
];

function destinationFor(account: Pick<Account, 'mode' | 'hasProviderProfile'>): '/customer' | '/business' | '/setup' {
  if (account.mode === 'provider') return account.hasProviderProfile ? '/business' : '/setup';
  return '/customer';
}

const Ctx = createContext<Store | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(guestSession);
  const [providers, setProviders] = useState<Provider[]>(() => clone(seedProviders));
  const [offerings, setOfferings] = useState<Offering[]>(() => clone(seedOfferings));
  const [requests, setRequests] = useState<QuoteRequest[]>(() => clone(seedRequests));
  const [proposals, setProposals] = useState<Proposal[]>(() => clone([...seedProposals, ...leadProposals]));
  const [leads, setLeads] = useState<Lead[]>(() => clone(seedLeads));
  const [conversations, setConversations] = useState<Conversation[]>(() => clone(seedChats));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => clone(seedNotes));
  const [reviews, setReviews] = useState<Review[]>(() => clone(seedReviews));
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [templates, setTemplates] = useState<ProposalTemplate[]>(() => clone(seedTemplates));
  const [favorites, setFavorites] = useState({ providers: [...favoriteProviderIds], offerings: [...favoriteOfferingIds] });
  const [preferences, setPreferences] = useState<LeadPreferences>(() => clone(seedPrefs));
  const [notify, setNotifyState] = useState<NotifyPrefs>(() => clone(seedNotify));
  const [quoteDraft, setQuoteDraft] = useState<QuoteDraft>(blankDraft());
  const [days, setDays] = useState<Record<string, DayStatus>>({ '2026-10-18': 'unavailable', '2026-10-24': 'limited' });
  const [reports, setReports] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<Account[]>(seedAccounts);

  const api = useMemo<Store>(() => {
    const entitlements = planById(session.planId).entitlements;
    const me = providers.find((provider) => provider.id === ME) ?? providers[0];

    const notifyUser = (note: AppNotification) => setNotifications((list) => [note, ...list]);

    return {
      session,
      providers,
      offerings,
      requests,
      proposals,
      leads,
      conversations,
      notifications,
      reviews,
      outcomes,
      templates,
      favorites,
      preferences,
      notify,
      quoteDraft,
      days,
      catalog,
      plans,
      profileViews,
      me,
      entitlements,
      reports,
      signInDemo: (mode) => setSession({ ...demoCustomer, mode }),
      signIn: ({ email, password }) => {
        const account = accounts.find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
        if (!account || account.password !== password) return { ok: false, reason: 'Email or password is wrong.' };
        setSession({
          ...demoCustomer,
          signedIn: true,
          emailVerified: true,
          phoneVerified: true,
          name: account.name,
          email: account.email,
          phone: account.phone,
          mode: account.mode,
          hasProviderProfile: account.hasProviderProfile,
          planId: account.hasProviderProfile ? 'professional' : 'free',
        });
        return { ok: true, destination: destinationFor(account) };
      },
      registerAccount: ({ name, email, phone, password, mode }) => {
        const cleanEmail = email.trim().toLowerCase();
        if (accounts.some((item) => item.email.toLowerCase() === cleanEmail)) return { ok: false, reason: 'An account with this email already exists. Log in instead.' };
        const account: Account = { name: name.trim(), email: cleanEmail, phone: phone.trim(), password, mode, hasProviderProfile: false };
        setAccounts((list) => [...list, account]);
        setSession({
          ...guestSession,
          signedIn: true,
          emailVerified: true,
          phoneVerified: true,
          name: account.name,
          email: account.email,
          phone: account.phone,
          mode,
          hasProviderProfile: false,
        });
        return { ok: true, destination: mode === 'provider' ? '/setup' : '/customer' };
      },
      register: ({ name, email, phone }) =>
        setSession((current) => ({ ...current, signedIn: true, name, email, phone, emailVerified: false, phoneVerified: false })),
      verifyEmail: () => setSession((current) => ({ ...current, emailVerified: true })),
      verifyPhone: () => setSession((current) => ({ ...current, phoneVerified: true })),
      signOut: () => setSession(guestSession),
      setMode: (mode) => setSession((current) => ({ ...current, mode })),
      finishSetup: (provider, planId) => {
        setProviders((list) => list.map((item) => (item.id === ME ? { ...item, ...provider, id: ME, plan: planId } : item)));
        setSession((current) => ({ ...current, signedIn: true, hasProviderProfile: true, planId, mode: 'provider', emailVerified: true, phoneVerified: true }));
        setAccounts((list) => list.map((item) => (item.email.toLowerCase() === session.email.toLowerCase() ? { ...item, hasProviderProfile: true, mode: 'provider' } : item)));
      },
      setPlan: (planId, billing) => {
        setSession((current) => ({ ...current, planId, billing, hasProviderProfile: true }));
        setProviders((list) => list.map((item) => (item.id === ME ? { ...item, plan: planId } : item)));
      },
      updateProvider: (patch) => setProviders((list) => list.map((item) => (item.id === ME ? { ...item, ...patch } : item))),
      saveDraft: (draft) => setQuoteDraft(draft),
      clearDraft: () => setQuoteDraft(blankDraft()),
      submitQuote: (draft) => {
        if (!session.signedIn) return { ok: false, reason: 'Sign in before sending the request.' };
        if (!session.phoneVerified) return { ok: false, reason: 'Verify your phone before the request is shared with providers.' };
        if (!draft.understood) return { ok: false, reason: 'Confirm that you are asking for indicative proposals.' };
        if (draft.halal && !draft.halalConfirmed) return { ok: false, reason: 'Confirm the halal preference yourself.' };
        const guests = Number(draft.guests);
        const request: QuoteRequest = {
          id: uid('req'),
          status: 'comparing',
          eventType: draft.eventType,
          date: draft.date,
          startTime: draft.startTime,
          endTime: draft.endTime,
          flexibleDate: draft.flexibleDate,
          postcode: draft.postcode,
          city: draft.city,
          setting: draft.setting,
          guests,
          adults: draft.adults ? Number(draft.adults) : undefined,
          children: draft.children ? Number(draft.children) : undefined,
          needs: draft.needs,
          cuisines: draft.cuisines,
          dishes: draft.dishes,
          servingStyle: draft.servingStyle,
          dietary: draft.dietary,
          allergies: draft.allergies,
          halal: draft.halal,
          servicePrefs: draft.servicePrefs,
          budgetType: draft.budgetType,
          budgetCents: draft.budgetType === 'open' ? null : parseEuro(draft.budget),
          notes: draft.notes,
          createdAt: new Date().toISOString(),
          contactProviderIds: [],
          invitedCount: 0,
        };
        const eligible = providers.filter((provider) => {
          if (provider.plan === 'free') return false;
          if (guests && guests > provider.maxGuests) return false;
          if (draft.city && provider.city !== draft.city && provider.radiusKm < 30) return false;
          if (draft.needs.includes('Food') && draft.cuisines.length && provider.cuisines.length && !draft.cuisines.some((cuisine) => provider.cuisines.includes(cuisine))) {
            return provider.services.includes('Full-service catering');
          }
          return true;
        });
        request.invitedCount = Math.min(eligible.length, 12);
        const created = eligible.slice(0, 2).map((provider, index) => {
          const food = draft.needs.includes('Food') ? guests * (provider.startingPriceCents || 2500) : 0;
          return {
            id: uid('prop'),
            requestId: request.id,
            providerId: provider.id,
            availability: index === 0 ? 'available' : 'partial',
            partialNote: index === 0 ? '' : 'We can cover part of the request. See the note.',
            message: `Indication for your ${draft.eventType.toLowerCase()} in ${draft.city}. Final scope is agreed directly.`,
            guests,
            items: draft.dishes ? [draft.dishes] : provider.cuisines.slice(0, 2),
            services: draft.servicePrefs.slice(0, 3),
            foodCents: food,
            drinksCents: draft.needs.includes('Drinks') ? guests * 300 : 0,
            staffCents: draft.needs.includes('Staff') ? 28000 : 0,
            deliveryCents: 4500,
            equipmentCents: 0,
            otherCents: 0,
            discountCents: 0,
            vatNote: 'Indicative VAT treatment. The final invoice is between you and the provider.',
            included: ['Items listed above'],
            excluded: ['Anything not listed', 'Venue hire'],
            assumptions: 'Guest count and location stay close to this request.',
            expiresAt: '2026-10-28',
            status: 'submitted' as const,
            matchScore: 80 - index * 8,
          } satisfies Proposal;
        });
        setRequests((list) => [request, ...list]);
        setProposals((list) => [...created, ...list]);
        setQuoteDraft(blankDraft());
        notifyUser({
          id: uid('n'),
          audience: 'customer',
          title: 'Request sent',
          body: `${request.invitedCount} eligible providers were invited. Free listings are not included.`,
          at: new Date().toISOString(),
          read: false,
          href: `/request/${request.id}`,
        });
        return { ok: true, requestId: request.id };
      },
      cancelRequest: (id, reason) => {
        if (!reason) return { ok: false, reason: 'Choose a reason.' };
        setRequests((list) => list.map((item) => (item.id === id ? { ...item, status: 'cancelled', cancelReason: reason } : item)));
        return { ok: true };
      },
      continueWith: (proposalId) => {
        const proposal = proposals.find((item) => item.id === proposalId);
        if (!proposal || proposal.status !== 'submitted') return { ok: false, reason: 'This proposal is no longer open.' };
        const request = requests.find((item) => item.id === proposal.requestId);
        if (!request) return { ok: false, reason: 'Request not found.' };
        if (request.contactProviderIds.includes(proposal.providerId)) return { ok: true };
        if (request.contactProviderIds.length >= MAX_CONTINUES) {
          return { ok: false, reason: `You can continue with up to ${MAX_CONTINUES} providers on this request.` };
        }
        setRequests((list) =>
          list.map((item) =>
            item.id === request.id
              ? { ...item, status: 'contact_released', contactProviderIds: [...item.contactProviderIds, proposal.providerId] }
              : item,
          ),
        );
        notifyUser({
          id: uid('n'),
          audience: 'customer',
          title: 'Contact released',
          body: 'You can now see the provider’s phone and email for this request.',
          at: new Date().toISOString(),
          read: false,
          href: `/contact/${request.id}`,
        });
        return { ok: true };
      },
      sendMessage: (conversationId, text) => {
        const conversation = conversations.find((item) => item.id === conversationId);
        if (!conversation) return { ok: false, reason: 'Conversation not found.' };
        const released =
          conversation.box === 'provider'
            ? leads.some((lead) => lead.request.id === conversation.requestId && lead.contactReleased)
            : requests.some((item) => item.id === conversation.requestId && item.contactProviderIds.includes(conversation.providerId));
        if (!released && containsContact(text)) return { ok: false, reason: 'contact' };
        const from = conversation.box === 'provider' ? 'provider' : 'customer';
        setConversations((list) =>
          list.map((item) =>
            item.id === conversationId
              ? { ...item, messages: [...item.messages, { id: uid('m'), from, text: text.trim(), at: new Date().toISOString() }] }
              : item,
          ),
        );
        return { ok: true };
      },
      openChat: (input) => {
        const existing = conversations.find((item) => item.box === input.box && item.requestId === input.requestId && item.providerId === input.providerId);
        if (existing) return existing.id;
        const created: Conversation = { id: uid('chat'), ...input, messages: [] };
        setConversations((list) => [created, ...list]);
        return created.id;
      },
      toggleFavorite: (kind, id) =>
        setFavorites((current) => ({
          ...current,
          [kind]: current[kind].includes(id) ? current[kind].filter((item) => item !== id) : [...current[kind], id],
        })),
      markRead: (id) => setNotifications((list) => list.map((item) => (item.id === id ? { ...item, read: true } : item))),
      markAllRead: (audience) => setNotifications((list) => list.map((item) => (item.audience === audience ? { ...item, read: true } : item))),
      setNotify: (patch) => setNotifyState((current) => ({ ...current, ...patch })),
      setAvailability: (leadId, status, needs, note) =>
        setLeads((list) => list.map((lead) => (lead.id === leadId ? { ...lead, status, fulfilledNeeds: needs, availabilityNote: note } : lead))),
      saveLeadProposal: (proposal, submit) => {
        if (!entitlements.quoteLeads) return { ok: false, reason: 'Quote leads need a Starter plan or higher.' };
        const next = { ...proposal, status: submit ? 'submitted' as const : 'draft' as const };
        setProposals((list) => {
          const exists = list.some((item) => item.id === next.id);
          return exists ? list.map((item) => (item.id === next.id ? next : item)) : [next, ...list];
        });
        setLeads((list) =>
          list.map((lead) =>
            lead.id === proposal.leadId ? { ...lead, proposalId: next.id, status: submit ? 'proposal_submitted' : 'proposal_draft' } : lead,
          ),
        );
        if (submit) {
          notifyUser({
            id: uid('n'),
            audience: 'provider',
            title: 'Proposal sent',
            body: 'The customer can compare this indication with others.',
            at: new Date().toISOString(),
            read: false,
            href: `/lead/${proposal.leadId}`,
          });
        }
        return { ok: true };
      },
      withdrawProposal: (id, reason) =>
        setProposals((list) => list.map((item) => (item.id === id ? { ...item, status: 'withdrawn', withdrawReason: reason } : item))),
      saveTemplate: (template) => {
        if (templates.length >= entitlements.templateLimit && !templates.some((item) => item.id === template.id)) {
          return { ok: false, reason: 'This plan has no room for another template.' };
        }
        setTemplates((list) => (list.some((item) => item.id === template.id) ? list.map((item) => (item.id === template.id ? template : item)) : [template, ...list]));
        return { ok: true };
      },
      removeTemplate: (id) => setTemplates((list) => list.filter((item) => item.id !== id)),
      saveOffering: (offering) => {
        const activeCount = offerings.filter((item) => item.providerId === ME && item.active && item.id !== offering.id).length;
        if (offering.active && activeCount >= entitlements.maxOfferings) {
          return { ok: false, reason: `Your plan allows ${entitlements.maxOfferings} active offerings.` };
        }
        if (offering.allergens.length && !offering.allergensConfirmed) {
          return { ok: false, reason: 'Confirm allergen details yourself before saving.' };
        }
        setOfferings((list) => (list.some((item) => item.id === offering.id) ? list.map((item) => (item.id === offering.id ? offering : item)) : [offering, ...list]));
        return { ok: true };
      },
      setOfferingActive: (id, active) => {
        if (active) {
          const activeCount = offerings.filter((item) => item.providerId === ME && item.active).length;
          if (activeCount >= entitlements.maxOfferings) return;
        }
        setOfferings((list) => list.map((item) => (item.id === id ? { ...item, active } : item)));
      },
      savePreferences: (prefs) => setPreferences(prefs),
      cycleDay: (iso) =>
        setDays((current) => {
          const order: Array<DayStatus | undefined> = [undefined, 'available', 'limited', 'unavailable'];
          const next = order[(order.indexOf(current[iso]) + 1) % order.length];
          const copy = { ...current };
          if (!next) delete copy[iso];
          else copy[iso] = next;
          return copy;
        }),
      submitOutcome: (outcome) => {
        setOutcomes((list) => [...list.filter((item) => item.requestId !== outcome.requestId), outcome]);
        setRequests((list) => list.map((item) => (item.id === outcome.requestId ? { ...item, status: outcome.choice === 'cancelled' ? 'cancelled' : 'completed' } : item)));
      },
      submitReview: (review) => {
        const request = requests.find((item) => item.id === review.requestId);
        const outcome = outcomes.find((item) => item.requestId === review.requestId);
        if (!request || !outcome || outcome.choice !== 'provider' || outcome.providerId !== review.providerId) {
          return { ok: false, reason: 'Verified reviews are available after you confirm the provider was used.' };
        }
        if (!request.contactProviderIds.includes(review.providerId)) {
          return { ok: false, reason: 'Continue with the provider before reviewing.' };
        }
        setReviews((list) => [review, ...list]);
        setProviders((list) =>
          list.map((provider) => {
            if (provider.id !== review.providerId) return provider;
            const count = provider.reviewCount + 1;
            const rating = Math.round(((provider.rating * provider.reviewCount + review.overall) / count) * 10) / 10;
            return { ...provider, reviewCount: count, rating };
          }),
        );
        return { ok: true };
      },
      respondToReview: (id, response) => setReviews((list) => list.map((review) => (review.id === id && !review.response ? { ...review, response } : review))),
      report: (target) => setReports((list) => [...list, target]),
      spendAi: () => {
        if (session.aiUsed >= entitlements.aiCredits) return { ok: false, reason: 'No AI assists left on this plan. You can still write the text yourself.' };
        setSession((current) => ({ ...current, aiUsed: current.aiUsed + 1 }));
        return { ok: true };
      },
    };
  }, [session, providers, offerings, requests, proposals, leads, conversations, notifications, reviews, outcomes, templates, favorites, preferences, notify, quoteDraft, days, reports, accounts]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useApp() {
  const value = useContext(Ctx);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
