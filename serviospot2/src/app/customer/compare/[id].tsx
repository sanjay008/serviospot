import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { LangToggle } from '@/components/LangToggle';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { money } from '@/data/format';
import { b } from '@/data/options';
import { useApp } from '@/state/app';

export default function CompareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang, requests, proposalsFor } = useApp();
  const request = requests.find((item) => item.id === id);
  const proposals = request ? proposalsFor(request.id) : [];

  if (!request || proposals.length === 0) {
    return (
      <Screen header={<Header title={t(b('Vergelijken', 'Compare'))} back right={<LangToggle />} />}>
        <EmptyState icon="compare" title={t(b('Niets te vergelijken', 'Nothing to compare'))} body={t(b('Ontvang eerst voorstellen.', 'Receive proposals first.'))} action={t(b('Terug', 'Back'))} onAction={() => router.back()} />
      </Screen>
    );
  }

  const labels = proposals[0].lines.map((line) => line.label);
  const cellWidth = 128;

  return (
    <Screen header={<Header title={t(b('Vergelijken', 'Compare'))} subtitle={`${request.reference} · ${proposals.length} ${t(b('voorstellen', 'proposals'))}`} back right={<LangToggle />} />}>
      <Notice tone="info" body={t(b('Dezelfde meetlat: wens en aanbod naast elkaar. Een lage prijs mag kleiner aanbod niet verbergen.', 'Same measures: request and offers side by side. A low price must not hide reduced scope.'))} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.table}>
        <View>
          <View style={styles.headerRow}>
            <View style={[styles.labelCell, styles.headerCell]}>
              <Text style={styles.headerTitle}>{t(b('Onderdeel', 'Item'))}</Text>
            </View>
            {proposals.map((proposal) => (
              <View key={proposal.id} style={[styles.cell, styles.headerCell, { width: cellWidth }]}>
                <Text style={styles.provider}>{proposal.providerName}</Text>
                <Text style={styles.providerPrice}>{money(proposal.total, lang)}</Text>
                <Text style={styles.providerMatch}>
                  {proposal.matchScore}% {t(b('match', 'match'))}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.row}>
            <View style={styles.labelCell}>
              <Text style={styles.label}>{t(b('Prijs incl. btw', 'Price incl. VAT'))}</Text>
            </View>
            {proposals.map((proposal) => (
              <View key={proposal.id} style={[styles.cell, { width: cellWidth }]}>
                <Text style={styles.valueStrong}>{money(proposal.total, lang)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.row}>
            <View style={styles.labelCell}>
              <Text style={styles.label}>{t(b('Prijs per gast', 'Price per guest'))}</Text>
            </View>
            {proposals.map((proposal) => (
              <View key={proposal.id} style={[styles.cell, { width: cellWidth }]}>
                <Text style={styles.value}>{money(proposal.perGuest, lang)}</Text>
              </View>
            ))}
          </View>

          {labels.map((label, index) => (
            <View key={label.en} style={styles.row}>
              <View style={styles.labelCell}>
                <Text style={styles.label}>{t(label)}</Text>
              </View>
              {proposals.map((proposal) => {
                const line = proposal.lines[index];
                return (
                  <View key={proposal.id} style={[styles.cell, { width: cellWidth }]}>
                    <Text style={[styles.value, line.differs && styles.differsText]}>{line.offered}</Text>
                    {line.differs ? <Text style={styles.diffTag}>{t(b('wijkt af', 'differs'))}</Text> : null}
                  </View>
                );
              })}
            </View>
          ))}

          <View style={styles.row}>
            <View style={styles.labelCell}>
              <Text style={styles.label}>{t(b('Borg (apart)', 'Deposit (separate)'))}</Text>
            </View>
            {proposals.map((proposal) => (
              <View key={proposal.id} style={[styles.cell, { width: cellWidth }]}>
                <Text style={styles.value}>{money(proposal.deposit, lang)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.row}>
            <View style={styles.labelCell}>
              <Text style={styles.label}>{t(b('Actie', 'Action'))}</Text>
            </View>
            {proposals.map((proposal) => (
              <View key={proposal.id} style={[styles.cell, { width: cellWidth }]}>
                <Button label={t(b('Open', 'Open'))} variant="secondary" onPress={() => router.push(`/customer/proposal/${proposal.id}`)} />
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
  label: { fontSize: 13, color: palette.muted },
  cell: { padding: 10, gap: 2, backgroundColor: palette.surface, justifyContent: 'center' },
  headerTitle: { fontSize: 13, fontWeight: '800', color: palette.accentDark },
  provider: { fontSize: 14, fontWeight: '800', color: palette.ink },
  providerPrice: { fontSize: 15, fontWeight: '800', color: palette.ink },
  providerMatch: { fontSize: 12, color: palette.muted },
  value: { fontSize: 13, color: palette.ink },
  valueStrong: { fontSize: 15, fontWeight: '800', color: palette.ink },
  differsText: { color: palette.warning, fontWeight: '700' },
  diffTag: { fontSize: 11, fontWeight: '700', color: palette.warning },
});
