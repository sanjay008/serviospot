import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { API_ENABLED, useGetProposalQuery, useSetProposalResponseMutation } from '@/api';
import { recordOf } from '@/api/mappers';
import type { ApiRecord } from '@/api/types';
import { readableStatus, requestDate, requestGuestLabel, requestStatus } from '@/components/RequestBrief';
import { euro } from '@/data/format';
import { Badge } from '@/flow2/components/Badge';
import { Button } from '@/flow2/components/Button';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';
import { palette, radius, spacing } from '@/flow2/constants/theme';
import { b } from '@/flow2/data/options';
import { useApp } from '@/flow2/state/app';
import { leading, useType } from '@/hooks/use-type';

const PRICE_ROWS: { key: string; nl: string; en: string }[] = [
  { key: 'food_cents', nl: 'Eten', en: 'Food' },
  { key: 'drinks_cents', nl: 'Dranken', en: 'Beverages' },
  { key: 'staff_cents', nl: 'Bediening', en: 'Service staff' },
  { key: 'delivery_cents', nl: 'Bezorging', en: 'Delivery' },
  { key: 'equipment_cents', nl: 'Materiaal', en: 'Equipment' },
  { key: 'other_cents', nl: 'Extra kosten', en: 'Additional charges' },
  { key: 'tax_cents', nl: 'Belasting', en: 'Taxes' },
  { key: 'discount_cents', nl: 'Korting', en: 'Discount' },
];

