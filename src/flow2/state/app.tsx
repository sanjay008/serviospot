import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { buildProposals, initialDraft, initialOnboarding, PROVIDERS, SAMPLE_REQUEST } from '@/flow2/data/seed';
import type {
  Bilingual,
  Lang,
  Lead,
  OnboardingDraft,
  Proposal,
  ProposalStatus,
  Provider,
  RequestDraft,
} from '@/flow2/data/types';

type Patch = Partial<RequestDraft>;

interface AppValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (value: Bilingual | string) => string;

  role: 'customer' | 'vendor';
  setRole: (role: 'customer' | 'vendor') => void;

  providers: Provider[];

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

const seedLeads = (): Lead[] => [
  { id: 'LEAD-royal', providerId: 'royal', reference: 'DEMO-001', request: SAMPLE_REQUEST, status: 'invited', deadlineHours: 24, quality: 92 },
  { id: 'LEAD-tasty', providerId: 'tasty', reference: 'DEMO-001', request: SAMPLE_REQUEST, status: 'opened', deadlineHours: 24, quality: 78 },
  { id: 'LEAD-hospitality', providerId: 'hospitality', reference: 'DEMO-001', request: SAMPLE_REQUEST, status: 'invited', deadlineHours: 24, quality: 85 },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('nl');
  const [role, setRole] = useState<'customer' | 'vendor'>('customer');
  const [draft, setDraft] = useState<RequestDraft>(() => initialDraft());
  const [requests, setRequests] = useState<RequestDraft[]>(() => [{ ...SAMPLE_REQUEST }]);
  const [proposalMap, setProposalMap] = useState<Record<string, Proposal[]>>(() => ({ [SAMPLE_REQUEST.id]: buildProposals(SAMPLE_REQUEST) }));
  const [onboarding, setOnboarding] = useState<OnboardingDraft>(() => ({ ...initialOnboarding }));
  const [leads, setLeads] = useState<Lead[]>(seedLeads);

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
    setDraft({ ...initialDraft() });
    return submitted;
  }, [draft]);

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
    setOnboarding((current) => ({ ...current, status: 'pending' }));
    return true;
  }, []);
  const approveOnboarding = useCallback(() => setOnboarding((current) => ({ ...current, status: 'approved' })), []);
  const rejectOnboarding = useCallback((reason: string) => setOnboarding((current) => ({ ...current, status: 'rejected', adminReason: reason })), []);

  const setLeadStatus = useCallback((leadId: string, status: Lead['status']) => {
    setLeads((current) => current.map((lead) => (lead.id === leadId ? { ...lead, status } : lead)));
  }, []);

  const sendVendorProposal = useCallback<AppValue['sendVendorProposal']>((leadId, data) => {
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
  }, []);

  const value = useMemo<AppValue>(
    () => ({
      lang,
      setLang,
      toggleLang,
      t,
      role,
      setRole,
      providers: PROVIDERS,
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
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
