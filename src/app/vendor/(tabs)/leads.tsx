import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useDispatch } from 'react-redux';

import { API_ENABLED, api, type ApiRecord, useGetLeadsQuery, useGetProposalQuery, useWithdrawProposalMutation } from '@/api';
import { recordOf, rowsOf, textOf } from '@/api/mappers';
import { requestDate, requestGuestLabel, requestRecord, requestReference, requestTitle } from '@/components/RequestBrief';
import { euro } from '@/data/format';
import { Badge } from '@/flow2/components/Badge';
import { Button } from '@/flow2/components/Button';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Icon } from '@/flow2/components/Icon';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';
import { SectionTitle } from '@/flow2/components/SectionTitle';
import { palette } from '@/flow2/constants/theme';
import { b } from '@/flow2/data/options';
import type { Lang } from '@/flow2/data/types';
import { useApp } from '@/flow2/state/app';
import { leading, useType } from '@/hooks/use-type';
import { useApp as useSession } from '@/state/store';

export default function VendorLeadsScreen() {
  const { t, lang } = useApp();
  const tx = (en: string) => t({ en, nl: en });
  const { session, restored } = useSession();
  const enabled = API_ENABLED && restored && session.signedIn && session.mode === 'provider';
  const { view: routeView } = useLocalSearchParams<{ view?: string | string[] }>();
  const requestedView = Array.isArray(routeView) ? routeView[0] : routeView;
  const view = requestedView === 'proposals' ? 'proposals' : 'requests';
  const query = useGetLeadsQuery(undefined, { skip: !enabled });
  const sentQuery = useGetLeadsQuery('sent', { skip: !enabled || view !== 'proposals' });
  // Request contact is paused for now.
  // const releases = useGetContactReleasesQuery(undefined, { skip: !enabled || view !== 'proposals' });
  // const [getContactRelease, contactResult] = useGetContactReleaseMutation();
  const [withdrawProposal, withdrawState] = useWithdrawProposalMutation();
  // const [contact, setContact] = useState<ApiRecord | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  // const [contactError, setContactError] = useState('');
  const [withdrawingId, setWithdrawingId] = useState('');
  const [withdrawnRows, setWithdrawnRows] = useState<ApiRecord[]>([]);
  const type = useType();
  const dispatch = useDispatch();
  const leads = rowsOf(query.data);
  const isSent = (lead: ApiRecord) => !!(lead.proposal || lead.proposal_id || ['sent', 'proposal', 'submitted', 'withdrawn'].includes(String(lead.status ?? '').toLowerCase()));
  const incoming = leads.filter((lead) => !isSent(lead));
  const sent = rowsOf(sentQuery.data);
  const sentIds = new Set(sent.map((lead) => proposalIdOf(lead)).filter(Boolean));
  const proposals = [...sent, ...withdrawnRows.filter((lead) => !sentIds.has(proposalIdOf(lead)))];
  const proposalCount = view === 'proposals' && sentQuery.isSuccess ? proposals.length : leads.filter(isSent).length;

  const onWithdraw = async (proposalId: string) => {
    if (!proposalId) return;
    setNotice('');
    setError('');
    setWithdrawingId(proposalId);
    try {
      await withdrawProposal(proposalId).unwrap();
      const row = sent.find((lead) => proposalIdOf(lead) === proposalId);
      if (row) {
        const proposal = row.proposal && typeof row.proposal === 'object' ? row.proposal as ApiRecord : {};
        setWithdrawnRows((current) => [{ ...row, proposal: { ...proposal, status: 'withdrawn' }, status: 'withdrawn' }, ...current.filter((lead) => proposalIdOf(lead) !== proposalId)]);
      }
      setNotice(t(b('Voorstel ingetrokken.', 'Proposal withdrawn.')));
      void sentQuery.refetch();
      void query.refetch();
    } catch (cause) {
      const message = cause && typeof cause === 'object' && 'message' in cause && typeof cause.message === 'string' && cause.message.trim()
        ? cause.message
        : t(b('Voorstel kon niet worden ingetrokken.', 'Could not withdraw this proposal.'));
      setError(message);
    } finally {
      setWithdrawingId('');
    }
  };

  const refresh = () => {
    const jobs = [query.refetch()];
    if (view === 'proposals') {
      jobs.push(sentQuery.refetch());
      dispatch(api.util.invalidateTags(['Proposal']));
    }
    void Promise.all(jobs);
  };

  return (
    <Screen
      loading={enabled && (view === 'proposals' ? sentQuery.isLoading : query.isLoading)}
      refreshing={enabled && (query.isFetching || sentQuery.isFetching) && !(query.isLoading || sentQuery.isLoading)}
      onRefresh={enabled ? refresh : undefined}
      header={<Header title={t(b('Requests', 'Requests'))} subtitle={t(b('Requests and your sent proposals', 'Requests and your sent proposals'))} />}>
      <View style={styles.switcher}>
        <Button label={`Incoming (${incoming.length})`} variant={view === 'requests' ? 'primary' : 'secondary'} onPress={() => router.setParams({ view: 'requests' })} style={styles.switchButton} labelStyle={{ fontSize: type.caption, lineHeight: leading(type.caption, 4) }} />
        <Button label={`Proposals (${proposalCount})`} variant={view === 'proposals' ? 'primary' : 'secondary'} onPress={() => router.setParams({ view: 'proposals' })} style={styles.switchButton} labelStyle={{ fontSize: type.caption, lineHeight: leading(type.caption, 4) }} />
      </View>

      {view === 'requests' ? (
        <>
          {!enabled ? <EmptyState icon="inbox" title={tx('Vendor API unavailable')} body={tx('Sign in as a vendor and enable the API to load server requests.')} /> : null}
          {query.isError ? <Text>Could not load requests from the server.</Text> : null}
          {query.isSuccess && incoming.length === 0 ? <EmptyState icon="inbox" title={t(b('Geen aanvragen', 'No requests'))} body={t(b('De server heeft geen aanvragen teruggegeven.', 'The server returned no requests.'))} /> : null}
          {query.isSuccess ? incoming.map((lead) => <ApiLeadCard key={rowId(lead)} lead={lead} lang={lang} />) : null}
        </>
      ) : (
        <>
          <SectionTitle title={t(b('Verzonden voorstellen', 'Sent proposals'))} />
          {notice ? <Notice tone="success" body={notice} /> : null}
          {error ? <Notice tone="error" body={error} /> : null}
          {!enabled ? <EmptyState icon="send" title={tx('Vendor API unavailable')} body={tx('Sign in as a vendor and enable the API to load proposals.')} /> : null}
          {sentQuery.isError ? <Notice tone="error" body="Could not load proposals from the server." /> : null}
          {sentQuery.isSuccess && proposals.length === 0 ? <EmptyState icon="send" title={t(b('Nog geen voorstellen', 'No proposals yet'))} body={t(b('De server heeft geen voorstellen teruggegeven.', 'The server returned no proposals.'))} /> : null}
          {sentQuery.isSuccess ? proposals.map((lead) => (
            <SentProposalCard
              key={String(lead.lead_id ?? lead.id ?? lead.request_id)}
              row={lead}
              withdrawing={withdrawState.isLoading && withdrawingId === proposalIdOf(lead)}
              onWithdraw={onWithdraw}
            />
          )) : null}

          <SectionTitle title={t(b('Klantreacties', 'Customer responses'))} />
          {proposals.map((lead) => (
            <CustomerAnswer key={`answer-${proposalIdOf(lead) || rowId(lead)}`} proposalId={proposalIdOf(lead)} title={proposalTitle(lead)} />
          ))}

          {/* Request contact is paused for now.
          <SectionTitle title={t(b('Vrijgegeven contacten', 'Released contacts'))} />
          {contactError ? <Notice tone="error" body={contactError} /> : null}
          {releases.isError ? <Notice tone="error" body="Could not load released contacts from the server." /> : null}
          {rowsOf(releases.data).map((row, index) => {
            const releaseId = row.contact_release_id ?? row.id;
            const requestId = row.request_id;
            const key = String(releaseId ?? requestId ?? index);
            return (
              <Card key={key}>
                <Text style={[styles.ref, { fontSize: type.secondary }]}>{textOf(row, 'reference', 'request_reference') || `Request ${String(requestId ?? key)}`}</Text>
                <Text style={[styles.metaText, { fontSize: type.caption }]}>{t(b('Contact is available after customer consent.', 'Contact is available after customer consent.'))}</Text>
                <Button
                  label={t(b('Bekijk vrijgegeven contact', 'View released contact'))}
                  variant="secondary"
                  loading={contactResult.isLoading}
                  onPress={async () => {
                    setContactError('');
                    try {
                      const result = await getContactRelease(releaseId !== undefined
                        ? { contact_release_id: releaseId as string | number }
                        : { request_id: requestId as string | number }).unwrap();
                      setContact(result);
                    } catch (cause) {
                      setContact(null);
                      const message = cause && typeof cause === 'object' && 'message' in cause && typeof cause.message === 'string' && cause.message.trim()
                        ? cause.message
                        : 'Could not load this contact.';
                      setContactError(message);
                    }
                  }}
                />
              </Card>
            );
          })}
          {contact ? (
            <Card>
              <Text style={[styles.ref, { fontSize: type.secondary }]}>{textOf(contact, 'name', 'full_name', 'contact_name')}</Text>
              <Text style={[styles.metaText, { fontSize: type.caption }]}>{[textOf(contact, 'email'), textOf(contact, 'phone', 'phone_number')].filter(Boolean).join(' · ')}</Text>
            </Card>
          ) : null}
          {releases.isSuccess && rowsOf(releases.data).length === 0 ? <EmptyState icon="chat" title="No released contacts" body="The server returned no customer contact releases." /> : null}
          */}
        </>
      )}
    </Screen>
  );
}

