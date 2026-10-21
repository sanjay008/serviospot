import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { ChipSingle } from '@/flow2/components/Chip';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Field } from '@/flow2/components/Field';
import { Header } from '@/flow2/components/Header';
import { Icon } from '@/flow2/components/Icon';
import { Input } from '@/flow2/components/Input';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';
import { SectionTitle } from '@/flow2/components/SectionTitle';
import { palette } from '@/flow2/constants/theme';
import { money } from '@/flow2/data/format';
import { b, eventNameForOccasion } from '@/flow2/data/options';
import type { Availability } from '@/flow2/data/types';
import { useApp } from '@/flow2/state/app';

export default function VendorProposalBuilderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang, leads, sendVendorProposal } = useApp();
  const lead = leads.find((item) => item.id === id);

  const [availability, setAvailability] = useState<Availability>('full');
  const [foodPrice, setFoodPrice] = useState('2200');
  const [staffPrice, setStaffPrice] = useState('500');
  const [materialPrice, setMaterialPrice] = useState('150');
  const [travelPrice, setTravelPrice] = useState('125');
  const [deposit, setDeposit] = useState('0');
  const [validUntil, setValidUntil] = useState('2026-11-01');
  const [sent, setSent] = useState(false);

  if (!lead) {
    return (
      <Screen header={<Header title={t(b('Voorstel', 'Proposal'))} back />}>
        <EmptyState icon="inbox" title={t(b('Niet gevonden', 'Not found'))} body={t(b('Deze aanvraag bestaat niet.', 'This request does not exist.'))} action={t(b('Terug', 'Back'))} onAction={() => router.back()} />
      </Screen>
    );
  }

  const total = [foodPrice, staffPrice, materialPrice, travelPrice].reduce((sum, value) => sum + (Number(value) || 0), 0);
  const perGuest = Math.round((total / (lead.request.guests || 1)) * 100) / 100;

  const send = () => {
    sendVendorProposal(lead.id, { availability, total, perGuest, deposit: Number(deposit) || 0, validUntil });
    setSent(true);
  };

  if (sent) {
    return (
      <Screen header={<Header title={t(b('Voorstel verzonden', 'Proposal sent'))} back={false} />}>
        <Card>
          <View style={styles.doneHead}>
            <View style={styles.doneIcon}>
              <Icon name="send" color={palette.accent} size={22} />
            </View>
            <Text style={styles.doneTitle}>{t(b('Voorstel verzonden', 'Proposal sent'))}</Text>
          </View>
          <Text style={styles.doneText}>
            {t(b('All-inprijs', 'All-in price'))}: {money(total, lang)} · {money(perGuest, lang)} {t(b('p.p.', 'p.p.'))} · {t(b('borg', 'deposit'))} {money(Number(deposit) || 0, lang)}
          </Text>
          <Notice tone="accent" body={t(b('Nooit een verstuurd voorstel stilzwijgend wijzigen. Een inhoudelijke wijziging maakt een nieuwe versie.', 'Never silently edit a sent proposal. A material change creates a new version.'))} />
          <Button label={t(b('Ga naar voorstellen', 'Go to proposals'))} onPress={() => router.replace('/vendor/proposals' as any)} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      header={<Header title={t(b('Voorstel maken', 'Compose proposal'))} subtitle={t(eventNameForOccasion(lead.request.occasion))} back />}
      footer={<Button label={t(b('Voorstel versturen', 'Send proposal'))} onPress={send} />}>
      <Card>
        <SectionTitle title={t(b('Beschikbaarheid', 'Availability'))} />
        <Field>
          <ChipSingle
            options={['full', 'partial', 'conditional', 'none']}
            value={availability}
            onChange={(value) => setAvailability(value as Availability)}
            labelOf={(value) => (value === 'full' ? t(b('Volledig', 'Full')) : value === 'partial' ? t(b('Gedeeltelijk', 'Partial')) : value === 'conditional' ? t(b('Onder voorbehoud', 'Conditional')) : t(b('Niet beschikbaar', 'Unavailable')))}
          />
        </Field>
      </Card>

      <Card>
        <SectionTitle title={t(b('Positiebasering per gast', 'Portion basis per guest'))} subtitle={`${lead.request.guests} ${t(b('gasten', 'guests'))}`} />
        <Notice tone="info" body={t(b('Vermeld of het aanbod voldoende is voor alle gasten of een selectie per gast.', 'State whether the offer is enough for all guests or a selection per guest.'))} />
      </Card>

      <Card>
        <SectionTitle title={t(b('Eén all-inprijs (incl. btw)', 'One all-in price (incl. VAT)'))} subtitle={t(b('Uitsplitsing telt exact op tot het totaal.', 'The breakdown adds up exactly to the total.'))} />
        <Input label={t(b('Eten incl. btw (€)', 'Food incl. VAT (€)'))} value={foodPrice} onChangeText={setFoodPrice} keyboardType="numeric" />
        <Input label={t(b('Personeel incl. btw (€)', 'Staff incl. VAT (€)'))} value={staffPrice} onChangeText={setStaffPrice} keyboardType="numeric" />
        <Input label={t(b('Materialen incl. btw (€)', 'Equipment incl. VAT (€)'))} value={materialPrice} onChangeText={setMaterialPrice} keyboardType="numeric" />
        <Input label={t(b('Vervoer incl. btw (€)', 'Transport incl. VAT (€)'))} value={travelPrice} onChangeText={setTravelPrice} keyboardType="numeric" />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t(b('Totaal', 'Total'))}</Text>
          <Text style={styles.totalValue}>{money(total, lang)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t(b('Per gast', 'Per guest'))}</Text>
          <Text style={styles.totalValue}>{money(perGuest, lang)}</Text>
        </View>
      </Card>

      <Card>
        <Input label={t(b('Terugbetaalbare borg (€), apart', 'Refundable deposit (€), separate'))} value={deposit} onChangeText={setDeposit} keyboardType="numeric" />
        <Input label={t(b('Geldig tot', 'Valid until'))} value={validUntil} onChangeText={setValidUntil} autoCapitalize="none" hint={t(b('Formaat: JJJJ-MM-DD', 'Format: YYYY-MM-DD'))} />
      </Card>

      <Notice tone="warning" body={t(b('Onopgeloste allergie- of veiligheidseis blokkeert doorgaan. Onbekend is geen garantie.', 'An unresolved allergy or safety requirement blocks continuing. Unknown is not a guarantee.'))} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: palette.ink },
  totalValue: { fontSize: 18, fontWeight: '800', color: palette.accentDark },
  doneHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  doneIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 18, fontWeight: '800', color: palette.ink },
  doneText: { fontSize: 14, lineHeight: 21, color: palette.ink },
});
