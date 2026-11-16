import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { API_ENABLED, type ApiRecord, useGetLeadQuery, useSaveAvailabilityMutation } from '@/api';
import { recordOf, textOf } from '@/api/mappers';
import { useApp as useSession } from '@/state/store';
import { Button } from '@/flow2/components/Button';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';
import { SectionTitle } from '@/flow2/components/SectionTitle';
import { Card } from '@/flow2/components/Card';
import { ChipSingle } from '@/flow2/components/Chip';
import { Field } from '@/flow2/components/Field';

export default function VendorLeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, restored } = useSession();
  const enabled = API_ENABLED && restored && session.signedIn && session.mode === 'provider';
  const query = useGetLeadQuery(id, { skip: !enabled || !id });
  const [saveAvailability, availabilityState] = useSaveAvailabilityMutation();
  const [status, setStatus] = useState('available');
  const [error, setError] = useState('');
  const lead = recordOf(query.data, 'lead') as ApiRecord | null;
  const request = lead?.request && typeof lead.request === 'object' ? lead.request as ApiRecord : lead;

  if (!enabled) return <Screen header={<Header title="Request" back />}><EmptyState icon="inbox" title="Vendor API unavailable" body="Sign in as a vendor and enable the API to load this request." /></Screen>;
  if (query.isLoading) return <Screen header={<Header title="Request" back />} loading />;
  if (query.isError || !lead || !request) return <Screen header={<Header title="Request" back />}><EmptyState icon="inbox" title="Request unavailable" body="The server did not return this request." action="Back" onAction={() => router.back()} /></Screen>;

  const leadId = String(lead.lead_id ?? lead.id ?? id);
  const title = textOf(lead, 'reference', 'request_reference') || textOf(request, 'event_type', 'occasion') || 'Customer request';

  const save = async (next: string) => {
    const availability = next === 'available' || next === 'partial' || next === 'maybe' || next === 'unavailable' ? next : 'available';
    setError('');
    try {
      await saveAvailability({ lead_id: leadId, status: availability }).unwrap();
      setStatus(availability);
    } catch {
      setError('Could not save your availability. Please try again.');
    }
  };

  return (
    <Screen
      refreshing={query.isFetching}
      onRefresh={() => { void query.refetch(); }}
      header={<Header title={title} subtitle={textOf(request, 'city') || ''} back />}>
      <Notice tone="info" body="Customer contact details stay hidden until the customer consents to contact release." />
      <Card>
        <SectionTitle title="Your availability" subtitle="Choose an answer and save it to the server." />
        <Field>
          <ChipSingle
            options={['available', 'partial', 'maybe', 'unavailable']}
            value={status}
            onChange={(value) => { void save(value); }}
            labelOf={(value) => value === 'available' ? 'Available' : value === 'partial' ? 'Partly available' : value === 'maybe' ? 'Need to check' : 'Unavailable'}
          />
        </Field>
        {availabilityState.isLoading ? <Text>Saving…</Text> : null}
        {error ? <Notice tone="error" body={error} /> : null}
      </Card>
      <View style={styles.details}>
        <SectionTitle title="Request details" />
        <Detail label="Event" value={textOf(request, 'event_type', 'occasion')} />
        <Detail label="Date" value={textOf(request, 'event_date', 'date')} />
        <Detail label="Guests" value={textOf(request, 'guest_count', 'guests')} />
        <Detail label="City" value={textOf(request, 'city')} />
        <Detail label="Cuisine" value={textOf(request, 'cuisine', 'cuisines')} />
        <Detail label="Services" value={textOf(request, 'services', 'needs')} />
        <Detail label="Description" value={textOf(request, 'description', 'details')} />
      </View>
      <View style={styles.actions}>
        <Button label="Compose proposal" onPress={() => router.push(`/vendor/proposal/${leadId}` as any)} />
        <Button label="Back to requests" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return <Text>{label}: {value}</Text>;
}

const styles = StyleSheet.create({ details: { gap: 8 }, actions: { gap: 10 } });
