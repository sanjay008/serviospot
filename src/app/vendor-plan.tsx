import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthScreen, AuthTitle, authButton } from '@/components/AuthScreen';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { LoadingState } from '@/components/LoadingState';
import { Notice } from '@/components/Notice';
import { palette } from '@/constants/theme';
import { euro } from '@/data/format';
import type { PlanId } from '@/data/types';
import { usePlansSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

const TINT: Record<PlanId, { tint: string; well: string }> = {
  free: { tint: palette.muted, well: palette.well },
  gold: { tint: palette.gold, well: palette.goldSoft },
  platinum: { tint: palette.accent, well: palette.accentSoft },
};

/** Features like "No quote requests" or "Phone and email hidden" describe what the plan lacks. */
const isMissing = (feature: string) => /^no\b|hidden/i.test(feature.trim());

export default function VendorPlanScreen() {
  const { plans, session, setPlan } = useApp();
  const loading = usePlansSync();
  const [picked, setPicked] = useState<PlanId>(session.planId === 'free' ? 'gold' : session.planId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const plan = plans.find((item) => item.id === picked) ?? plans[0];

  return (
    <AuthScreen back>
      <AuthTitle title="Select plan" subtitle="Choose your subscription plan." />
      {loading ? <LoadingState label="Loading plans" /> : null}
      {!loading && plans.length === 0 ? <Notice tone="error" body="Plans could not be loaded. Go back and try again." /> : null}
      {plans.map((item) => {
        const on = item.id === plan?.id;
        const { tint, well } = TINT[item.id];
        return (
          <Pressable
            key={item.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => setPicked(item.id)}
            style={[styles.card, on && { borderColor: tint, backgroundColor: well }]}>
            <View style={styles.top}>
              <View style={[styles.radio, on && { borderColor: tint }]}>{on ? <View style={[styles.radioDot, { backgroundColor: tint }]} /> : null}</View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={[styles.price, { color: tint }]}>
                {item.monthlyCents === 0 ? '€0' : euro(item.monthlyCents)}
                <Text style={styles.period}> / month</Text>
              </Text>
            </View>
            {item.summary ? <Text style={styles.note}>{item.summary}</Text> : null}
            <View style={styles.features}>
              {item.includes.map((feature) => {
                const missing = isMissing(feature);
                return (
                  <View key={feature} style={styles.feature}>
                    <Icon name={missing ? 'close' : 'check'} size={16} color={missing ? palette.muted : tint === palette.muted ? palette.ink : tint} />
                    <Text style={[styles.featureText, missing && styles.featureMissing]}>{feature}</Text>
                  </View>
                );
              })}
            </View>
          </Pressable>
        );
      })}
      {error ? <Notice tone="error" body={error} /> : null}
      <Button
        label="Continue"
        style={authButton}
        disabled={!plan}
        loading={saving}
        onPress={async () => {
          if (!plan) return;
          setSaving(true);
          const result = await setPlan(plan.id, 'monthly');
          setSaving(false);
          if (!result.ok) {
            setError(result.reason);
            return;
          }
          router.replace('/vendor-services');
        }}
      />
      <Text style={styles.fine}>No card is charged. The price is only shown so the plan choice is clear.</Text>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10, backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1.5, borderColor: palette.line, padding: 14 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: palette.line, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: palette.ink },
  price: { fontSize: 15, fontWeight: '700', textAlign: 'right' },
  period: { fontSize: 11, fontWeight: '500', color: palette.muted },
  note: { fontSize: 12, color: palette.muted },
  features: { gap: 6, paddingLeft: 34 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { flex: 1, fontSize: 13, color: palette.ink },
  featureMissing: { color: palette.muted },
  fine: { fontSize: 12, lineHeight: 18, color: palette.muted, textAlign: 'center' },
});