function rowId(row: ApiRecord) {
  return String(row.lead_id ?? row.id ?? row.request_id ?? '');
}

function proposalIdOf(row: ApiRecord) {
  const proposal = row.proposal && typeof row.proposal === 'object' ? row.proposal as ApiRecord : row;
  return String(row.proposal_id ?? proposal.id ?? proposal.proposal_id ?? '');
}

function ApiLeadCard({ lead, lang }: { lead: ApiRecord; lang: Lang }) {
  const { t } = useApp();
  const tx = (en: string) => t({ en, nl: en });
  const id = rowId(lead);
  const request = requestRecord(lead) ?? lead;
  const type = useType();
  const title = requestTitle(request, lang);
  const status = textOf(lead, 'status', 'availability_status') || 'new';
  const guests = requestGuestLabel(request.guest_count ?? request.guests, lang);
  const date = requestDate(textOf(request, 'event_date', 'date'), lang);
  const city = textOf(request, 'city') || '';
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={[styles.ref, { fontSize: type.cardTitle }]} numberOfLines={2}>{title}</Text>
          <Text style={[styles.provider, { fontSize: type.caption }]} numberOfLines={1}>{requestReference(request, id)}</Text>
        </View>
        <Badge label={status} tone="accent" />
      </View>
      <View style={styles.metaRow}><Icon name="people" color={palette.muted} size={type.caption} /><Text style={[styles.metaText, { fontSize: type.caption }]}>{[guests, city].filter(Boolean).join(' · ')}</Text></View>
      <View style={styles.metaRow}><Icon name="calendar" color={palette.muted} size={type.caption} /><Text style={[styles.metaText, { fontSize: type.caption }]}>{date}</Text></View>
      <Button label={tx('Review request')} variant="secondary" onPress={() => router.push(`/vendor/lead/${id}` as any)} style={styles.action} />
    </View>
  );
}

