import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/flow2/components/Badge';
import { Button } from '@/flow2/components/Button';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { LangToggle } from '@/flow2/components/LangToggle';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';
import { SectionTitle } from '@/flow2/components/SectionTitle';
import { palette } from '@/flow2/constants/theme';
import { dateLong, money } from '@/flow2/data/format';
import { b } from '@/flow2/data/options';
import { useApp } from '@/flow2/state/app';

export default function ProposalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang, requests, proposalsFor, setProposalStatus } = useApp();
  const proposal = requests.flatMap((request) => proposalsFor(request.id)).find((item) => item.id === id);

  if (!proposal) {
    return (
      <Screen header={<Header title={t(b('Voorstel', 'Proposal'))} back right={<LangToggle />} />}>
        <EmptyState icon="doc" title={t(b('Niet gevonden', 'Not found'))} body={t(b('Dit voorstel bestaat niet.', 'This proposal does not exist.'))} action={t(b('Terug', 'Back'))} onAction={() => router.back()} />
      </Screen>
    );
  }

  const statusLabel: Record<string, { nl: string; en: string }> = {
    new: b('Nieuw', 'New'),
    interested: b('Interesse · nog geen keuze', 'Interested · no decision yet'),
    contact: b('Contact aangevraagd', 'Contact requested'),
    rejected: b('Afgewezen', 'Rejected'),
    sent: b('Verzonden', 'Sent'),
  };

  return (
    <Screen header={<Header title={proposal.providerName} subtitle={t(b('Indicatief all-invoorstel', 'Indicative all-in proposal'))} back right={<LangToggle />} />}>
      <View style={styles.top}>
        <Badge label={t(statusLabel[proposal.status])} tone={proposal.status === 'rejected' ? 'bad' : proposal.status === 'contact' ? 'good' : 'accent'} />
        <Text style={styles.score}>
          {t(b('Matchscore', 'Match score'))} {proposal.matchScore}%
        </Text>
      </View>
      <Text style={styles.price}>
        {money(proposal.total, lang)} <Text style={styles.perGuest}>· {money(proposal.perGuest, lang)} {t(b('per persoon', 'per guest'))}</Text>
      </Text>
      <Text style={styles.paragraph}>{t(proposal.description)}</Text>
      <Text style={styles.paragraph}>{t(proposal.notes)}</Text>

      <SectionTitle title={t(b('Klant vraagt vs aanbieder biedt', 'Customer asks vs provider offers'))} />
      {proposal.lines.map((line) => (
        <View key={line.label.en} style={styles.lineRow}>
          <Text style={styles.lineLabel}>{t(line.label)}</Text>
          <Text style={styles.lineRequested}>{line.requested}</Text>
          <Text style={[styles.lineOffered, line.differs && styles.differs]}>{line.offered}</Text>
        </View>
      ))}

      <View style={styles.priceLines}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>{t(b('Prijs incl. toepasselijke btw', 'Price incl. applicable VAT'))}</Text>
          <Text style={styles.priceValue}>{money(proposal.total, lang)}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>{t(b('Terugbetaalbare borg (apart)', 'Refundable deposit (separate)'))}</Text>
          <Text style={styles.priceValue}>{money(proposal.deposit, lang)}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>{t(b('Geldig tot', 'Valid until'))}</Text>
          <Text style={styles.priceValue}>{dateLong(proposal.validUntil, lang)}</Text>
        </View>
      </View>

      <Notice tone="info" body={t(b('Unknown of niet vermeld betekent niet inbegrepen. Vergelijk op dezelfde rijen.', 'Unknown or not stated does not mean included. Compare on identical rows.'))} />

      {proposal.contactReleased ? (
        <Notice tone="success" title={t(b('Contact gedeeld', 'Contacts shared'))} body={`klant@example.com  ·  +31 6 0000 0000\nroyal@example.com  ·  +31 6 0000 0001`} />
      ) : (
        <View style={styles.decisions}>
          <Button label={t(b('1 · Afwijzen', '1 · Reject'))} variant="secondary" onPress={() => { setProposalStatus(proposal.id, 'rejected'); router.back(); }} />
          <Button label={t(b('2 · Interesse, nog geen keuze', '2 · Interested, no decision'))} variant="secondary" onPress={() => { setProposalStatus(proposal.id, 'interested'); router.back(); }} />
          <Button label={t(b('3 · Meer weten: contact opnemen', '3 · Learn more: request contact'))} onPress={() => router.push(`/flow2/customer/continue/${proposal.id}`)} />
        </View>
      )}

      <Button label={t(b('Terug', 'Back'))} variant="ghost" onPress={() => router.back()} />
      <Notice tone="accent" body={t(b('Contact aanvragen is geen boeking of definitieve gunning.', 'Requesting contact is not a booking or final award.'))} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  score: { fontSize: 14, color: palette.muted },
  price: { fontSize: 26, fontWeight: '800', color: palette.ink },
  perGuest: { fontSize: 14, fontWeight: '500', color: palette.muted },
  paragraph: { fontSize: 14, lineHeight: 21, color: palette.ink },
  lineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: palette.surface, borderRadius: 12, borderWidth: 1, borderColor: palette.line, padding: 12 },
  lineLabel: { flex: 1, fontSize: 13, color: palette.muted },
  lineRequested: { flex: 1, fontSize: 13, color: palette.ink, textAlign: 'right' },
  lineOffered: { flex: 1, fontSize: 13, fontWeight: '700', color: palette.ink, textAlign: 'right' },
  differs: { color: palette.warning },
  priceLines: { backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.line, padding: 14, gap: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceLabel: { fontSize: 14, color: palette.muted },
  priceValue: { fontSize: 15, fontWeight: '700', color: palette.ink },
  decisions: { gap: 10 },
});
