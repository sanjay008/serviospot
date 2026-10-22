import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';

import { apiActions } from '@/api/actions';
import { restoreAuthToken, setAuthToken } from '@/api/client';
import { recordOf, toMessage } from '@/api/mappers';
import type { ApiRecord } from '@/api/types';
import { MAX_CONTINUES } from '@/constants/copy';
import { clone, containsContact } from '@/data/format';
import { blankDraft, blankProvider, guestSession, leadPreferences as seedPrefs, ME, notifyPrefs as seedNotify, planBase, profileViews } from '@/data/mock';
import type {
  Category,
  ChatMessage,
  Conversation,
  DayStatus,
  Lead,
  LeadPreferences,
  MasterItem,
  NotifyPrefs,
  Offering,
  Outcome,
  Plan,
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

type Result = { ok: true } | { ok: false; reason: string };

type Lists = {
  providers: Provider[];
  offerings: Offering[];
  requests: QuoteRequest[];
  proposals: Proposal[];
  leads: Lead[];
  conversations: Conversation[];
  notifications: AppNotification[];
  reviews: Review[];
  templates: ProposalTemplate[];
};
export type ListKey = keyof Lists;

type Views = typeof profileViews;

export type HydratePatch = Partial<{
  session: Partial<Session>;
  preferences: LeadPreferences;
  notify: NotifyPrefs;
  days: Record<string, DayStatus>;
  favorites: { providers: string[]; offerings: string[]; rowIds: Record<string, string> };
  profileViews: Partial<Record<keyof Views, number | undefined>>;
  plans: Plan[];
  categories: Category[];
}>;

type Store = {
  session: Session;
  /** False until the saved login has been read from the device. */
  restored: boolean;
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
  favorites: { providers: string[]; offerings: string[]; rowIds: Record<string, string> };
  preferences: LeadPreferences;
  notify: NotifyPrefs;
  quoteDraft: QuoteDraft;
  days: Record<string, DayStatus>;
  catalog: MasterItem[];
  plans: Plan[];
  planById: (id: string) => Plan;
  categories: Category[];
  /** The display name of a category code, or the code itself while categories load. */
  categoryName: (code: string) => string;
  profileViews: Views;
  me: Provider;
  entitlements: Plan['entitlements'];
  /** Puts API rows into a list. Without a scope the whole list is replaced. */
  fill: <K extends ListKey>(key: K, items: Lists[K], scope?: (item: Lists[K][number]) => boolean) => void;
  hydrate: (patch: HydratePatch) => void;
  setMessages: (conversationId: string, messages: ChatMessage[]) => void;
  /** Adds one live chat message without replacing the thread. */
  receiveChat: (conversationId: string, raw: ApiRecord) => void;
  startSession: (account: { name: string; email: string; phone: string; mode: 'customer' | 'provider'; hasProviderProfile: boolean }) => '/customer' | '/vendor';
  verifyEmail: () => Promise<Result>;
  verifyPhone: () => Promise<Result>;
  /** Clears the session on this phone. Call it only after the logout or delete API succeeded. */
  signOut: () => void;
  setMode: (mode: 'customer' | 'provider') => void;
  setPlan: (planId: PlanId, billing: Session['billing']) => Promise<Result>;
  updateProvider: (patch: Partial<Provider>) => void;
  saveDraft: (draft: QuoteDraft) => Promise<Result>;
  clearDraft: () => void;
  submitQuote: (draft: QuoteDraft) => Promise<Result & { requestId?: string }>;
  cancelRequest: (id: string, reason: string) => Promise<Result>;
  continueWith: (proposalId: string) => Promise<Result>;
  sendMessage: (conversationId: string, text: string) => Promise<Result>;
  /** Returns a conversation id that already came from the server. */
  openChat: (input: { box: 'customer' | 'provider'; requestId: string; providerId: string }) => string;
  toggleFavorite: (kind: 'providers' | 'offerings', id: string) => Promise<Result>;
  markRead: (id: string) => Promise<Result>;
  markAllRead: (audience: 'customer' | 'provider') => Promise<Result>;
  setNotify: (patch: Partial<NotifyPrefs>) => Promise<Result>;
  setAvailability: (leadId: string, status: Lead['status'], needs: string[], note: string) => Promise<Result>;
  saveLeadProposal: (proposal: Proposal, submit: boolean) => Promise<Result>;
  withdrawProposal: (id: string, reason: string) => Promise<Result>;
  saveTemplate: (template: ProposalTemplate) => Promise<Result>;
  removeTemplate: (id: string) => Promise<Result>;
  saveOffering: (offering: Offering) => Promise<Result>;
  setOfferingActive: (id: string, active: boolean) => Promise<Result>;
  savePreferences: (prefs: LeadPreferences) => Promise<Result>;
  cycleDay: (iso: string) => Promise<Result>;
  submitOutcome: (outcome: Outcome) => Promise<Result>;
  submitReview: (review: Review) => Promise<Result>;
  respondToReview: (id: string, response: string) => Promise<Result>;
  report: (target: string, reason: string, details: string) => Promise<Result>;
  spendAi: () => Result;
  reports: string[];
};

function destinationFor(account: { mode: 'customer' | 'provider'; hasProviderProfile: boolean }): '/customer' | '/vendor' {
  if (account.mode === 'provider') return '/vendor';
  return '/customer';
}

function replyId(data: ApiRecord, ...keys: string[]) {
  const record = recordOf(data) ?? {};
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return '';
}

async function settled(result: { ok: true } | { ok: false; reason: string }): Promise<Result> {
  return result.ok ? { ok: true } : { ok: false, reason: result.reason };
}

/** Where a signed-in user lands when the app opens. */
export function homeFor(session: Session): '/' | '/customer' | '/vendor' {
  if (!session.signedIn) return '/';
  if (session.mode === 'provider') return '/vendor';
  return '/customer';
}

const SESSION_KEY = 'session';
/** One-time wipe so the next launch starts signed out. A later login is kept. */
const STARTUP_LOGOUT_KEY = 'startupLoggedOut';

function logStoredVendorProfileStatus(session: Session, source: 'save' | 'restore') {
  const response = session.authResponse;
  const user = response?.user && typeof response.user === 'object' ? response.user as Record<string, unknown> : undefined;
  const value = response?.vendor_profile_complete ?? user?.vendor_profile_complete;
  console.log(`[AUTH] ${source}: vendor_profile_complete=`, value ?? '(missing)', '| hasProviderProfile=', session.hasProviderProfile);
}

const Ctx = createContext<Store | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(guestSession);
  const [restored, setRestored] = useState(false);
  // Only a real login or register is kept on the device; guest sessions are not.
  const [remember, setRemember] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [favorites, setFavorites] = useState<{ providers: string[]; offerings: string[]; rowIds: Record<string, string> }>({ providers: [], offerings: [], rowIds: {} });
  const [preferences, setPreferences] = useState<LeadPreferences>(() => clone(seedPrefs));
  const [notify, setNotifyState] = useState<NotifyPrefs>(() => clone(seedNotify));
  const [quoteDraft, setQuoteDraft] = useState<QuoteDraft>(blankDraft());
  const [days, setDays] = useState<Record<string, DayStatus>>({});
  const [reports, setReports] = useState<string[]>([]);
  const [views, setViews] = useState<Views>(() => clone(profileViews));

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const wiped = await AsyncStorage.getItem(STARTUP_LOGOUT_KEY);
        if (!wiped) {
          await setAuthToken(null);
          await AsyncStorage.removeItem(SESSION_KEY);
          await AsyncStorage.setItem(STARTUP_LOGOUT_KEY, '1');
        } else {
          await restoreAuthToken();
          const saved = await AsyncStorage.getItem(SESSION_KEY);
          if (alive && saved) {
            const restoredSession = { ...guestSession, ...(JSON.parse(saved) as Partial<Session>) };
            setSession(restoredSession);
            setRemember(true);
            logStoredVendorProfileStatus(restoredSession, 'restore');
          }
        }
      } catch {
        // A broken saved session just means the user logs in again.
      } finally {
        if (alive) setRestored(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!restored) return;
    if (remember && session.signedIn) {
      logStoredVendorProfileStatus(session, 'save');
      void AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    else void AsyncStorage.removeItem(SESSION_KEY);
  }, [restored, remember, session]);

  const api = useMemo<Store>(() => {
    const setters: { [K in ListKey]: Dispatch<SetStateAction<Lists[K]>> } = {
      providers: setProviders,
      offerings: setOfferings,
      requests: setRequests,
      proposals: setProposals,
      leads: setLeads,
      conversations: setConversations,
      notifications: setNotifications,
      reviews: setReviews,
      templates: setTemplates,
    };
    const planById = (id: string) => plans.find((plan) => plan.id === id) ?? planBase(session.planId);
    const entitlements = planById(session.planId).entitlements;
    const me = providers.find((provider) => provider.id === ME) ?? blankProvider();
    const updateMe = (patch: Partial<Provider>) =>
      setProviders((list) => (list.some((item) => item.id === ME) ? list.map((item) => (item.id === ME ? { ...item, ...patch, id: ME } : item)) : [{ ...blankProvider(), ...patch, id: ME }, ...list]));

    return {
      session,
      restored,
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
      catalog: [],
      plans,
      planById,
      categories,
      categoryName: (code) => categories.find((item) => item.code === code)?.name ?? code,
      profileViews: views,
      me,
      entitlements,
      reports,
      fill: (key, items, scope) => {
        const incoming = new Set(items.map((item) => item.id));
        const setter = setters[key] as Dispatch<SetStateAction<{ id: string }[]>>;
        const inScope = scope as ((item: { id: string }) => boolean) | undefined;
        setter((list) => [...items, ...list.filter((item) => !incoming.has(item.id) && (inScope ? !inScope(item) : false))]);
      },
      hydrate: (patch) => {
        if (patch.session) setSession((current) => ({ ...current, ...patch.session }));
        if (patch.preferences) setPreferences(patch.preferences);
        if (patch.notify) setNotifyState(patch.notify);
        if (patch.days) setDays(patch.days);
        if (patch.favorites) setFavorites(patch.favorites);
        if (patch.plans) setPlans(patch.plans);
        if (patch.categories) setCategories(patch.categories);
        const nextViews = patch.profileViews;
        if (nextViews) {
          setViews((current) => ({
            profile: nextViews.profile ?? current.profile,
            offerings: nextViews.offerings ?? current.offerings,
            search: nextViews.search ?? current.search,
            responseHours: nextViews.responseHours ?? current.responseHours,
          }));
        }
      },
      setMessages: (conversationId, messages) => {
        setConversations((list) => list.map((item) => (item.id === conversationId ? { ...item, messages } : item)));
      },
      receiveChat: (conversationId, raw) => {
        setConversations((list) =>
          list.map((item) => {
            if (item.id !== conversationId) return item;
            const message = toMessage({ ...raw, id: raw.id ?? `live-${conversationId}-${String(raw.created_at ?? '')}-${String(raw.message ?? '')}` }, item.box);
            if (!message.text || item.messages.some((row) => row.id === message.id)) return item;
            return { ...item, subtitle: message.text, messages: [...item.messages, message] };
          }),
        );
      },
      startSession: (account) => {
        setRemember(true);
        setSession({
          ...guestSession,
          signedIn: true,
          name: account.name,
          email: account.email,
          phone: account.phone,
          mode: account.mode,
          hasProviderProfile: account.hasProviderProfile,
          planId: account.hasProviderProfile ? 'gold' : 'free',
        });
        return destinationFor(account);
      },
      verifyEmail: async () => {
        const result = await settled(await apiActions.verifyEmail());
        if (result.ok) setSession((current) => ({ ...current, emailVerified: true }));
        return result;
      },
      verifyPhone: async () => {
        const result = await settled(await apiActions.verifyPhone(session.phone));
        if (result.ok) setSession((current) => ({ ...current, phoneVerified: true }));
        return result;
      },
      signOut: () => {
        setRemember(false);
        setSession(guestSession);
        void setAuthToken(null);
        for (const setter of [setRequests, setProposals, setLeads, setConversations, setNotifications, setTemplates, setOutcomes] as Dispatch<SetStateAction<unknown[]>>[]) setter([]);
        setProviders((list) => list.filter((item) => item.id !== ME));
        setOfferings((list) => list.filter((item) => item.providerId !== ME));
        setFavorites({ providers: [], offerings: [], rowIds: {} });
        setQuoteDraft(blankDraft());
        setDays({});
      },
      setMode: (mode) => setSession((current) => ({ ...current, mode })),
      setPlan: async (planId, billing) => {
        const result = await settled(await apiActions.subscription(planId));
        if (!result.ok) return result;
        setSession((current) => ({ ...current, planId, billing, hasProviderProfile: true }));
        updateMe({ plan: planId });
        return result;
      },
      updateProvider: updateMe,
      saveDraft: async (draft) => {
        const stepChanged = draft.step !== quoteDraft.step;
        setQuoteDraft(draft);
        if (!stepChanged || !session.signedIn) return { ok: true };
        return settled(await apiActions.requestDraft(draft));
      },
      clearDraft: () => setQuoteDraft(blankDraft()),
      submitQuote: async (draft) => {
        if (!session.signedIn) return { ok: false, reason: 'Sign in before sending the request.' };
        const saved = await apiActions.requestDraft(draft);
        if (!saved.ok) return { ok: false, reason: saved.reason };
        const sent = await apiActions.submitRequest(draft);
        if (!sent.ok) return { ok: false, reason: sent.reason };
        setQuoteDraft(blankDraft());
        const requestId = replyId(sent.data, 'request_id', 'id');
        return { ok: true, requestId: requestId || undefined };
      },
      cancelRequest: async (id, reason) => {
        if (!reason) return { ok: false, reason: 'Choose a reason.' };
        const result = await settled(await apiActions.cancelRequest(id, reason));
        if (result.ok) setRequests((list) => list.map((item) => (item.id === id ? { ...item, status: 'cancelled', cancelReason: reason } : item)));
        return result;
      },
      continueWith: async (proposalId) => {
        const proposal = proposals.find((item) => item.id === proposalId);
        if (!proposal || proposal.status !== 'submitted') return { ok: false, reason: 'This proposal is no longer open.' };
        const request = requests.find((item) => item.id === proposal.requestId);
        if (!request) return { ok: false, reason: 'Request not found.' };
        if (request.contactProviderIds.includes(proposal.providerId)) return { ok: true };
        if (request.contactProviderIds.length >= MAX_CONTINUES) {
          return { ok: false, reason: `You can continue with up to ${MAX_CONTINUES} providers on this request.` };
        }
        const result = await settled(await apiActions.continueWith(proposalId));
        if (!result.ok) return result;
        setRequests((list) =>
          list.map((item) =>
            item.id === request.id
              ? { ...item, status: 'contact_released', contactProviderIds: [...item.contactProviderIds, proposal.providerId] }
              : item,
          ),
        );
        return { ok: true };
      },
      sendMessage: async (conversationId, text) => {
        const conversation = conversations.find((item) => item.id === conversationId);
        if (!conversation) return { ok: false, reason: 'Conversation not found.' };
        const released =
          conversation.box === 'provider'
            ? leads.some((lead) => lead.request.id === conversation.requestId && lead.contactReleased)
            : requests.some((item) => item.id === conversation.requestId && item.contactProviderIds.includes(conversation.providerId));
        if (!released && containsContact(text)) return { ok: false, reason: 'contact' };
        const result = await settled(await apiActions.sendMessage(conversationId, text.trim()));
        // Socket relay is temporarily disabled while investigating APK crashes.
        return result;
      },
      openChat: (input) =>
        conversations.find((item) => item.box === input.box && item.requestId === input.requestId && (input.box === 'provider' || item.providerId === input.providerId))?.id ?? '',
      toggleFavorite: async (kind, id) => {
        const key = `${kind}:${id}`;
        const already = favorites[kind].includes(id);
        const result = await apiActions.favorite(kind, id, !already, favorites.rowIds[key]);
        if (!result.ok) return { ok: false, reason: result.reason };
        const kept = typeof result.data.saved === 'boolean' ? result.data.saved : !already;
        const rowId = typeof result.data.id === 'number' || typeof result.data.id === 'string' ? String(result.data.id) : '';
        setFavorites((current) => {
          const rowIds = { ...current.rowIds };
          if (kept && rowId) rowIds[key] = rowId;
          else delete rowIds[key];
          const list = current[kind].filter((item) => item !== id);
          return { ...current, [kind]: kept ? [...list, id] : list, rowIds };
        });
        return { ok: true };
      },
      markRead: async (id) => {
        const result = await settled(await apiActions.markRead(id));
        if (result.ok) setNotifications((list) => list.map((item) => (item.id === id ? { ...item, read: true } : item)));
        return result;
      },
      markAllRead: async (audience) => {
        const result = await settled(await apiActions.markAllRead());
        if (result.ok) setNotifications((list) => list.map((item) => (item.audience === audience ? { ...item, read: true } : item)));
        return result;
      },
      setNotify: async (patch) => {
        const result = await settled(await apiActions.notifySettings({ ...notify, ...patch }));
        if (result.ok) setNotifyState((current) => ({ ...current, ...patch }));
        return result;
      },
      setAvailability: async (leadId, status, needs, note) => {
        const result = await settled(await apiActions.availability(leadId, status, note));
        if (result.ok) setLeads((list) => list.map((lead) => (lead.id === leadId ? { ...lead, status, fulfilledNeeds: needs, availabilityNote: note } : lead)));
        return result;
      },
      saveLeadProposal: async (proposal, submit) => {
        if (!entitlements.quoteLeads) return { ok: false, reason: 'Price requests need the Gold or Platinum plan.' };
        const sent = await apiActions.proposal({ ...proposal, status: submit ? 'submitted' : 'draft' });
        if (!sent.ok) return { ok: false, reason: sent.reason };
        const proposalId = replyId(sent.data, 'proposal_id', 'id') || proposal.id;
        setLeads((list) =>
          list.map((lead) => (lead.id === proposal.leadId ? { ...lead, proposalId: proposalId || lead.proposalId, status: submit ? 'proposal_submitted' : 'proposal_draft' } : lead)),
        );
        return { ok: true };
      },
      withdrawProposal: async (id, reason) => {
        const result = await settled(await apiActions.withdrawProposal(id));
        if (result.ok) setProposals((list) => list.map((item) => (item.id === id ? { ...item, status: 'withdrawn', withdrawReason: reason } : item)));
        return result;
      },
      saveTemplate: async (template) => {
        if (templates.length >= entitlements.templateLimit && !templates.some((item) => item.id === template.id)) {
          return { ok: false, reason: 'This plan has no room for another template.' };
        }
        return settled(await apiActions.template(template));
      },
      removeTemplate: async (id) => {
        const result = await settled(await apiActions.deleteTemplate(id));
        if (result.ok) setTemplates((list) => list.filter((item) => item.id !== id));
        return result;
      },
      saveOffering: async (offering) => {
        const activeCount = offerings.filter((item) => item.providerId === ME && item.active && item.id !== offering.id).length;
        if (offering.active && activeCount >= entitlements.maxOfferings) {
          return { ok: false, reason: `Your plan allows ${entitlements.maxOfferings} active offerings.` };
        }
        return settled(await apiActions.offering(offering, !offerings.some((item) => item.id === offering.id)));
      },
      setOfferingActive: async (id, active) => {
        if (active) {
          const activeCount = offerings.filter((item) => item.providerId === ME && item.active).length;
          if (activeCount >= entitlements.maxOfferings) return { ok: false, reason: `Your plan allows ${entitlements.maxOfferings} active offerings.` };
        }
        const result = await settled(await apiActions.offeringActive(id, active));
        if (result.ok) setOfferings((list) => list.map((item) => (item.id === id ? { ...item, active } : item)));
        return result;
      },
      savePreferences: async (prefs) => {
        const result = await settled(await apiActions.preferences(prefs));
        if (result.ok) setPreferences(prefs);
        return result;
      },
      cycleDay: async (iso) => {
        const order: DayStatus[] = ['available', 'limited', 'unavailable'];
        const next = order[(Math.max(order.indexOf(days[iso] as DayStatus), -1) + 1) % order.length];
        const result = await settled(await apiActions.calendar(iso, next));
        if (result.ok) setDays((current) => ({ ...current, [iso]: next }));
        return result;
      },
      submitOutcome: async (outcome) => {
        const result = await settled(await apiActions.outcome(outcome));
        if (!result.ok) return result;
        setOutcomes((list) => [...list.filter((item) => item.requestId !== outcome.requestId), outcome]);
        setRequests((list) => list.map((item) => (item.id === outcome.requestId ? { ...item, status: outcome.choice === 'cancelled' ? 'cancelled' : 'completed' } : item)));
        return result;
      },
      submitReview: async (review) => {
        const request = requests.find((item) => item.id === review.requestId);
        const outcome = outcomes.find((item) => item.requestId === review.requestId);
        if (!request || !outcome || outcome.choice !== 'provider' || outcome.providerId !== review.providerId) {
          return { ok: false, reason: 'Verified reviews are available after you confirm the provider was used.' };
        }
        if (!request.contactProviderIds.includes(review.providerId)) {
          return { ok: false, reason: 'Continue with the provider before reviewing.' };
        }
        return settled(await apiActions.review(review));
      },
      respondToReview: async (id, response) => {
        const result = await settled(await apiActions.reviewResponse(id, response));
        if (result.ok) setReviews((list) => list.map((review) => (review.id === id && !review.response ? { ...review, response } : review)));
        return result;
      },
      report: async (target, reason, details) => {
        const result = await settled(await apiActions.report(target, reason, details));
        if (result.ok) setReports((list) => [...list, `${target}: ${reason}. ${details}`]);
        return result;
      },
      spendAi: () => {
        if (session.aiUsed >= entitlements.aiCredits) return { ok: false, reason: 'No AI assists left on this plan. You can still write the text yourself.' };
        setSession((current) => ({ ...current, aiUsed: current.aiUsed + 1 }));
        return { ok: true };
      },
    };
  }, [session, restored, plans, categories, providers, offerings, requests, proposals, leads, conversations, notifications, reviews, outcomes, templates, favorites, preferences, notify, quoteDraft, days, reports, views]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useApp() {
  const value = useContext(Ctx);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
