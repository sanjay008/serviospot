import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  API_ENABLED,
  useCancelRequestMutation,
  useCloseRequestMutation,
  // useDuplicateRequestMutation,
  useGetProposalsQuery,
  useGetRequestDetailsQuery,
  useUpdateRequestMutation,
} from '@/api';
import { recordOf, rowsOf } from '@/api/mappers';
import type { ApiRecord } from '@/api/types';
import { RequestBrief, readableStatus, requestGuestLabel, requestReference, requestStatus } from '@/components/RequestBrief';
import { INDICATIVE } from '@/constants/copy';
import { Badge } from '@/flow2/components/Badge';
import { Button } from '@/flow2/components/Button';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Icon, type IconName } from '@/flow2/components/Icon';
import { Input } from '@/flow2/components/Input';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';
import { palette, radius, spacing } from '@/flow2/constants/theme';
import { b } from '@/flow2/data/options';
import { useApp } from '@/flow2/state/app';
import { useResponsive } from '@/hooks/use-responsive';
import { leading, useType } from '@/hooks/use-type';

type Sheet = 'update' | 'cancel' | 'close' | null;

const TERMINAL = new Set(['cancelled', 'canceled', 'closed', 'completed']);

export default function RequestDetailScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useApp();
  const type = useType();
  const query = useGetRequestDetailsQuery(id, { skip: !API_ENABLED || !id });
  const proposalsQuery = useGetProposalsQuery(id, { skip: !API_ENABLED || !id });
  const request = recordOf(query.data, 'request');
  const proposals = rowsOf(proposalsQuery.data);
  const [updateRequest, updateState] = useUpdateRequestMutation();
  // const [duplicateRequest, duplicateState] = useDuplicateRequestMutation();
  const [closeRequest, closeState] = useCloseRequestMutation();
  const [cancelRequest, cancelState] = useCancelRequestMutation();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [guestCount, setGuestCount] = useState('');
  const [updateNote, setUpdateNote] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const statusKey = String(request?.status ?? '').toLowerCase();
  const status = requestStatus(statusKey);
  const locked = TERMINAL.has(statusKey);
  const reference = request ? requestReference(request, id) : '';

  const openUpdate = () => {
    setFormError('');
    setGuestCount(String(request?.guest_count ?? ''));
    setUpdateNote('');
    setSheet('update');
  };

  const saveUpdate = async () => {
    const guests = Number(guestCount);
    if (!Number.isFinite(guests) || guests <= 0) {
      setFormError(t(b('Vul een geldig aantal gasten in.', 'Enter a valid guest count.')));
      return;
    }
    try {
      await updateRequest({
        request_id: id,
        event_type: String(request?.event_type ?? 'event'),
        event_date: String(request?.event_date ?? ''),
        city: String(request?.city ?? ''),
        guest_count: guests,
        needs: Array.isArray(request?.needs) ? (request.needs as string[]) : ['food'],
        description: updateNote.trim() || undefined,
      }).unwrap();
      setSheet(null);
      setError('');
      setNotice(t(b('Aanvraag bijgewerkt.', 'Request updated.')));
      void query.refetch();
    } catch (cause) {
      setFormError(messageOf(cause, t(b('De aanvraag kon niet worden bijgewerkt.', 'Could not update this request.'))));
    }
  };

  // const saveDuplicate = async () => {
  //   try {
  //     await duplicateRequest(id).unwrap();
  //     setError('');
  //     setNotice(t(b('Aanvraag gedupliceerd.', 'Request duplicated.')));
  //   } catch {
  //     setNotice('');
  //     setError(t(b('Deze aanvraag kon niet worden gedupliceerd.', 'Could not duplicate this request.')));
  //   }
  // };

  const saveClose = async () => {
    try {
      await closeRequest(id).unwrap();
      setSheet(null);
      setError('');
      setNotice(t(b('Aanvraag gesloten.', 'Request closed.')));
      void query.refetch();
    } catch {
      setFormError(t(b('Deze aanvraag kon niet worden gesloten.', 'Could not close this request.')));
    }
  };

  const saveCancel = async () => {
    if (!cancelReason.trim()) {
      setFormError(t(b('Vul een reden in om te annuleren.', 'Enter a reason to cancel this request.')));
      return;
    }
    try {
      await cancelRequest({ request_id: id, reason: cancelReason.trim() }).unwrap();
      setSheet(null);
      setCancelReason('');
      setError('');
      setNotice(t(b('Aanvraag geannuleerd.', 'Request cancelled.')));
      void query.refetch();
    } catch {
      setFormError(t(b('Deze aanvraag kon niet worden geannuleerd.', 'Could not cancel this request.')));
    }
  };

  if (!API_ENABLED) {
    return (
      <Screen header={<Header title={t(b('Aanvraagdetails', 'Request Details'))} back />} canvas={palette.bg}>
        <EmptyState icon="doc" title={t(b('API niet beschikbaar', 'API unavailable'))} body={t(b('Verbind met de API om de aanvraag te laden.', 'Connect to the API to load request details.'))} />
      </Screen>
    );
  }
  if (!query.isLoading && !request) {
    return (
      <Screen header={<Header title={t(b('Aanvraagdetails', 'Request Details'))} back />} canvas={palette.bg}>
        <EmptyState icon="doc" title={t(b('Aanvraag niet gevonden', 'Request not found'))} body={t(b('De server gaf geen aanvraagdetails terug.', 'The server returned no request details.'))} action={t(b('Terug', 'Back'))} onAction={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen
      loading={query.isLoading}
      refreshing={(query.isFetching || proposalsQuery.isFetching) && !query.isLoading}
      onRefresh={() => { void query.refetch(); void proposalsQuery.refetch(); }}
      canvas={palette.bg}
      header={
        <Header
          title={t(b('Aanvraagdetails', 'Request Details'))}
          subtitle={reference}
          back
          right={status ? <Badge label={t(status)} tone={status.tone} /> : statusKey ? <Badge label={readableStatus(statusKey)} /> : undefined}
        />
      }>
      {request ? (
        <>
          <RequestBrief request={request} />

          <Section title={t(b('Voorstellen', 'Proposals'))}>
            <Text style={[styles.note, { fontSize: type.secondary, lineHeight: leading(type.secondary, 6) }]}>
              {proposalsQuery.isLoading
                ? t(b('Voorstellen laden…', 'Loading proposals…'))
                : proposals.length === 0
                  ? t(b('Nog geen voorstellen ontvangen.', 'No proposals received yet.'))
                  : proposals.length === 1
                    ? t(b('1 voorstel ontvangen.', '1 proposal received.'))
                    : t(b(`${proposals.length} voorstellen ontvangen.`, `${proposals.length} proposals received.`))}
            </Text>
            {proposals.map((proposal, index) => {
              const proposalId = String(proposal.proposal_id ?? proposal.id ?? '');
              const name = proposalText(proposal, 'provider_name', 'business_name', 'name');
              return (
                <Pressable
                  key={proposalId || index}
                  accessibilityRole="button"
                  disabled={!proposalId}
                  onPress={() => router.push(`/customer/proposal/${proposalId}` as never)}
                  style={styles.proposalRow}>
                  <View style={styles.proposalCopy}>
                    <Text style={[styles.proposalName, { fontSize: type.body }]}>{name || t(b('Voorstel', 'Proposal'))}</Text>
                  </View>
                  {proposalId ? <Icon name="chevron" color={palette.muted} size={16} /> : null}
                </Pressable>
              );
            })}
          </Section>

          <View style={styles.info}>
            <Icon name="info" color={palette.info} size={16} />
            <Text style={[styles.infoText, { fontSize: type.caption, lineHeight: leading(type.caption, 5) }]}>{t(b(
              'De getoonde prijs is een indicatie op basis van de informatie die nu is opgegeven. Persoonlijke wensen, definitieve hoeveelheden, locatie, personeel, timing, materialen, belastingen, reiskosten en andere details kunnen de eindprijs beïnvloeden. De definitieve omvang en prijs worden rechtstreeks tussen klant en aanbieder afgesproken.',
              INDICATIVE,
            ))}</Text>
          </View>

          {notice ? <Notice tone="success" body={notice} /> : null}
          {error ? <Notice tone="error" body={error} /> : null}

          <Section title={t(b('Aanvraag beheren', 'Manage request'))}>
            {!locked ? (
              <ActionRow icon="edit" label={t(b('Aanvraag bijwerken', 'Update request'))} primary onPress={openUpdate} />
            ) : null}
            {/* <ActionRow icon="copy" label={t(b('Aanvraag dupliceren', 'Duplicate request'))} loading={duplicateState.isLoading} onPress={() => void saveDuplicate()} /> */}
            {!locked ? (
              <ActionRow icon="close" label={t(b('Aanvraag sluiten', 'Close request'))} onPress={() => { setFormError(''); setSheet('close'); }} />
            ) : null}
            {!locked ? (
              <Pressable accessibilityRole="button" onPress={() => { setFormError(''); setSheet('cancel'); }} style={styles.cancelLink}>
                <Text style={[styles.cancelText, { fontSize: type.secondary }]}>{t(b('Aanvraag annuleren', 'Cancel request'))}</Text>
              </Pressable>
            ) : null}
          </Section>
        </>
      ) : null}

      <SheetFrame
        visible={sheet === 'update'}
        title={t(b('Aanvraag bijwerken', 'Update request'))}
        onClose={() => setSheet(null)}>
        <Text style={[styles.sheetHint, { fontSize: type.caption }]}>
          {t(b('Huidig aantal gasten', 'Current guest count'))}: {requestGuestLabel(request?.guest_count, lang) || '—'}
        </Text>
        <Input label={t(b('Aantal gasten', 'Guest count'))} value={guestCount} onChangeText={setGuestCount} keyboardType="number-pad" />
        <Input label={t(b('Notitie', 'Update note'))} value={updateNote} onChangeText={setUpdateNote} placeholder={t(b('Beschrijf de wijziging', 'Describe the change'))} multiline />
        {formError ? <Notice tone="error" body={formError} /> : null}
        <Button label={t(b('Wijzigingen opslaan', 'Save changes'))} loading={updateState.isLoading} onPress={() => void saveUpdate()} />
      </SheetFrame>

      <SheetFrame
        visible={sheet === 'cancel'}
        title={t(b('Aanvraag annuleren', 'Cancel request'))}
        onClose={() => setSheet(null)}>
        <Text style={[styles.sheetHint, { fontSize: type.secondary, lineHeight: leading(type.secondary, 6) }]}>
          {t(b('Annuleren stopt nieuwe voorstellen. Een afspraak die je al rechtstreeks met een aanbieder maakte, wordt hier niet geannuleerd.', 'Cancelling stops new proposals. An agreement you already made directly with a provider is not cancelled here.'))}
        </Text>
        <Input label={t(b('Reden', 'Cancellation reason'))} value={cancelReason} onChangeText={setCancelReason} placeholder={t(b('Waarom annuleer je?', 'Why are you cancelling?'))} multiline />
        {formError ? <Notice tone="error" body={formError} /> : null}
        <Button label={t(b('Annuleren bevestigen', 'Confirm cancellation'))} variant="danger" loading={cancelState.isLoading} onPress={() => void saveCancel()} />
        <Button label={t(b('Aanvraag houden', 'Keep request'))} variant="ghost" onPress={() => setSheet(null)} />
      </SheetFrame>

      <SheetFrame
        visible={sheet === 'close'}
        title={t(b('Aanvraag sluiten', 'Close request'))}
        onClose={() => setSheet(null)}>
        <Text style={[styles.sheetHint, { fontSize: type.secondary, lineHeight: leading(type.secondary, 6) }]}>
          {t(b('Sluiten markeert deze aanvraag als afgerond. Dit is iets anders dan annuleren.', 'Closing marks this request as finished. This is different from cancelling it.'))}
        </Text>
        {formError ? <Notice tone="error" body={formError} /> : null}
        <Button label={t(b('Aanvraag sluiten', 'Close request'))} loading={closeState.isLoading} onPress={() => void saveClose()} />
        <Button label={t(b('Aanvraag houden', 'Keep request'))} variant="ghost" onPress={() => setSheet(null)} />
      </SheetFrame>
    </Screen>
  );
}

function SheetFrame({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { width } = useResponsive();
  const type = useType();
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.sheetHost} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg), maxWidth: width >= 768 ? 560 : undefined, width: width >= 768 ? 560 : undefined }]}>
        <View style={styles.handle} />
        <Text style={[styles.sheetTitle, { fontSize: type.sectionTitle }]}>{title}</Text>
        <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ActionRow({ icon, label, onPress, primary, loading }: { icon: IconName; label: string; onPress: () => void; primary?: boolean; loading?: boolean }) {
  const type = useType();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!loading, busy: !!loading }} disabled={loading} onPress={onPress} style={[styles.action, primary && styles.actionPrimary]}>
      <Icon name={icon} color={primary ? palette.white : palette.accentDark} size={16} />
      <Text style={[styles.actionLabel, primary && styles.actionLabelPrimary, { fontSize: type.body }]}>{loading ? '…' : label}</Text>
    </Pressable>
  );
}

