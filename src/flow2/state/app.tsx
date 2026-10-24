import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { VENDOR_PACKAGES, type VendorPackage } from '@/flow2/data/packages';
import { buildProposals, initialDraft, initialOnboarding, PROVIDERS, SAMPLE_REQUEST } from '@/flow2/data/seed';
import { useApp as useSession } from '@/state/store';
import type {
  Bilingual,
  FlowChatMessage,
  Lang,
  Lead,
  MenuItem,
  OnboardingDraft,
  Proposal,
  ProposalStatus,
  Provider,
  RequestDraft,
} from '@/flow2/data/types';

type Patch = Partial<RequestDraft>;
export type CustomerAccount = { name: string; email: string; phone: string; photo?: string; emailRequired?: boolean };

interface AppValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (value: Bilingual | string) => string;

  role: 'customer' | 'vendor';
  setRole: (role: 'customer' | 'vendor') => void;
  customerAccount: CustomerAccount | null;
  setCustomerAccount: (account: CustomerAccount | null) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;

  providers: Provider[];
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id' | 'active'>) => void;
  packages: VendorPackage[];
  addPackage: (item: Omit<VendorPackage, 'id'>) => void;
  toggleMenuItem: (id: string) => void;
  chatMessages: Record<string, FlowChatMessage[]>;
  addChatMessage: (conversationId: string, message: FlowChatMessage) => void;

  draft: RequestDraft;
  patchDraft: (patch: Patch) => void;
  patchCount: (key: keyof RequestDraft['counts'], value: number) => void;
  patchTask: (key: keyof RequestDraft['tasks'], value: 'no' | 'yes') => void;
  resetDraft: () => void;
  submitDraft: () => RequestDraft;

  requests: RequestDraft[];
  proposalsFor: (requestId: string) => Proposal[];
  setProposalStatus: (id: string, status: ProposalStatus) => void;
  releaseContact: (id: string) => void;

  onboarding: OnboardingDraft;
  patchOnboarding: (patch: Partial<OnboardingDraft>) => void;
  resetOnboarding: () => void;
  submitOnboarding: () => boolean;
  approveOnboarding: () => void;
  rejectOnboarding: (reason: string) => void;

  leads: Lead[];
  sendVendorProposal: (
    leadId: string,
    data: { availability: Proposal['availability']; total: number; perGuest: number; deposit: number; validUntil: string },
  ) => void;
  setLeadStatus: (leadId: string, status: Lead['status']) => void;
}

const AppContext = createContext<AppValue | null>(null);
const PROFILE_KEY = 'flow2Profile';
let profileWrite = 0;

function storedImage(uri: string | undefined) {
  if (!uri || uri.startsWith('data:')) return undefined;
  return uri;
}

