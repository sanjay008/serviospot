import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/flow2/components/Button';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { useType } from '@/hooks/use-type';
import { money } from '@/flow2/data/format';
import { b } from '@/flow2/data/options';
import { useApp } from '@/flow2/state/app';

export default function CompareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang, requests, proposalsFor } = useApp();
  const type = useType();
  const request = requests.find((item) => item.id === id);
  const proposals = request ? proposalsFor(request.id) : [];

  if (!request || proposals.length === 0) {
    return (
      <Screen header={<Header title={t(b('Vergelijken', 'Compare'))} back />}>
        <EmptyState icon="compare" title={t(b('Niets te vergelijken', 'Nothing to compare'))} body={t(b('Ontvang eerst voorstellen.', 'Receive proposals first.'))} action={t(b('Terug', 'Back'))} onAction={() => router.back()} />
      </Screen>
    );
  }

  const labels = proposals[0].lines.map((line) => line.label);
  const cellWidth = 128;

  return (
    <Screen header={<Header title={t(b('Vergelijken', 'Compare'))} subtitle={`${request.reference} · ${proposals.length} ${t(b('voorstellen', 'proposals'))}`} back />}>
      <Notice tone="info" body={t(b('Dezelfde meetlat: wens en aanbod naast elkaar. Een lage prijs mag kleiner aanbod niet verbergen.', 'Same measures: request and offers side by side. A low price must not hide reduced scope.'))} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.table}>
        <View>
          <View style={styles.headerRow}>
            <View style={[styles.labelCell, styles.headerCell]}>
              <Text style={[styles.headerTitle, { fontSize: type.caption }]}>{t(b('Onderdeel', 'Item'))}</Text>
            </View>
            {proposals.map((proposal) => (
              <View key={proposal.id} style={[styles.cell, styles.headerCell, { width: cellWidth }]}>
                <Text style={[styles.provider, { fontSize: type.secondary }]}>{proposal.providerName}</Text>
                <Text style={[styles.providerPrice, { fontSize: type.body }]}>{money(proposal.total, lang)}</Text>
                <Text style={[styles.providerMatch, { fontSize: type.small }]}>
                  {proposal.matchScore}% {t(b('match', 'match'))}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.row}>
            <View style={styles.labelCell}>
              <Text style={[styles.label, { fontSize: type.caption }]}>{t(b('Prijs incl. btw', 'Price incl. VAT'))}</Text>
            </View>
            {proposals.map((proposal) => (
              <View key={proposal.id} style={[styles.cell, { width: cellWidth }]}>
                <Text style={[styles.valueStrong, { fontSize: type.body }]}>{money(proposal.total, lang)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.row}>
            <View style={styles.labelCell}>
              <Text style={[styles.label, { fontSize: type.caption }]}>{t(b('Prijs per gast', 'Price per guest'))}</Text>
            </View>
            {proposals.map((proposal) => (
              <View key={proposal.id} style={[styles.cell, { width: cellWidth }]}>
                <Text style={[styles.value, { fontSize: type.caption }]}>{money(proposal.perGuest, lang)}</Text>
              </View>
            ))}
          </View>

          {labels.map((label, index) => (
            <View key={label.en} style={styles.row}>
              <View style={styles.labelCell}>
                <Text style={[styles.label, { fontSize: type.caption }]}>{t(label)}</Text>
              </View>
              {proposals.map((proposal) => {
                const line = proposal.lines[index];
                return (
                  <View key={proposal.id} style={[styles.cell, { width: cellWidth }]}>
                    <Text style={[styles.value, { fontSize: type.caption }, line.differs && styles.differsText]}>{line.offered}</Text>
                    {line.differs ? <Text style={[styles.diffTag, { fontSize: type.micro }]}>{t(b('wijkt af', 'differs'))}</Text> : null}
                  </View>
                );
              })}
            </View>
          ))}

          <View style={styles.row}>
            <View style={styles.labelCell}>
              <Text style={[styles.label, { fontSize: type.caption }]}>{t(b('Borg (apart)', 'Deposit (separate)'))}</Text>
            </View>
            {proposals.map((proposal) => (
              <View key={proposal.id} style={[styles.cell, { width: cellWidth }]}>
                <Text style={[styles.value, { fontSize: type.caption }]}>{money(proposal.deposit, lang)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.row}>
            <View style={styles.labelCell}>
              <Text style={[styles.label, { fontSize: type.caption }]}>{t(b('Actie', 'Action'))}</Text>
            </View>
            {proposals.map((proposal) => (
              <View key={proposal.id} style={[styles.cell, { width: cellWidth }]}>
                <Button label={t(b('Open', 'Open'))} variant="secondary" onPress={() => router.push(`/customer/proposal/${proposal.id}` as any)} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <Notice tone="accent" body={t(b('Geen boekingsknop of accepteren. Contact delen pas na expliciete toestemming.', 'No book or accept button. Contacts only after explicit consent.'))} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  table: { paddingVertical: 4 },
  headerRow: { flexDirection: 'row' },
  row: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: palette.line },
  headerCell: { backgroundColor: palette.accentSoft, borderTopLeftRadius: 0 },
  labelCell: { width: 150, padding: 10, justifyContent: 'center', backgroundColor: palette.surface },
  label: { color: palette.muted },
  cell: { padding: 10, gap: 2, backgroundColor: palette.surface, justifyContent: 'center' },
  headerTitle: { fontWeight: '800', color: palette.accentDark },
  provider: { fontWeight: '800', color: palette.ink },
  providerPrice: { fontWeight: '800', color: palette.ink },
  providerMatch: { color: palette.muted },
  value: { color: palette.ink },
  valueStrong: { fontWeight: '800', color: palette.ink },
  differsText: { color: palette.warning, fontWeight: '700' },
  diffTag: { fontWeight: '700', color: palette.warning },
});