export default function ProposalDetailScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useApp();
  const type = useType();
  const query = useGetProposalQuery(id, { skip: !API_ENABLED || !id });
  const proposal = recordOf(query.data, 'proposal');
  const request = nested(proposal, 'request');
  const [respond, responseState] = useSetProposalResponseMutation();
  const [confirmReject, setConfirmReject] = useState(false);
  const [error, setError] = useState('');
  const proposalId = String(proposal?.proposal_id ?? proposal?.id ?? id);
  const providerName = text(proposal, 'provider_name', 'business_name', 'name') || t(b('Voorstel', 'Proposal'));
  const statusKey = String(proposal?.status ?? '').toLowerCase();
  const status = requestStatus(statusKey);
  const photo = text(proposal, 'photo', 'logo', 'image', 'avatar');
  const total = moneyField(proposal, 'total_cents', 'price_cents', 'amount_cents');
  const proposalGuests = numberField(proposal, 'guest_count', 'guests');
  const requestGuests = numberField(request, 'guest_count', 'guests');
  const perGuest = total != null && proposalGuests != null && proposalGuests > 0 ? euro(Math.round(total / proposalGuests)) : '';
  const lines = PRICE_ROWS.flatMap((row) => {
    const amount = presentCents(proposal, row.key);
    return amount == null ? [] : [{ label: t(b(row.nl, row.en)), value: euro(amount) }];
  });
  const verified = boolField(proposal, 'verified', 'is_verified');
  const rating = ratingText(proposal, t);
  const availability = availabilityLabel(text(proposal, 'availability', 'availability_status'), t);
  const message = text(proposal, 'message', 'provider_message');
  const services = textList(proposal?.services ?? proposal?.included);
  const menu = text(proposal, 'menu', 'menu_details', 'dishes');
  const extra = textList(proposal?.excluded) || text(proposal, 'notes');
  const assumptions = text(proposal, 'assumptions');
  const expires = text(proposal, 'expires_at', 'valid_until');
  const responseNote = text(proposal, 'response_note', 'customer_note');
  const respondedAt = text(proposal, 'responded_at', 'response_at');
  const responded = statusKey === 'interested' || statusKey === 'rejected';

  const send = async (response: 'interested' | 'rejected') => {
    setError('');
    try {
      await respond({ proposal_id: proposalId, response }).unwrap();
      setConfirmReject(false);
      if (response === 'interested') {
        router.back();
        return;
      }
      void query.refetch();
    } catch (cause) {
      setConfirmReject(false);
      setError(cause && typeof cause === 'object' && 'message' in cause && typeof cause.message === 'string' ? cause.message : t(b('Het antwoord kon niet worden opgeslagen.', 'Could not save your response.')));
    }
  };

  if (!API_ENABLED) return <Screen header={<Header title={t(b('Voorstel', 'Proposal'))} back />} canvas={palette.bg}><EmptyState title={t(b('API niet beschikbaar', 'API unavailable'))} body={t(b('Verbind met de API om dit voorstel te laden.', 'Connect to the API to load this proposal.'))} /></Screen>;
  if (!query.isLoading && !proposal) return <Screen header={<Header title={t(b('Voorstel', 'Proposal'))} back />} canvas={palette.bg}><EmptyState icon="doc" title={t(b('Niet gevonden', 'Not found'))} body={t(b('De server gaf geen voorstel terug.', 'The server returned no proposal.'))} action={t(b('Terug', 'Back'))} onAction={() => router.back()} /></Screen>;

  return (
    <Screen
      loading={query.isLoading}
      refreshing={query.isFetching && !query.isLoading}
      onRefresh={() => { void query.refetch(); }}
      canvas={palette.bg}
      header={<Header title={t(b('Voorstel', 'Proposal'))} subtitle={providerName} back right={status ? <Badge label={t(status)} tone={status.tone} /> : statusKey ? <Badge label={readableStatus(statusKey)} /> : undefined} />}
      footer={
        <View style={styles.footer}>
          {/* <Button label={t(b('Contact vragen', 'Request contact'))} onPress={() => router.push(`/customer/continue/${proposalId}` as never)} style={styles.action} /> */}
          <Button label={t(b('Geïnteresseerd', 'Interested'))} variant="outline" loading={responseState.isLoading} onPress={() => void send('interested')} style={styles.action} />
          <Pressable accessibilityRole="button" onPress={() => setConfirmReject(true)} style={styles.reject}>
            <Text style={[styles.rejectText, { fontSize: type.secondary }]}>{t(b('Voorstel afwijzen', 'Reject proposal'))}</Text>
          </Pressable>
        </View>
      }>
      {proposal ? (
        <>
          <View style={styles.provider}>
            {photo.startsWith('http') || photo.startsWith('data:image') ? <Image source={{ uri: photo }} style={styles.avatar} /> : <View style={styles.avatar}><Text style={styles.initials}>{initials(providerName)}</Text></View>}
            <View style={styles.providerCopy}>
              <Text style={[styles.name, { fontSize: type.sectionTitle, lineHeight: leading(type.sectionTitle, 4) }]}>{providerName}</Text>
              {availability ? <Text style={[styles.meta, { fontSize: type.caption }]}>{availability}</Text> : null}
              {rating ? <Text style={[styles.meta, { fontSize: type.caption }]}>{rating}</Text> : null}
              {verified === true ? <Badge label={t(b('Geverifieerd', 'Verified'))} tone="good" /> : verified === false ? <Text style={[styles.meta, { fontSize: type.caption }]}>{t(b('Niet geverifieerd', 'Not verified'))}</Text> : null}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={[styles.section, { fontSize: type.sectionTitle }]}>{t(b('Offerte', 'Quotation'))}</Text>
            {total != null ? <Text style={[styles.total, { fontSize: type.screenTitle }]}>{euro(total)}</Text> : null}
            <Text style={[styles.meta, { fontSize: type.caption }]}>{t(b('Geschatte totaalprijs', 'Estimated total price'))}</Text>
            {proposalGuests != null ? <PriceLine label={t(b('Gasten in voorstel', 'Guests covered'))} value={requestGuestLabel(proposalGuests, lang)} /> : null}
            {perGuest ? <PriceLine label={t(b('Prijs per gast', 'Price per guest'))} value={perGuest} /> : null}
            {expires ? <PriceLine label={t(b('Geldig tot', 'Valid until'))} value={requestDate(expires, lang)} /> : null}
            {statusKey === 'needs_reconfirm' ? <Notice tone="accent" body={t(b('Dit voorstel moet opnieuw worden bevestigd. De huidige prijs is nog geen definitieve prijs.', 'This proposal needs reconfirmation. The current price is not a final price.'))} /> : null}
            {requestGuests != null && proposalGuests != null && requestGuests !== proposalGuests ? (
              <Notice tone="accent" body={t(b(
                `Huidige aanvraag: ${requestGuests} gasten. Oorspronkelijk voorstel: ${proposalGuests} gasten. Deze offerte hoort mogelijk niet meer bij de bijgewerkte aanvraag.`,
                `Current request: ${requestGuests} guests. Original proposal: ${proposalGuests} guests. This quotation may not reflect the updated requirements.`,
              ))} />
            ) : null}
          </View>

          {lines.length > 0 || total != null ? (
            <View style={styles.card}>
              <Text style={[styles.section, { fontSize: type.sectionTitle }]}>{t(b('Prijsopbouw', 'Price breakdown'))}</Text>
              {lines.map((line) => <PriceLine key={line.label} label={line.label} value={line.value} />)}
              {total != null ? <View style={styles.totalRow}><Text style={[styles.totalLabel, { fontSize: type.body }]}>{t(b('Geschat totaal', 'Estimated total'))}</Text><Text style={[styles.totalLabel, { fontSize: type.body }]}>{euro(total)}</Text></View> : null}
            </View>
          ) : null}

          {message ? <Copy title={t(b('Bericht van de cateraar', 'Provider message'))} body={message} /> : null}
          {services ? <Copy title={t(b('Aangeboden diensten', 'Services offered'))} body={services} /> : null}
          {menu ? <Copy title={t(b('Menu', 'Menu details'))} body={menu} /> : null}
          {extra ? <Copy title={t(b('Extra informatie', 'Additional information'))} body={extra} /> : null}
          {assumptions ? <Copy title={t(b('Voorwaarden', 'Assumptions and conditions'))} body={assumptions} /> : null}

          {responded ? (
            <View style={styles.card}>
              <Text style={[styles.section, { fontSize: type.sectionTitle }]}>{t(b('Jouw reactie', 'Your response'))}</Text>
              {status ? <Badge label={t(status)} tone={status.tone} /> : null}
              {respondedAt ? <Text style={[styles.meta, { fontSize: type.caption }]}>{requestDate(respondedAt, lang)}</Text> : null}
              {responseNote ? <Text style={[styles.copy, { fontSize: type.secondary, lineHeight: leading(type.secondary, 6) }]}>{responseNote}</Text> : null}
            </View>
          ) : null}

          {error ? <Notice tone="error" body={error} /> : null}
        </>
      ) : null}

      <Modal visible={confirmReject} transparent animationType="fade" onRequestClose={() => setConfirmReject(false)}>
        <View style={styles.modal}>
          <View style={styles.dialog}>
            <Text style={[styles.section, { fontSize: type.sectionTitle }]}>{t(b('Voorstel afwijzen?', 'Reject this proposal?'))}</Text>
            <Text style={[styles.copy, { fontSize: type.secondary, lineHeight: leading(type.secondary, 6) }]}>{t(b('De cateraar ziet dat je dit voorstel afwijst.', 'The caterer will see that you rejected this proposal.'))}</Text>
            <Button label={t(b('Afwijzen', 'Reject proposal'))} variant="danger" loading={responseState.isLoading} onPress={() => void send('rejected')} />
            <Button label={t(b('Annuleren', 'Keep proposal'))} variant="ghost" onPress={() => setConfirmReject(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function Copy({ title, body }: { title: string; body: string }) {
  const type = useType();
  return (
    <View style={styles.card}>
      <Text style={[styles.section, { fontSize: type.sectionTitle }]}>{title}</Text>
      <Text style={[styles.copy, { fontSize: type.secondary, lineHeight: leading(type.secondary, 6) }]}>{body}</Text>
    </View>
  );
}

function PriceLine({ label, value }: { label: string; value: string }) {
  const type = useType();
  return (
    <View style={styles.priceLine}>
      <Text style={[styles.meta, { fontSize: type.body, flex: 1 }]}>{label}</Text>
      <Text style={[styles.price, { fontSize: type.body }]}>{value}</Text>
    </View>
  );
}

function text(record: ApiRecord | null | undefined, ...keys: string[]) {
  if (!record) return '';
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim() && value.trim() !== 'false' && value.trim() !== 'null') return value.trim();
  }
  return '';
}

function nested(record: ApiRecord | null, key: string) {
  const value = record?.[key];
  return value && typeof value === 'object' && !Array.isArray(value) ? value as ApiRecord : null;
}

function moneyField(record: ApiRecord | null, ...keys: string[]) {
  if (!record) return null;
  for (const key of keys) {
    if (!(key in record) || record[key] == null || record[key] === '') continue;
    const amount = Number(record[key]);
    if (Number.isFinite(amount)) return amount;
  }
  return null;
}

function presentCents(record: ApiRecord | null, key: string) {
  if (!record || !(key in record) || record[key] == null || record[key] === '') return null;
  const amount = Number(record[key]);
  return Number.isFinite(amount) ? amount : null;
}

function numberField(record: ApiRecord | null, ...keys: string[]) {
  if (!record) return null;
  for (const key of keys) {
    if (!(key in record) || record[key] == null || record[key] === '') continue;
    const amount = Number(record[key]);
    if (Number.isFinite(amount)) return amount;
  }
  return null;
}

function boolField(record: ApiRecord | null, ...keys: string[]) {
  if (!record) return null;
  for (const key of keys) {
    if (!(key in record) || record[key] == null || record[key] === '') continue;
    const value = record[key];
    if (value === true || value === 1 || value === '1' || value === 'true') return true;
    if (value === false || value === 0 || value === '0' || value === 'false') return false;
  }
  return null;
}

function textList(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => typeof item === 'string' || typeof item === 'number' ? String(item).trim() : '').filter((item) => item && !/^\d+$/.test(item)).join('\n');
  if (typeof value === 'string') return value.trim();
  return '';
}