const seedLeads = (): Lead[] => [
  { id: 'LEAD-royal', providerId: 'royal', reference: 'DEMO-001', request: SAMPLE_REQUEST, status: 'invited', deadlineHours: 24, quality: 92 },
  { id: 'LEAD-tasty', providerId: 'tasty', reference: 'DEMO-001', request: SAMPLE_REQUEST, status: 'opened', deadlineHours: 24, quality: 78 },
  { id: 'LEAD-hospitality', providerId: 'hospitality', reference: 'DEMO-001', request: SAMPLE_REQUEST, status: 'invited', deadlineHours: 24, quality: 85 },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { session, restored: sessionRestored } = useSession();
  const [lang, setLang] = useState<Lang>('en');
  const [role, setRole] = useState<'customer' | 'vendor'>('customer');
  const [customerAccount, setCustomerAccount] = useState<CustomerAccount | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [draft, setDraft] = useState<RequestDraft>(() => initialDraft());
  const [requests, setRequests] = useState<RequestDraft[]>(() => [{ ...SAMPLE_REQUEST }]);
  const [proposalMap, setProposalMap] = useState<Record<string, Proposal[]>>(() => ({ [SAMPLE_REQUEST.id]: buildProposals(SAMPLE_REQUEST) }));
  const [onboarding, setOnboarding] = useState<OnboardingDraft>(() => ({ ...initialOnboarding }));
  const [leads, setLeads] = useState<Lead[]>(seedLeads);
  const [packages, setPackages] = useState<VendorPackage[]>(VENDOR_PACKAGES);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: 'menu-1', name: 'Surinamese buffet', description: 'Rice, chicken, vegetables and sides. Customisable for your event.', price: 28, active: true },
    { id: 'menu-2', name: 'Vegetarian buffet', description: 'A generous selection of warm vegetarian dishes.', price: 24, active: true },
  ]);
  const [chatMessages, setChatMessages] = useState<Record<string, FlowChatMessage[]>>({});
  const [profileReady, setProfileReady] = useState(false);
  const wasSignedIn = useRef(false);

  useEffect(() => {
    let alive = true;
    void AsyncStorage.getItem(PROFILE_KEY).then((raw) => {
      if (!alive) return;
      if (raw) {
        try {
          const saved = JSON.parse(raw) as { role?: 'customer' | 'vendor'; customerAccount?: CustomerAccount | null; onboarding?: Partial<OnboardingDraft> };
          if (saved.role === 'customer' || saved.role === 'vendor') setRole(saved.role);
          if (saved.customerAccount) setCustomerAccount(saved.customerAccount);
          if (saved.onboarding) setOnboarding((current) => ({ ...current, ...saved.onboarding, password: '' }));
        } catch {
          // A broken profile just starts from the current login.
        }
      }
      setProfileReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!sessionRestored || !profileReady) return;
    if (session.signedIn) {
      wasSignedIn.current = true;
      setRole(session.mode === 'provider' ? 'vendor' : 'customer');
      setCustomerAccount((current) => current ?? (session.name || session.email || session.phone ? { name: session.name, email: session.email, phone: session.phone } : null));
      return;
    }
    if (!wasSignedIn.current) return;
    wasSignedIn.current = false;
    profileWrite += 1;
    setRole('customer');
    setCustomerAccount(null);
    setOnboarding({ ...initialOnboarding });
  }, [sessionRestored, profileReady, session.signedIn, session.mode, session.name, session.email, session.phone]);

  useEffect(() => {
    if (!profileReady || !sessionRestored || !session.signedIn) return;
    const write = ++profileWrite;
    const savedOnboarding = { ...onboarding, password: '', profileImageUri: storedImage(onboarding.profileImageUri) };
    void AsyncStorage.setItem(PROFILE_KEY, JSON.stringify({ role, customerAccount, onboarding: savedOnboarding })).then(() => {
      if (write !== profileWrite) void AsyncStorage.removeItem(PROFILE_KEY);
    });
  }, [profileReady, sessionRestored, session.signedIn, role, customerAccount, onboarding]);

  const customerProviders = useMemo(() => {
    if (onboarding.status !== 'approved' || !onboarding.profileName.trim()) return PROVIDERS;
    const own: Provider = {
      id: 'my-vendor',
      name: onboarding.profileName,
      photo: onboarding.profileImageUri,
      cuisine: { nl: onboarding.cuisines.join(' · ') || 'Catering', en: onboarding.cuisines.join(' · ') || 'Catering' },
      city: onboarding.city || 'Netherlands',
      radiusKm: onboarding.radius,
      fromPrice: Number(onboarding.fromPrice) || 0,
      rating: 0,
      reviews: 0,
      vegetarian: onboarding.capabilities.includes('vegetarian') ? 'full' : 'mixed',
      halal: onboarding.capabilities.includes('halal'),
      vegan: onboarding.capabilities.includes('vegan'),
      fulfilment: [onboarding.delivery && 'delivery', onboarding.pickup && 'pickup', onboarding.onsite && 'onsite'].filter(Boolean) as Provider['fulfilment'],
      capabilities: onboarding.capabilities,
      description: { nl: onboarding.description, en: onboarding.description },
      plan: 'gold',
      approved: true,
    };
    return [own, ...PROVIDERS];
  }, [onboarding]);

  const t = useCallback((value: Bilingual | string) => (typeof value === 'string' ? value : value[lang]), [lang]);
  const toggleLang = useCallback(() => setLang((current) => (current === 'nl' ? 'en' : 'nl')), []);

  const patchDraft = useCallback((patch: Patch) => setDraft((current) => ({ ...current, ...patch })), []);
  const patchCount = useCallback(
    (key: keyof RequestDraft['counts'], value: number) => setDraft((current) => ({ ...current, counts: { ...current.counts, [key]: value } })),
    [],
  );
  const patchTask = useCallback(
    (key: keyof RequestDraft['tasks'], value: 'no' | 'yes') => setDraft((current) => ({ ...current, tasks: { ...current.tasks, [key]: value } })),
    [],
  );
  const resetDraft = useCallback(() => setDraft({ ...initialDraft() }), []);

  const submitDraft = useCallback(() => {
    const submitted: RequestDraft = {
      ...draft,
      reference: draft.providerId ? 'DIRECT-002' : 'DEMO-002',
      status: draft.providerId ? 'collecting' : 'proposals',
      consent: true,
      submittedAt: new Date().toISOString(),
    };
    setRequests((current) => [submitted, ...current]);
    setProposalMap((current) => ({ ...current, [submitted.id]: buildProposals(submitted) }));
    const recipients = submitted.providerId
      ? customerProviders.filter((provider) => provider.id === submitted.providerId)
      : customerProviders;
    setLeads((current) => [
      ...recipients.map((provider, index) => ({
        id: `LEAD-${submitted.id}-${provider.id}`,
        providerId: provider.id,
        reference: submitted.reference,
        request: submitted,
        status: 'invited' as const,
        deadlineHours: 24,
        quality: Math.max(65, 94 - index * 4),
      })),
      ...current,
    ]);
    setDraft({ ...initialDraft() });
    return submitted;
  }, [draft, customerProviders]);

  const proposalsFor = useCallback((requestId: string) => proposalMap[requestId] ?? [], [proposalMap]);

  const setProposalStatus = useCallback((id: string, status: ProposalStatus) => {
    setProposalMap((current) => {
      const next: Record<string, Proposal[]> = {};
      for (const [requestId, list] of Object.entries(current)) {
        next[requestId] = list.map((proposal) => (proposal.id === id ? { ...proposal, status } : proposal));
      }
      return next;
    });
  }, []);

  const releaseContact = useCallback((id: string) => {
    setProposalMap((current) => {
      const next: Record<string, Proposal[]> = {};
      for (const [requestId, list] of Object.entries(current)) {
        next[requestId] = list.map((proposal) => (proposal.id === id ? { ...proposal, contactReleased: true, status: 'contact' } : proposal));
      }
      return next;
    });
  }, []);

  const patchOnboarding = useCallback((patch: Partial<OnboardingDraft>) => setOnboarding((current) => ({ ...current, ...patch })), []);
  const resetOnboarding = useCallback(() => setOnboarding({ ...initialOnboarding }), []);
  const submitOnboarding = useCallback(() => {
    // Temporary demo flow: completing onboarding activates the vendor dashboard directly.
    setOnboarding((current) => ({ ...current, status: 'approved' }));
    return true;
  }, []);
  const approveOnboarding = useCallback(() => setOnboarding((current) => ({ ...current, status: 'approved' })), []);
  const rejectOnboarding = useCallback((reason: string) => setOnboarding((current) => ({ ...current, status: 'rejected', adminReason: reason })), []);

  const setLeadStatus = useCallback((leadId: string, status: Lead['status']) => {
    setLeads((current) => current.map((lead) => (lead.id === leadId ? { ...lead, status } : lead)));
  }, []);
  const addPackage = useCallback((item: Omit<VendorPackage, 'id'>) => {
    setPackages((current) => [{ ...item, id: `pkg-${Date.now()}` }, ...current]);
  }, []);
  const addMenuItem = useCallback((item: Omit<MenuItem, 'id' | 'active'>) => {
    setMenuItems((current) => [{ ...item, id: `menu-${Date.now()}`, active: true }, ...current]);
  }, []);
  const toggleMenuItem = useCallback((id: string) => {
    setMenuItems((current) => current.map((item) => item.id === id ? { ...item, active: !item.active } : item));
  }, []);
  const addChatMessage = useCallback((conversationId: string, message: FlowChatMessage) => {
    setChatMessages((current) => {
      const messages = current[conversationId] ?? [];
      if (messages.some((item) => item.id === message.id || (item.sender === message.sender && item.text === message.text && item.imageUri === message.imageUri && Math.abs(item.createdAt - message.createdAt) < 2500))) return current;
      return { ...current, [conversationId]: [...messages, message] };
    });
  }, []);

  const sendVendorProposal = useCallback<AppValue['sendVendorProposal']>((leadId, data) => {
    const lead = leads.find((item) => item.id === leadId);
    if (lead) {
      const template = buildProposals(lead.request).find((proposal) => proposal.providerId === lead.providerId) ?? buildProposals(lead.request)[0];
      const proposal: Proposal = {
        ...template,
        id: `PROP-${lead.request.id}-${lead.providerId}`,
        availability: data.availability,
        total: data.total,
        perGuest: data.perGuest,
        deposit: data.deposit,
        validUntil: data.validUntil,
        status: 'sent',
      };
      setProposalMap((current) => ({
        ...current,
        [lead.request.id]: [...(current[lead.request.id] ?? []).filter((item) => item.providerId !== lead.providerId), proposal],
      }));
    }
    setLeads((current) =>
      current.map((lead) => {
        if (lead.id !== leadId) return lead;
        const template = buildProposals(lead.request).find((proposal) => proposal.providerId === lead.providerId) ?? buildProposals(lead.request)[0];
        const proposal: Proposal = {
          ...template,
          id: `PROP-${lead.providerId}`,
          availability: data.availability,
          total: data.total,
          perGuest: data.perGuest,
          deposit: data.deposit,
          validUntil: data.validUntil,
          status: 'sent',
        };
        return { ...lead, status: 'proposal', proposal };
      }),
    );
  }, [leads]);

  const value = useMemo<AppValue>(
    () => ({
      lang,
      setLang,
      toggleLang,
      t,
      role,
      setRole,
      customerAccount,
      setCustomerAccount,
      notificationsEnabled,
      setNotificationsEnabled,
      providers: customerProviders,
      menuItems,
      addMenuItem,
      packages,
      addPackage,
      toggleMenuItem,
      chatMessages,
      addChatMessage,
      draft,
      patchDraft,
      patchCount,
      patchTask,
      resetDraft,
      submitDraft,
      requests,
      proposalsFor,
      setProposalStatus,
      releaseContact,
      onboarding,
      patchOnboarding,
      resetOnboarding,
      submitOnboarding,
      approveOnboarding,
      rejectOnboarding,
      leads,
      sendVendorProposal,
      setLeadStatus,
    }),
    [
      lang,
      toggleLang,
      t,
      role,
      customerAccount,
      notificationsEnabled,
      draft,
      patchDraft,
      patchCount,
      patchTask,
      resetDraft,
      submitDraft,
      requests,
      proposalsFor,
      setProposalStatus,
      releaseContact,
      onboarding,
      patchOnboarding,
      resetOnboarding,
      submitOnboarding,
      approveOnboarding,
      rejectOnboarding,
      leads,
      customerProviders,
      menuItems,
      addMenuItem,
      packages,
      addPackage,
      toggleMenuItem,
      chatMessages,
      addChatMessage,
      sendVendorProposal,
      setLeadStatus,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