function proposalText(record: ApiRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const type = useType();
  return (
    <View style={styles.card}>
      <Text style={[styles.section, { fontSize: type.secondary }]}>{title}</Text>
      {children}
    </View>
  );
}

function messageOf(cause: unknown, fallback: string) {
  return cause && typeof cause === 'object' && 'message' in cause && typeof cause.message === 'string' ? cause.message : fallback;
}

const styles = StyleSheet.create({
  hero: { gap: spacing.xxs },
  heroTitle: { color: palette.ink, fontWeight: '700', letterSpacing: -0.3 },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
  },
  section: { color: palette.ink, fontWeight: '600' },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  fact: { width: '47%', minWidth: 140, flexGrow: 1, flexDirection: 'row', gap: spacing.sm },
  factWide: { width: '100%' },
  factIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
  },
  factCopy: { flex: 1, gap: 2, minWidth: 0 },
  factLabel: { color: palette.muted, fontWeight: '500' },
  factValue: { color: palette.ink, fontWeight: '500' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    maxWidth: '100%',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: palette.well,
    borderWidth: 1,
    borderColor: palette.line,
  },
  chipText: { color: palette.inkSecondary, fontWeight: '500' },
  note: { color: palette.inkSecondary, fontWeight: '400' },
  proposalRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.line,
  },
  proposalCopy: { flex: 1, minWidth: 0 },
  proposalName: { color: palette.ink, fontWeight: '600' },
  info: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.infoSoft,
  },
  infoText: { flex: 1, color: palette.inkSecondary, fontWeight: '400' },
  action: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.well,
  },
  actionPrimary: { backgroundColor: palette.accent },
  actionLabel: { flex: 1, color: palette.ink, fontWeight: '600' },
  actionLabelPrimary: { color: palette.white },
  cancelLink: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: palette.danger, fontWeight: '600' },
  sheetHost: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: palette.overlay },
  sheet: {
    width: '100%',
    maxHeight: '88%',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: palette.surface,
  },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: radius.full, backgroundColor: palette.lineStrong, marginBottom: spacing.md },
  sheetTitle: { color: palette.ink, fontWeight: '700', marginBottom: spacing.md },
  sheetBody: { gap: spacing.md, paddingBottom: spacing.lg },
  sheetHint: { color: palette.inkSecondary, fontWeight: '400' },
});
