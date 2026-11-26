import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useDispatch } from 'react-redux';

import { API_ENABLED, api, useGetProposalsQuery, useGetRequestsQuery } from '@/api';
import { rowsOf } from '@/api/mappers';
import type { ApiRecord } from '@/api/types';
import { isPastRequest, readableStatus, requestDate, requestGuestLabel, requestReference, requestStatus, requestTitle } from '@/components/RequestBrief';
import { euro } from '@/data/format';
import { Badge } from '@/flow2/components/Badge';
import { Button } from '@/flow2/components/Button';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Icon, type IconName } from '@/flow2/components/Icon';
import { Screen } from '@/flow2/components/Screen';
import { palette, radius, spacing } from '@/flow2/constants/theme';
import { b } from '@/flow2/data/options';
import { useApp } from '@/flow2/state/app';
import { leading, useType } from '@/hooks/use-type';

export default function RequestsScreen() {
  const { t } = useApp();
  const type = useType();
  const [filter, setFilter] = useState<'active' | 'past'>('active');
  const requestsQuery = useGetRequestsQuery(undefined, { skip: !API_ENABLED });
  const dispatch = useDispatch();
  const requests = rowsOf(requestsQuery.data).filter((row) => String(row.status ?? '').toLowerCase() !== 'draft');
  const shown = requests.filter((row) => (filter === 'past') === isPastRequest(String(row.status ?? '')));
  const refresh = () => {
    void requestsQuery.refetch();
    dispatch(api.util.invalidateTags(['Proposal']));
  };

  return (
    <Screen
      loading={requestsQuery.isLoading}
      refreshing={requestsQuery.isFetching && !requestsQuery.isLoading}
      onRefresh={refresh}
      canvas={palette.bg}
      header={<Header title={t(b('Mijn aanvragen', 'My requests'))} subtitle={t(b('Volg uitnodigingen, voorstellen en deadlines.', 'Track invitations, proposals and deadlines.'))} back />}>
      {requests.length > 0 ? (
        <View style={styles.filters}>
          {(['active', 'past'] as const).map((item) => (
            <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: filter === item }} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterOn]}>
              <Text style={[styles.filterText, filter === item && styles.filterTextOn, { fontSize: type.caption }]}>{item === 'active' ? t(b('Actief', 'Active')) : t(b('Geannuleerd', 'Cancelled'))}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {!API_ENABLED ? <EmptyState icon="doc" title={t(b('API niet beschikbaar', 'API unavailable'))} body={t(b('Configureer de API om aanvragen te laden.', 'Configure the API to load requests.'))} /> : shown.length === 0 ? (
        <EmptyState icon="doc" title={requests.length === 0 ? t(b('Nog geen aanvragen', 'No requests yet')) : t(b('Niets in deze lijst', 'Nothing in this list'))} body={requests.length === 0 ? t(b('Start een aanvraag en ontvang voorstellen.', 'Start a request and receive proposals.')) : t(b('Er zijn geen aanvragen met deze status.', 'There are no requests with this status.'))} />
      ) : shown.map((request, index) => <RequestItem key={String(request.request_id ?? request.id ?? index)} request={request} />)}
    </Screen>
  );
}

function RequestItem({ request }: { request: ApiRecord }) {
  const { t, lang } = useApp();
  const type = useType();
  const [open, setOpen] = useState(false);
  const requestId = String(request.request_id ?? request.id ?? '');
  const proposalsQuery = useGetProposalsQuery(requestId, { skip: !API_ENABLED || !requestId });
  const proposals = rowsOf(proposalsQuery.data);
  const statusKey = String(request.status ?? '').toLowerCase();
  const status = requestStatus(statusKey);
  const title = requestTitle(request, lang);
  const past = isPastRequest(statusKey);
  const visible = open || proposals.length <= 2 ? proposals : proposals.slice(0, 2);
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" onPress={() => router.push(`/customer/request/${requestId}` as never)} style={styles.overview}>
        <View style={styles.iconBox}><Icon name={eventIcon(request)} color={palette.accentDark} size={16} /></View>
        <View style={styles.overviewCopy}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { fontSize: type.cardTitle, lineHeight: leading(type.cardTitle, 4) }]} numberOfLines={2}>{title}</Text>
            {status ? <Badge label={t(status)} tone={status.tone} /> : statusKey ? <Badge label={readableStatus(statusKey)} /> : null}
          </View>
          <Text style={[styles.meta, { fontSize: type.caption }]}>{requestReference(request, requestId)}</Text>
          <Text style={[styles.meta, { fontSize: type.caption, lineHeight: leading(type.caption, 4) }]}>{[requestDate(value(request, 'event_date', 'date'), lang), requestGuestLabel(request.guest_count ?? request.guests, lang), value(request, 'city')].filter(Boolean).join(' · ')}</Text>
          <Text style={[styles.count, { fontSize: type.caption }]}>{proposalsQuery.isLoading ? t(b('Voorstellen laden…', 'Loading proposals…')) : proposalCount(proposals.length, past, t)}</Text>
          <Text style={[styles.link, { fontSize: type.caption }]}>{t(b('Details bekijken', 'View details'))}</Text>
        </View>
      </Pressable>
      <View style={styles.proposals}>
        <Text style={[styles.proposalHeading, { fontSize: type.caption }]}>{t(b('Ontvangen voorstellen', 'Received proposals'))}</Text>
        {proposalsQuery.isLoading ? null : proposals.length === 0 ? (
          <Text style={[styles.meta, { fontSize: type.secondary, lineHeight: leading(type.secondary, 5) }]}>{emptyProposals(statusKey, t)}</Text>
        ) : visible.map((proposal, index) => {
          const proposalId = String(proposal.proposal_id ?? proposal.id ?? '');
          const providerId = value(proposal, 'provider_id', 'vendor_id');
          const providerName = value(proposal, 'provider_name', 'business_name', 'name') || t(b('Voorstel', 'Proposal'));
          const proposalStatus = requestStatus(String(proposal.status ?? '').toLowerCase());
          const canReview = eventHasPassed(value(request, 'event_date', 'date')) && continuedWith(request, proposal, providerId) && !alreadyReviewed(proposal);
          const photo = value(proposal, 'photo', 'logo', 'image', 'avatar');
          return (
            <View key={proposalId || index} style={styles.proposal}>
              <Pressable accessibilityRole="button" disabled={!proposalId} onPress={() => router.push(`/customer/proposal/${proposalId}` as never)} style={styles.proposalRow}>
                {photo.startsWith('http') || photo.startsWith('data:image') ? <Image source={{ uri: photo }} style={styles.avatar} /> : <View style={styles.avatar}><Text style={styles.initials}>{initials(providerName)}</Text></View>}
                <View style={styles.proposalCopy}>
                  <Text style={[styles.proposalName, { fontSize: type.body }]} numberOfLines={1}>{providerName}</Text>
                  <Text style={[styles.meta, { fontSize: type.caption }]} numberOfLines={2}>{[proposalPrice(proposal), availabilityLabel(proposal, t)].filter(Boolean).join(' · ')}</Text>
                  {proposalStatus ? <Badge label={t(proposalStatus)} tone={proposalStatus.tone} /> : null}
                </View>
                <Icon name="chevron" color={palette.muted} size={16} />
              </Pressable>
              {canReview && providerId ? <Button label={t(b('Schrijf een review', 'Write a review'))} variant="outline" onPress={() => router.push({ pathname: '/customer/review', params: { providerId, requestId, providerName } })} style={styles.review} /> : null}
            </View>
          );
        })}
        {proposals.length > 2 ? (
          <Pressable accessibilityRole="button" onPress={() => setOpen((current) => !current)} style={styles.more}>
            <Text style={[styles.link, { fontSize: type.caption }]}>{open ? t(b('Minder tonen', 'Show less')) : t(b(`${proposals.length - 2} meer tonen`, `Show ${proposals.length - 2} more`))}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function proposalCount(count: number, past: boolean, t: (value: { nl: string; en: string }) => string) {
  if (count === 0) return past ? t(b('Geen voorstellen', 'No proposals')) : t(b('Nog geen voorstellen', 'No proposals yet'));
  return count === 1 ? t(b('1 voorstel', '1 proposal')) : t(b(`${count} voorstellen`, `${count} proposals`));
}

function emptyProposals(status: string, t: (value: { nl: string; en: string }) => string) {
  if (isPastRequest(status)) return t(b('Voor deze aanvraag zijn geen voorstellen ontvangen.', 'No proposals were received for this request.'));
  return t(b('Wachten op voorstellen van cateraars.', 'Waiting for proposals from caterers.'));
}

function eventIcon(request: ApiRecord): IconName {
  const type = String(request.event_type ?? request.occasion ?? '').toLowerCase();
  if (type.includes('wedding')) return 'heart';
  if (type.includes('business')) return 'store';
  return 'party';
}

function availabilityLabel(proposal: ApiRecord, t: (value: { nl: string; en: string }) => string) {
  const value = String(proposal.availability ?? proposal.availability_status ?? '').toLowerCase();
  if (value === 'available') return t(b('Beschikbaar', 'Available'));
  if (value === 'partial') return t(b('Deels beschikbaar', 'Partly available'));
  if (value === 'maybe') return t(b('Nog nakijken', 'Need to check'));
  if (value === 'unavailable') return t(b('Niet beschikbaar', 'Unavailable'));
  return '';
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'C';
}

function value(row: ApiRecord, ...keys: string[]) { for (const key of keys) { const item = row[key]; if (typeof item === 'string' || typeof item === 'number') return String(item); } return ''; }

function proposalPrice(proposal: ApiRecord) {
  const cents = Number(proposal.total_cents ?? proposal.price_cents ?? proposal.amount_cents);
  if (!Number.isFinite(cents) || cents <= 0) return '';
  return euro(cents);
}

function eventHasPassed(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!match) return false;
  const event = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return event.getTime() < today.getTime();
}

function isOn(value: unknown) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

function continuedWith(request: ApiRecord, proposal: ApiRecord, providerId: string) {
  if (isOn(proposal.contact_released) || isOn(proposal.continued)) return true;
  const status = String(proposal.status ?? '').toLowerCase();
  if (['continued', 'contact', 'contact_released', 'released'].includes(status)) return true;
  const ids = request.contact_provider_ids ?? request.released_provider_ids;
  return Array.isArray(ids) && ids.map(String).includes(providerId);
}

function alreadyReviewed(proposal: ApiRecord) {
  return isOn(proposal.reviewed) || Boolean(value(proposal, 'review_id'));
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', gap: spacing.sm },
  filter: { minHeight: 36, paddingHorizontal: spacing.md, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  filterOn: { backgroundColor: palette.accent, borderColor: palette.accent },
  filterText: { color: palette.inkSecondary, fontWeight: '600' },
  filterTextOn: { color: palette.white },
  card: { borderRadius: radius.lg, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, overflow: 'hidden' },
  overview: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
  iconBox: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.line },
  overviewCopy: { flex: 1, minWidth: 0, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  title: { flex: 1, color: palette.ink, fontWeight: '600' },
  meta: { color: palette.muted, fontWeight: '400' },
  count: { color: palette.inkSecondary, fontWeight: '500', marginTop: 2 },
  link: { color: palette.accentDark, fontWeight: '600' },
  proposals: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line },
  proposalHeading: { color: palette.inkSecondary, fontWeight: '600', marginTop: spacing.sm },
  proposal: { gap: spacing.sm, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line },
  proposalRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.well, alignItems: 'center', justifyContent: 'center' },
  initials: { color: palette.accentDark, fontWeight: '700' },
  proposalCopy: { flex: 1, minWidth: 0, gap: 2 },
  proposalName: { color: palette.ink, fontWeight: '600' },
  review: { minHeight: 40 },
  more: { minHeight: 36, justifyContent: 'center' },
});
