import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { LangToggle } from '@/components/LangToggle';
import { ListRow } from '@/components/ListRow';
import { Notice } from '@/components/Notice';
import { Pill, SectionTitle } from '@/components/SectionTitle';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { b } from '@/data/options';
import { useApp } from '@/state/app';

export default function VendorDashboardScreen() {
  const { t, onboarding, leads, setRole } = useApp();
  const approved = onboarding.status === 'approved';
  const newLeads = leads.filter((lead) => lead.status === 'invited' || lead.status === 'opened').length;
  const sentProposals = leads.filter((lead) => lead.proposal).length;

  return (
    <Screen
      header={
        <Header
          title={t(b('Aanbieder dashboard', 'Vendor dashboard'))}
          subtitle={onboarding.profileName || t(b('Officieel 2e ServioSpot prototype', 'Official 2nd ServioSpot prototype'))}
          back
          right={<LangToggle />}
        />
      }
      footer={<Button label={t(b('Bekijk de klantflow', 'View the customer flow'))} variant="secondary" onPress={() => { setRole('customer'); router.push('/customer'); }} />}>
      <Card>
        <View style={styles.statusHead}>
          <Text style={styles.statusTitle}>{t(b('Onboarding', 'Onboarding'))}</Text>
          <Badge
            label={
              onboarding.status === 'approved'
                ? t(b('Goedgekeurd', 'Approved'))
                : onboarding.status === 'pending'
                  ? t(b('Wacht op beoordeling', 'Pending review'))
                  : onboarding.status === 'rejected'
                    ? t(b('Aanpassing nodig', 'Changes required'))
                    : t(b('Concept', 'Draft'))
            }
            tone={approved ? 'good' : onboarding.status === 'rejected' ? 'bad' : 'warn'}
          />
        </View>
        <Text style={styles.statusText}>
          {approved
            ? t(b('Profiel openbaar en proefperiode actief. Ontvang aanvragen en stuur voorstellen.', 'Profile public and trial active. Receive requests and send proposals.'))
            : t(b('Rond de 8 stappen af. E-mail en telefoon moeten geverifieerd zijn.', 'Complete the 8 steps. Email and phone must be verified.'))}
        </Text>
        <Button label={approved ? t(b('Bekijk onboarding', 'View onboarding')) : t(b('Start onboarding', 'Start onboarding'))} onPress={() => router.push('/vendor/onboarding')} />
      </Card>

      <View style={styles.metrics}>
        <Card style={styles.metric}>
          <Text style={styles.metricValue}>{newLeads}</Text>
          <Text style={styles.metricLabel}>{t(b('Nieuwe aanvragen', 'New leads'))}</Text>
        </Card>
        <Card style={styles.metric}>
          <Text style={styles.metricValue}>{sentProposals}</Text>
          <Text style={styles.metricLabel}>{t(b('Voorstellen', 'Proposals'))}</Text>
        </Card>
        <Card style={styles.metric}>
          <Text style={styles.metricValue}>0</Text>
          <Text style={styles.metricLabel}>{t(b('Contacten', 'Contacts'))}</Text>
        </Card>
      </View>

      <SectionTitle title={t(b('Aanbiederflow', 'Vendor flow'))} subtitle={t(b('Dezelfde vragen als de klant, ja/nee per onderdeel.', 'The same questions as the customer, yes/no per item.'))} />
      <Card style={styles.listCard}>
        <ListRow icon="inbox" title={t(b('Aanvragen inbox', 'Request inbox'))} subtitle={`${leads.length} ${t(b('uitnodigingen', 'invitations'))}`} onPress={() => router.push('/vendor/leads')} />
        <ListRow icon="send" title={t(b('Voorstellen & reacties', 'Proposals & responses'))} subtitle={`${sentProposals} ${t(b('verzonden', 'sent'))}`} onPress={() => router.push('/vendor/proposals')} />
        <ListRow icon="calendar" title={t(b('Kalender & capaciteit', 'Calendar & capacity'))} subtitle={t(b('Blokkeer dagen per service', 'Block dates per service'))} onPress={() => router.push('/vendor/leads')} />
        <ListRow icon="chart" title={t(b('Statistieken', 'Analytics'))} subtitle={t(b('Weergaven → aanvragen → contacten', 'Views → requests → contacts'))} onPress={() => router.push('/vendor/proposals')} />
      </Card>

      <Notice tone="accent" title={t(b('Geen privécontacten vóór een match', 'No private contacts before a match'))} body={t(b('Aanvragen zijn geanonimiseerd. Contactgegevens worden pas gedeeld na expliciete toestemming van de klant.', 'Requests are anonymised. Contact details are shared only after explicit customer consent.'))} />

      <View style={styles.pills}>
        <Pill label={t(b('6 maanden gratis', '6 months free'))} tone="good" />
        <Pill label={t(b('Gold', 'Gold'))} tone="accent" />
        <Pill label={t(b('Geen boekingsstatus', 'No booking state'))} tone="neutral" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusTitle: { fontSize: 16, fontWeight: '700', color: palette.ink },
  statusText: { fontSize: 14, lineHeight: 20, color: palette.muted },
  metrics: { flexDirection: 'row', gap: 10 },
  metric: { flex: 1, alignItems: 'center', gap: 2 },
  metricValue: { fontSize: 22, fontWeight: '800', color: palette.accentDark },
  metricLabel: { fontSize: 12, color: palette.muted, textAlign: 'center' },
  listCard: { paddingVertical: 4 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