function proposalTitle(row: ApiRecord) {
  const request = row.request && typeof row.request === 'object' ? row.request as ApiRecord : row;
  const id = String(row.lead_id ?? row.id ?? row.request_id ?? '');
  return textOf(row, 'reference', 'request_reference') || textOf(request, 'event_type', 'occasion') || `Request ${id}`;
}

function answerOf(...records: (ApiRecord | null | undefined)[]) {
  for (const record of records) {
    if (!record) continue;
    const response = (textOf(record, 'response', 'customer_response') ?? '').toLowerCase();
    const status = (textOf(record, 'status', 'proposal_status') ?? '').toLowerCase();
    if (response === 'interested' || status === 'interested') return 'interested' as const;
    if (response === 'rejected' || status === 'rejected') return 'rejected' as const;
    if (status === 'withdrawn') return 'withdrawn' as const;
  }
  return 'sent' as const;
}

function answerLabel(answer: ReturnType<typeof answerOf>) {
  if (answer === 'interested') return 'Interested';
  if (answer === 'rejected') return 'Rejected';
  if (answer === 'withdrawn') return 'Withdrawn';
  return 'Sent';
}

function answerTone(answer: ReturnType<typeof answerOf>): 'good' | 'bad' | 'warn' | 'accent' {
  if (answer === 'interested') return 'good';
  if (answer === 'rejected') return 'bad';
  if (answer === 'withdrawn') return 'warn';
  return 'accent';
}

