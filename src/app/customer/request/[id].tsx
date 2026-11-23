import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  API_ENABLED,
  useCancelRequestMutation,
  useCloseRequestMutation,
  useDuplicateRequestMutation,
  useGetRequestDetailsQuery,
  useUpdateRequestMutation,
} from '@/api';
import { recordOf } from '@/api/mappers';
import type { ApiRecord } from '@/api/types';
import { Button } from '@/flow2/components/Button';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Input } from '@/flow2/components/Input';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';

export default function RequestDetailScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const query = useGetRequestDetailsQuery(id, { skip: !API_ENABLED || !id });
  const request = recordOf(query.data, 'request');
  const [duplicateRequest, duplicateState] = useDuplicateRequestMutation();
  const [closeRequest, closeState] = useCloseRequestMutation();
  const [cancelRequest, cancelState] = useCancelRequestMutation();
  const [updateRequest, updateState] = useUpdateRequestMutation();
  const [cancelReason, setCancelReason] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [updateNote, setUpdateNote] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  if (!API_ENABLED) {
    return (
      <Screen header={<Header title="My requirements" back />}>
        <EmptyState icon="doc" title="API unavailable" body="Connect to the API to load request details." />
      </Screen>
    );
  }
  if (!query.isLoading && !request) {
    return (
      <Screen header={<Header title="My requirements" back />}>
        <EmptyState icon="doc" title="Request not found" body="The server returned no request details." action="Back" onAction={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen
      loading={query.isLoading}
      refreshing={query.isFetching && !query.isLoading}
      onRefresh={() => {
        void query.refetch();
      }}
      header={<Header title="My requirements" subtitle={String(request?.request_id ?? request?.id ?? id)} back />}>
      {request ? <Rows data={request} /> : null}

      <Input
        label="Update guest count"
        value={guestCount}
        onChangeText={setGuestCount}
        placeholder={String(request?.guest_count ?? '')}
        keyboardType="number-pad"
      />
      <Input
        label="Update note"
        value={updateNote}
        onChangeText={setUpdateNote}
        placeholder="Describe the change"
        multiline
      />
      <Button
        label="Update request"
        variant="secondary"
        loading={updateState.isLoading}
        onPress={async () => {
          const guests = Number(guestCount);
          if (!Number.isFinite(guests) || guests <= 0) {
            setNotice('');
            setError('Enter a valid guest count to update this request.');
            return;
          }
          try {
            await updateRequest({
              request_id: id,
              event_type: String(request?.event_type ?? 'event'),
              event_date: String(request?.event_date ?? ''),
              city: String(request?.city ?? ''),
              guest_count: guests,
              needs: Array.isArray(request?.needs) ? (request?.needs as string[]) : ['food'],
              description: updateNote.trim() || undefined,
            }).unwrap();
            setError('');
            setNotice('Request updated.');
            void query.refetch();
          } catch {
            setNotice('');
            setError('Could not update this request.');
          }
        }}
      />

      <Button
        label="Duplicate request"
        variant="secondary"
        loading={duplicateState.isLoading}
        onPress={async () => {
          try {
            await duplicateRequest(id).unwrap();
            setError('');
            setNotice('Request duplicated.');
          } catch {
            setNotice('');
            setError('Could not duplicate this request.');
          }
        }}
      />

      <Button
        label="Close request"
        variant="secondary"
        loading={closeState.isLoading}
        onPress={async () => {
          try {
            await closeRequest(id).unwrap();
            setError('');
            setNotice('Request closed.');
          } catch {
            setNotice('');
            setError('Could not close this request.');
          }
        }}
      />

      <Input
        label="Cancel reason"
        value={cancelReason}
        onChangeText={setCancelReason}
        placeholder="Why are you cancelling?"
        multiline
      />
      <Button
        label="Cancel request"
        variant="danger"
        loading={cancelState.isLoading}
        onPress={async () => {
          if (!cancelReason.trim()) {
            setNotice('');
            setError('Enter a reason to cancel this request.');
            return;
          }
          try {
            await cancelRequest({ request_id: id, reason: cancelReason.trim() }).unwrap();
            setError('');
            setNotice('Request cancelled.');
          } catch {
            setNotice('');
            setError('Could not cancel this request.');
          }
        }}
      />

      {notice ? <Notice tone="success" body={notice} /> : null}
      {error ? <Notice tone="error" body={error} /> : null}
    </Screen>
  );
}

function Rows({ data }: { data: ApiRecord }) {
  return (
    <View style={styles.card}>
      {Object.entries(data)
        .filter(([, value]) => value == null || ['string', 'number', 'boolean'].includes(typeof value))
        .map(([key, value]) => (
          <View key={key} style={styles.row}>
            <Text style={styles.label}>{key.replaceAll('_', ' ')}</Text>
            <Text style={styles.value}>{value == null ? '' : String(value)}</Text>
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    gap: 12,
    borderRadius: 16,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
  },
  row: { gap: 3 },
  label: { color: palette.muted, textTransform: 'capitalize' },
  value: { color: palette.ink, fontWeight: '600' },
});
