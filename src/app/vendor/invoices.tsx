import { StyleSheet, Text, View } from 'react-native';

import { API_ENABLED, useGetInvoicesQuery } from '@/api';
import { rowsOf, textOf } from '@/api/mappers';
import { Card } from '@/flow2/components/Card';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { dateLong, money } from '@/flow2/data/format';
import { useType } from '@/hooks/use-type';
import { useApp as useFlow } from '@/flow2/state/app';
import { useApp as useSession } from '@/state/store';

export default function VendorInvoicesScreen() {
  const type = useType();
  const { session, restored } = useSession();
  const { t } = useFlow();
  const tx = (en: string) => t({ en, nl: en });
  const enabled = API_ENABLED && restored && session.signedIn && session.mode === 'provider';
  const invoicesQuery = useGetInvoicesQuery(undefined, { skip: !enabled });
  const invoices = invoiceRows(invoicesQuery.data);

  return (
    <Screen
      canvas={palette.bg}
      loading={invoicesQuery.isLoading}
      refreshing={invoicesQuery.isFetching && !invoicesQuery.isLoading}
      onRefresh={() => { void invoicesQuery.refetch(); }}
      header={<Header title={tx('Invoices')} subtitle={tx('Receipts from paid plans')} back />}>
      {invoicesQuery.isError ? (
        <EmptyState title={tx('Could not load invoices')} body={tx('Pull down to try again.')} />
      ) : invoices.length ? invoices.map((row, index) => {
        const id = String(row.id ?? row.invoice_id ?? index);
        const number = textOf(row, 'number', 'invoice_number', 'reference') || id;
        const plan = textOf(row, 'plan');
        const status = textOf(row, 'status', 'state');
        const rawDate = textOf(row, 'date', 'invoice_date', 'created_at');
        const cents = priceCents(row.amount_cents) ?? priceCents(row.total_cents);
        return (
          <Card key={id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.copy}>
                <Text style={[styles.number, { fontSize: type.cardTitle }]} numberOfLines={1}>{number}</Text>
                <Text style={[styles.meta, { fontSize: type.small, lineHeight: type.small + 4 }]} numberOfLines={2}>
                  {[plan, rawDate ? dateLong(rawDate.slice(0, 10)) : ''].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <View style={styles.metaCol}>
                {cents != null ? <Text style={[styles.amount, { fontSize: type.secondary }]}>{money(cents / 100)}</Text> : null}
                {status ? <Text style={[styles.status, { fontSize: type.micro }, status.toLowerCase() === 'paid' && styles.statusPaid]}>{status}</Text> : null}
              </View>
            </View>
          </Card>
        );
      }) : (
        <EmptyState icon="receipt" title={tx('No invoices yet')} body={tx('A paid Mollie payment adds an invoice here.')} />
      )}
    </Screen>
  );
}

function invoiceRows(data: unknown) {
  if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray((data as { invoices?: unknown }).invoices)) {
    return rowsOf((data as { invoices: unknown }).invoices);
  }
  return rowsOf(data);
}

function priceCents(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

const styles = StyleSheet.create({
  card: { paddingVertical: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flex: 1, gap: 4 },
  number: { color: palette.ink, fontWeight: '800' },
  meta: { color: palette.inkSecondary },
  metaCol: { alignItems: 'flex-end', gap: 6 },
  amount: { color: palette.accentDark, fontWeight: '800' },
  status: { overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: palette.well, color: palette.muted, fontWeight: '800', textTransform: 'capitalize' },
  statusPaid: { backgroundColor: palette.accentSoft, color: palette.accentDark },
});