function CustomerAnswer({ proposalId, title }: { proposalId: string; title: string }) {
  const type = useType();
  const query = useGetProposalQuery(proposalId, { skip: !proposalId });
  const detail = recordOf(query.data, 'proposal');
  const answer = answerOf(detail, query.data && typeof query.data === 'object' ? query.data as ApiRecord : null);
  if (!proposalId || query.isLoading || query.isError || (answer !== 'interested' && answer !== 'rejected')) return null;
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={[styles.ref, { fontSize: type.cardTitle }]} numberOfLines={2}>{title}</Text>
          <Text style={[styles.provider, { fontSize: type.caption }]}>Customer answer</Text>
        </View>
        <Badge label={answerLabel(answer)} tone={answerTone(answer)} />
      </View>
    </View>
  );
}

function SentProposalCard({ row, withdrawing, onWithdraw }: { row: ApiRecord; withdrawing: boolean; onWithdraw: (proposalId: string) => void }) {
  const { t } = useApp();
  const tx = (en: string) => t({ en, nl: en });
  const type = useType();
  const id = String(row.lead_id ?? row.id ?? row.request_id ?? '');
  const nestedProposal = row.proposal && typeof row.proposal === 'object' ? row.proposal as ApiRecord : row;
  const request = row.request && typeof row.request === 'object' ? row.request as ApiRecord : row;
  const proposalId = proposalIdOf(row);
  const proposalQuery = useGetProposalQuery(proposalId, { skip: !proposalId });
  const detail = recordOf(proposalQuery.data, 'proposal');
  const proposal = detail ?? nestedProposal;
  const title = proposalTitle(row);
  const total = proposal.total_cents == null ? null : Number(proposal.total_cents);
  const answer = answerOf(detail, proposalQuery.data && typeof proposalQuery.data === 'object' ? proposalQuery.data as ApiRecord : null, nestedProposal, row);
  const withdrawn = answer === 'withdrawn';
  const reference = textOf(request, 'reference') || requestReference(request, id);
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={[styles.ref, { fontSize: type.cardTitle }]} numberOfLines={2}>{title}</Text>
          <Text style={[styles.provider, { fontSize: type.caption }]} numberOfLines={1}>{reference}</Text>
        </View>
        <Badge label={answerLabel(answer)} tone={answerTone(answer)} />
      </View>
      {Number.isFinite(total) ? <Text style={[styles.metaText, { fontSize: type.caption }]}>{euro(total)}</Text> : null}
      {answer === 'interested' || answer === 'rejected' ? <Text style={[styles.answer, { fontSize: type.caption }]}>{answer === 'interested' ? 'The customer is interested in this proposal.' : 'The customer rejected this proposal.'}</Text> : <Text style={[styles.metaText, { fontSize: type.caption }]}>Waiting for the customer’s answer.</Text>}
      {proposalQuery.isError ? <Text style={[styles.metaText, { fontSize: type.caption }]}>{textOf(proposalQuery.error as ApiRecord, 'message') || 'Could not load the customer answer.'}</Text> : null}
      <Button label={tx('View request')} variant="secondary" onPress={() => router.push(`/vendor/lead/${id}` as any)} style={styles.action} />
      {!withdrawn && proposalId ? <Button label={tx('Withdraw proposal')} variant="danger" loading={withdrawing} onPress={() => onWithdraw(proposalId)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.line, padding: 14, gap: 8 },
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  headText: { flex: 1, gap: 2 },
  ref: { fontWeight: '800', color: palette.ink },
  provider: { color: palette.muted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { flex: 1, color: palette.muted },
  answer: { color: palette.ink, fontWeight: '600' },
  action: { minHeight: 42, alignSelf: 'stretch' },
  switcher: { flexDirection: 'row', gap: 8 },
  switchButton: { flex: 1, minHeight: 40, paddingHorizontal: 8 },
});