function ratingText(record: ApiRecord | null, t: (value: { nl: string; en: string }) => string) {
  if (!record) return '';
  const hasRating = 'rating' in record || 'average_rating' in record || 'review_count' in record;
  if (!hasRating) return '';
  const score = Number(record.rating ?? record.average_rating);
  const count = Number(record.review_count);
  if (Number.isFinite(score) && score > 0 && (!Number.isFinite(count) || count > 0)) return `${score.toFixed(1)}${Number.isFinite(count) ? ` · ${count}` : ''}`;
  return t(b('Nog geen beoordeling', 'No rating yet'));
}

function availabilityLabel(value: string, t: (value: { nl: string; en: string }) => string) {
  if (value === 'available') return t(b('Beschikbaar', 'Available'));
  if (value === 'partial') return t(b('Deels beschikbaar', 'Partly available'));
  if (value === 'maybe') return t(b('Nog nakijken', 'Need to check'));
  if (value === 'unavailable') return t(b('Niet beschikbaar', 'Unavailable'));
  return '';
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'C';
}

const styles = StyleSheet.create({
  provider: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', padding: spacing.lg, borderRadius: radius.lg, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: palette.well, alignItems: 'center', justifyContent: 'center' },
  initials: { color: palette.accentDark, fontWeight: '700', fontSize: 16 },
  providerCopy: { flex: 1, minWidth: 0, gap: 3 },
  name: { color: palette.ink, fontWeight: '600' },
  meta: { color: palette.muted, fontWeight: '400' },
  card: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  section: { color: palette.ink, fontWeight: '600' },
  total: { color: palette.ink, fontWeight: '700' },
  priceLine: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 4 },
  price: { color: palette.ink, fontWeight: '500' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line },
  totalLabel: { color: palette.ink, fontWeight: '700' },
  copy: { color: palette.inkSecondary, fontWeight: '400' },
  footer: { gap: spacing.sm },
  action: { minHeight: 46 },
  reject: { minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  rejectText: { color: palette.danger, fontWeight: '600' },
  modal: { flex: 1, backgroundColor: palette.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  dialog: { width: '100%', maxWidth: 420, gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: palette.surface },
});
