import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChipSingle } from '@/components/Chip';
import { Header } from '@/components/Header';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { euro } from '@/data/format';
import { useApp } from '@/state/store';

export default function SubscriptionScreen() {
  const { plans, session, setPlan } = useApp();
  const [billing, setBilling] = useState(session.billing);
  const [message, setMessage] = useState('');
  return (
    <Screen header={<Header title="Subscription" back />}>
      <Text style={styles.lead}>Prices below are a starting range, not a final tariff. Choosing a plan here does not charge a card.</Text>
      <ChipSingle options={['Monthly', 'Annual']} value={billing === 'annual' ? 'Annual' : 'Monthly'} onChange={(value) => setBilling(value === 'Annual' ? 'annual' : 'monthly')} />
      {message ? <Notice tone="success" body={message} /> : null}
      {plans.map((plan) => {
        const amount = billing === 'annual' ? plan.annualCents : plan.monthlyCents;
        const selected = session.planId === plan.id && session.billing === billing;
        return (
          <Card key={plan.id}>
            <Text style={styles.name}>{plan.name}</Text>
            <Text style={styles.range}>{plan.range}</Text>
            <Text style={styles.price}>{amount === 0 ? '€0' : euro(amount)} {billing === 'annual' ? '/ year' : '/ month'}</Text>
            <Text style={styles.meta}>{plan.summary}</Text>
            {plan.includes.map((item) => (
              <Text key={item} style={styles.meta}>· {item}</Text>
            ))}
            <Button
              label={selected ? 'Current plan' : `Switch to ${plan.name}`}
              variant={selected ? 'secondary' : 'primary'}
              onPress={() => {
                setPlan(plan.id, billing);
                setMessage(`${plan.name} is active in this preview. No invoice was created.`);
              }}
            />
          </Card>
        );
      })}
      <Card>
        <Text style={styles.name}>Invoices</Text>
        <Text style={styles.meta}>October 2026 · Professional · Preview · Not charged</Text>
        <Text style={styles.meta}>Failed payments, trials and VAT invoices would appear here in the live billing system.</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { fontSize: 15, lineHeight: 22, color: palette.ink },
  name: { fontSize: 18, fontWeight: '700', color: palette.ink },
  range: { fontSize: 13, color: palette.gold },
  price: { fontSize: 16, fontWeight: '700', color: palette.accent },
  meta: { fontSize: 14, lineHeight: 20, color: palette.muted },
});
