import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Grid } from '@/components/Grid';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { euro, formatDate } from '@/data/format';
import { useResponsive } from '@/hooks/use-responsive';
import { useSubscriptionSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

export default function SubscriptionScreen() {
  const { plans, session, setPlan } = useApp();
  const { invoices, invoicesLoading } = useSubscriptionSync();
  const { isTablet } = useResponsive();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState('');
  return (
    <Screen header={<Header title="Subscription" back />}>
      <Text style={styles.lead}>Choose the plan that fits your business.</Text>
      {error ? <Notice tone="error" body={error} /> : null}
      {message ? <Notice tone="success" body={message} /> : null}
      <Grid minItem={280} maxColumns={isTablet ? 2 : 1} gap={12}>
      {plans.map((plan) => {
        const selected = session.planId === plan.id;
        return (
          <Card key={plan.id}>
            <Text style={styles.name}>{plan.name}</Text>
            <Text style={styles.price}>{plan.monthlyCents === 0 ? '€0' : euro(plan.monthlyCents)} / month</Text>
            {plan.summary ? <Text style={styles.meta}>{plan.summary}</Text> : null}
            {plan.includes.map((item) => (
              <Text key={item} style={styles.meta}>· {item}</Text>
            ))}
            <Button
              label={selected ? 'Current plan' : `Switch to ${plan.name}`}
              variant={selected ? 'secondary' : 'primary'}
              loading={saving === plan.id}
              onPress={async () => {
                if (selected) return;
                setSaving(plan.id);
                const result = await setPlan(plan.id, 'monthly');
                setSaving('');
                if (!result.ok) {
                  setMessage('');
                  setError(result.reason);
                  return;
                }
                setError('');
                setMessage(`${plan.name} is now your plan.`);
              }}
            />
          </Card>
        );
      })}
      </Grid>
      <Card>
        <Text style={styles.name}>Invoices</Text>
        {invoicesLoading ? <Text style={styles.meta}>Loading invoices…</Text> : null}
        {!invoicesLoading && invoices.length === 0 ? <Text style={styles.meta}>No invoices yet.</Text> : null}
        {invoices.map((invoice) => (
          <Text key={invoice.id} style={styles.meta}>
            {[invoice.number, invoice.date ? formatDate(invoice.date) : '', euro(invoice.amountCents), invoice.status].filter(Boolean).join(' · ')}
          </Text>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { fontSize: 15, lineHeight: 22, color: palette.ink },
  name: { fontSize: 18, fontWeight: '700', color: palette.ink },
  price: { fontSize: 16, fontWeight: '700', color: palette.accent },
  meta: { fontSize: 14, lineHeight: 20, color: palette.muted },
});
