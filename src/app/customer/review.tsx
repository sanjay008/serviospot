import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSaveOutcomeMutation, useSaveReviewMutation } from '@/api';
import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Icon } from '@/flow2/components/Icon';
import { Input } from '@/flow2/components/Input';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { useApp } from '@/flow2/state/app';
import { leading, useType } from '@/hooks/use-type';

const APP_LOADED_AT = Date.now();

type RatingKey = 'overall' | 'food' | 'communication' | 'reliability' | 'value' | 'service';

const RATING_FIELDS: { key: RatingKey; label: string }[] = [
  { key: 'overall', label: 'Overall' },
  { key: 'food', label: 'Food' },
  { key: 'communication', label: 'Communication' },
  { key: 'reliability', label: 'Reliability' },
  { key: 'value', label: 'Value' },
  { key: 'service', label: 'Service' },
];

export default function CustomerReviewScreen() {
  const { providerId, requestId } = useLocalSearchParams<{ providerId: string; requestId?: string }>();
  const { providers, requests, proposalsFor } = useApp();
  const [selectedRequestId, setSelectedRequestId] = useState(requestId ?? '');
  const [ratings, setRatings] = useState<Record<RatingKey, number>>({ overall: 0, food: 0, communication: 0, reliability: 0, value: 0, service: 0 });
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmEvent, setConfirmEvent] = useState(false);
  const [saveOutcome] = useSaveOutcomeMutation();
  const [saveReview] = useSaveReviewMutation();
  const type = useType();

  const eligibleRequests = useMemo(() => requests.filter((request) =>
    new Date(request.date).getTime() < APP_LOADED_AT &&
    proposalsFor(request.id).some((proposal) => proposal.providerId === providerId && proposal.contactReleased),
  ), [providerId, proposalsFor, requests]);
  const selectedRequest = eligibleRequests.find((request) => request.id === selectedRequestId) ?? eligibleRequests[0];
  const provider = providers.find((item) => item.id === providerId);

  const sendReview = async () => {
    if (!selectedRequest) return;
    if (Object.values(ratings).some((rating) => rating < 1 || rating > 5)) {
      setError('Choose a star rating for every category.');
      return;
    }
    if (body.trim().length < 10) {
      setError('Write at least 10 characters about your experience.');
      return;
    }
    if (!confirmEvent) {
      setError('Confirm that the event took place and this caterer provided the service.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await saveOutcome({ request_id: selectedRequest.id, provider_id: providerId, outcome: 'happened' }).unwrap();
      await saveReview({ request_id: selectedRequest.id, provider_id: providerId, ...ratings, body: body.trim() }).unwrap();
      setSubmitted(true);
    } catch (cause) {
      const failure = cause as { data?: { message?: unknown; error?: unknown }; message?: unknown };
      const message = failure.data?.message ?? failure.data?.error ?? failure.message;
      setError(typeof message === 'string' ? message : 'Could not submit your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!eligibleRequests.length) {
    return (
      <Screen header={<Header title="Write a review" back />}>
        <EmptyState
          icon="star"
          title="No eligible event yet"
          body="Verified reviews can be added after the event, once you confirm that this caterer served you."
          action="Back to caterer"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  if (submitted) {
    return (
      <Screen header={<Header title="Review submitted" back />}>
        <Notice tone="success" title="Thank you for your review" body="Your verified review has been submitted." />
        <Button label="Back to caterer" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen header={<Header title="Write a review" subtitle={provider?.name ?? 'Caterer'} back />}>
      <Notice tone="info" body="Your review is linked to an event you confirmed with this caterer." />
      {eligibleRequests.length > 1 ? (
        <Card>
          <Text style={[styles.sectionTitle, { fontSize: type.cardTitle }]}>Choose the event</Text>
          {eligibleRequests.map((request) => (
            <Pressable key={request.id} accessibilityRole="radio" accessibilityState={{ selected: selectedRequest?.id === request.id }} onPress={() => setSelectedRequestId(request.id)} style={styles.requestChoice}>
              <View style={[styles.radio, selectedRequest?.id === request.id && styles.radioSelected]} />
              <Text style={[styles.requestLabel, { fontSize: type.secondary }]}>{request.occasion} · {request.date}</Text>
            </Pressable>
          ))}
        </Card>
      ) : null}
      <Card style={styles.ratingsCard}>
        <Text style={[styles.sectionTitle, { fontSize: type.cardTitle }]}>Rate your experience</Text>
        {RATING_FIELDS.map((field) => (
          <View key={field.key} style={styles.ratingRow}>
            <Text style={[styles.ratingLabel, { fontSize: type.secondary }]}>{field.label}</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Pressable key={value} accessibilityRole="button" accessibilityLabel={`${field.label}: ${value} stars`} accessibilityState={{ selected: ratings[field.key] === value }} onPress={() => setRatings((current) => ({ ...current, [field.key]: value }))} hitSlop={4}>
                  <Icon name="star" color={ratings[field.key] >= value ? palette.gold : palette.line} size={23} filled={ratings[field.key] >= value} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </Card>
      <Card>
        <Input label="Your review" value={body} onChangeText={setBody} placeholder="How was your experience?" multiline hint="At least 10 characters." />
      </Card>
      <Pressable style={styles.confirmRow} onPress={() => setConfirmEvent((value) => !value)} accessibilityRole="checkbox" accessibilityState={{ checked: confirmEvent }}>
        <View style={[styles.checkbox, confirmEvent && styles.checkboxSelected]}>{confirmEvent ? <Icon name="check" color="#fff" size={14} /> : null}</View>
        <Text style={[styles.confirmText, { fontSize: type.secondary, lineHeight: leading(type.secondary, 6) }]}>I confirm the event happened and this caterer provided the service.</Text>
      </Pressable>
      {error ? <Notice tone="error" body={error} /> : null}
      <Button label="Submit review" loading={submitting} onPress={() => void sendReview()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  ratingsCard: { gap: 16 },
  sectionTitle: { color: palette.ink, fontWeight: '800' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  ratingLabel: { flex: 1, color: palette.ink, fontWeight: '600' },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  requestChoice: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: palette.line },
  radioSelected: { borderColor: palette.accent, backgroundColor: palette.accent },
  requestLabel: { flex: 1, color: palette.ink },
  confirmRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: { width: 22, height: 22, borderWidth: 1.5, borderColor: palette.line, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: palette.accent, borderColor: palette.accent },
  confirmText: { flex: 1, color: palette.ink },
});
