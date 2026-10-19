import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/flow2/components/Badge';
import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Icon } from '@/flow2/components/Icon';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';
import { SectionTitle } from '@/flow2/components/SectionTitle';
import { palette } from '@/flow2/constants/theme';
import { money } from '@/flow2/data/format';
import { b } from '@/flow2/data/options';
import { useApp } from '@/flow2/state/app';

export default function VendorProposalsScreen() {
  const { t, lang, leads, providers } = useApp();
  const sent = leads.filter((lead) => lead.proposal);

  return (
    <Screen header={<Header title={t(b('Proposals & responses', 'Proposals & responses'))} subtitle={t(b('Elke aanbieder ziet alleen eigen voorstellen.', 'Each provider sees only their own proposals.'))} back  />}>
      <Notice tone="accent" body={t(b('Analytics: profielweergaven → uitnodigingen → beschikbaarheid → voorstellen → contacten. Contacten zijn geen bewezen omzet.', 'Metrics: profile views → invitations → availability → proposals → contacts. Contacts are not verified revenue.'))} />

      <SectionTitle title={t(b('Verzonden voorstellen', 'Sent proposals'))} />
      {sent.length === 0 ? (
        <EmptyState icon="send" title={t(b('Nog geen voorstellen', 'No proposals yet'))} body={t(b('Beoordeel een aanvraag en stuur een all-invoorstel.', 'Review a request and send an all-in proposal.'))} action={t(b('Naar inbox', 'Go to inbox'))} onAction={() => router.push('/vendor/leads' as any)} />
      ) : (
        sent.map((lead) => {
          const provider = providers.find((item) => item.id === lead.providerId);
          return (
            <Card key={lead.id}>
              <View style={styles.head}>
                <View style={styles.headText}>
                  <Text style={styles.ref}>{lead.reference}</Text>
                  <Text style={styles.provider}>{provider?.name ?? lead.providerId}</Text>
                </View>
                <Badge label={t(b('Verzonden', 'Sent'))} tone="good" />
              </View>
              <View style={styles.metaRow}>
                <Icon name="receipt" color={palette.muted} size={14} />
                <Text style={styles.metaText}>
                  {money(lead.proposal?.total ?? 0, lang)} · {money(lead.proposal?.perGuest ?? 0, lang)} {t(b('p.p.', 'p.p.'))}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Icon name="lock" color={palette.muted} size={14} />
                <Text style={styles.metaText}>{t(b('Klantcontact nog verborgen', 'Customer contact still hidden'))}</Text>
              </View>
              <Button label={t(b('Bekijk aanvraag', 'View request'))} variant="secondary" onPress={() => router.push(`/vendor/lead/${lead.id}` as any)} />
            </Card>
          );
        })
      )}

      <SectionTitle title={t(b('Klantreacties', 'Customer responses'))} />
      <Card>
        <Text style={styles.paragraph}>{t(b('Zodra een klant contact aanvraagt, verschijnt hier een melding met eigen contactbox en klantcontactbox. Interesse bewaren is geen contacttoestemming.', 'Once a customer requests contact, a notification appears here with your contact box and the customer contact box. Saving interest is not contact consent.'))}</Text>
        <View style={styles.metaRow}>
          <Icon name="chat" color={palette.muted} size={14} />
          <Text style={styles.metaText}>{t(b('Nog geen contactmeldingen (demo).', 'No contact notifications yet (demo).'))}</Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  headText: { flex: 1, gap: 2 },
  ref: { fontSize: 16, fontWeight: '800', color: palette.ink },
  provider: { fontSize: 13, color: palette.muted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: palette.muted },
  paragraph: { fontSize: 14, lineHeight: 21, color: palette.ink },
});
