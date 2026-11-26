import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { API_ENABLED, type ApiRecord, useGetLeadQuery, useSaveAvailabilityMutation } from '@/api';
import { recordOf } from '@/api/mappers';
import { RequestBrief, readableStatus, requestRecord, requestReference, requestStatus } from '@/components/RequestBrief';
import { useApp as useSession } from '@/state/store';
import { Badge } from '@/flow2/components/Badge';
import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { ChipSingle } from '@/flow2/components/Chip';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Field } from '@/flow2/components/Field';
import { Header } from '@/flow2/components/Header';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';
import { SectionTitle } from '@/flow2/components/SectionTitle';
import { palette } from '@/flow2/constants/theme';
import { b } from '@/flow2/data/options';
import { useApp } from '@/flow2/state/app';

export default function VendorLeadDetailScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { t } = useApp();
  const { session, restored } = useSession();
  const enabled = API_ENABLED && restored && session.signedIn && session.mode === 'provider';
  const query = useGetLeadQuery(id, { skip: !enabled || !id });
  const [saveAvailability, availabilityState] = useSaveAvailabilityMutation();
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const lead = recordOf(query.data, 'lead') as ApiRecord | null;
  const request = requestRecord(lead);

  if (!enabled) return <Screen header={<Header title={t(b('Aanvraagdetails', 'Request Details'))} back />} canvas={palette.bg}><EmptyState icon="inbox" title={t(b('API niet beschikbaar', 'Vendor API unavailable'))} body={t(b('Log in als aanbieder om deze aanvraag te laden.', 'Sign in as a vendor and enable the API to load this request.'))} /></Screen>;
  if (query.isLoading) return <Screen header={<Header title={t(b('Aanvraagdetails', 'Request Details'))} back />} canvas={palette.bg} loading />;
  if (query.isError || !lead || !request) return <Screen header={<Header title={t(b('Aanvraagdetails', 'Request Details'))} back />} canvas={palette.bg}><EmptyState icon="inbox" title={t(b('Aanvraag niet beschikbaar', 'Request unavailable'))} body={t(b('De server gaf deze aanvraag niet terug.', 'The server did not return this request.'))} action={t(b('Terug', 'Back'))} onAction={() => router.back()} /></Screen>;

  const leadId = String(lead.lead_id ?? lead.id ?? id);
  const statusKey = String(request.status ?? '').toLowerCase();
  const requestBadge = requestStatus(statusKey);
  const saved = status || String(lead.availability_status ?? lead.availability ?? '');

  const save = async (next: string) => {
    const availability = next === 'available' || next === 'partial' || next === 'maybe' || next === 'unavailable' ? next : 'available';
    setError('');
    try {
      await saveAvailability({ lead_id: leadId, status: availability }).unwrap();
      setStatus(availability);
    } catch {
      setError(t(b('Beschikbaarheid kon niet worden opgeslagen.', 'Could not save your availability. Please try again.')));
    }
  };

  return (
    <Screen
      refreshing={query.isFetching}
      onRefresh={() => { void query.refetch(); }}
      canvas={palette.bg}
      header={
        <Header
          title={t(b('Aanvraagdetails', 'Request Details'))}
          subtitle={requestReference(request, id)}
          back
          right={requestBadge ? <Badge label={t(requestBadge)} tone={requestBadge.tone} /> : statusKey ? <Badge label={readableStatus(statusKey)} /> : undefined}
        />
      }>
      <RequestBrief request={request} />
      <Notice tone="info" body={t(b('Contactgegevens blijven verborgen tot de klant contact deelt.', 'Customer contact details stay hidden until the customer consents to contact release.'))} />
      <Card>
        <SectionTitle title={t(b('Jouw beschikbaarheid', 'Your availability'))} subtitle={t(b('Kies een antwoord. Het wordt meteen opgeslagen.', 'Choose an answer and save it to the server.'))} />
        <Field>
          <ChipSingle
            options={['available', 'partial', 'maybe', 'unavailable']}
            value={saved || 'available'}
            onChange={(value) => { void save(value); }}
            labelOf={(value) => value === 'available' ? t(b('Beschikbaar', 'Available')) : value === 'partial' ? t(b('Deels beschikbaar', 'Partly available')) : value === 'maybe' ? t(b('Nog nakijken', 'Need to check')) : t(b('Niet beschikbaar', 'Unavailable'))}
          />
        </Field>
        {availabilityState.isLoading ? <Text style={styles.saving}>{t(b('Opslaan…', 'Saving…'))}</Text> : null}
        {error ? <Notice tone="error" body={error} /> : null}
      </Card>
      <View style={styles.actions}>
        <Button label={t(b('Voorstel maken', 'Compose proposal'))} onPress={() => router.push(`/vendor/proposal/${leadId}` as never)} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 10 },
  saving: { color: palette.muted },
});
