import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { useApp } from '@/state/store';

export default function ProviderReviews() {
  const { reviews, me, respondToReview } = useApp();
  const rows = reviews.filter((review) => review.providerId === me.id);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  return (
    <Screen header={<Header title="Reviews" subtitle={`${me.rating.toFixed(1)} · ${me.reviewCount}`} back />}>
      <Text style={styles.note}>These are verified completed-job reviews. You can post one public reply.</Text>
      {rows.length === 0 ? <EmptyState icon="star" title="No reviews yet" body="A review appears after a customer confirms they used you for the event." /> : null}
      {rows.map((review) => (
        <Card key={review.id}>
          <Text style={styles.name}>{review.author} · {review.overall}/5</Text>
          <Text style={styles.meta}>Food {review.food} · Communication {review.communication} · Reliability {review.reliability} · Value {review.value} · Service {review.service}</Text>
          <Text style={styles.body}>{review.text}</Text>
          {review.response ? <Text style={styles.reply}>Your reply: {review.response}</Text> : (
            <>
              <Input label="Public reply" value={drafts[review.id] ?? ''} onChangeText={(value) => setDrafts({ ...drafts, [review.id]: value })} />
              <Button label="Post reply" variant="secondary" onPress={() => respondToReview(review.id, drafts[review.id] ?? '')} />
            </>
          )}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { color: palette.muted, fontSize: 14, lineHeight: 20 },
  name: { fontSize: 16, fontWeight: '700', color: palette.ink },
  meta: { fontSize: 13, lineHeight: 18, color: palette.muted },
  body: { fontSize: 15, lineHeight: 22, color: palette.ink },
  reply: { fontSize: 14, lineHeight: 20, color: palette.accentDark },
});
