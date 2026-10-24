import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { Header } from '@/flow2/components/Header';
import { Icon } from '@/flow2/components/Icon';
import { PackageCard } from '@/flow2/components/PackageCard';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { b } from '@/flow2/data/options';
import { useApp } from '@/flow2/state/app';
import { useResponsive } from '@/hooks/use-responsive';
import { useType } from '@/hooks/use-type';

type DashboardType = {
  metricValue: number;
  metricLabel: number;
  sectionTitle: number;
  sectionSub: number;
  icon: number;
};

function useDashboardType(): DashboardType {
  const scale = useType();
  const { width } = useResponsive();
  return {
    metricValue: scale.display,
    metricLabel: scale.small,
    sectionTitle: scale.sectionTitle,
    sectionSub: scale.small,
    icon: width < 360 ? 15 : width >= 768 ? 20 : 17,
  };
}

export default function VendorDashboardScreen() {
  const { t, onboarding, leads, packages } = useApp();
  const type = useDashboardType();
  const newLeads = leads.filter((lead) => lead.status === 'invited' || lead.status === 'opened').length;
  const sentProposals = leads.filter((lead) => lead.proposal).length;

  return (
    <Screen
      header={(
        <Header
          title={onboarding.profileName || t(b('Vendor dashboard', 'Vendor dashboard'))}
          subtitle={t(b('Overview van aanvragen en je pakketten', 'A clear overview of requests and your packages'))}
        />
      )}>
      <View style={styles.metrics}>
        <MetricCard label={t(b('Nieuwe aanvragen', 'New requests'))} value={newLeads} icon="inbox" type={type} onPress={() => router.push({ pathname: '/vendor/leads', params: { view: 'requests' } } as any)} />
        <MetricCard label={t(b('Verstuurde voorstellen', 'Proposals sent'))} value={sentProposals} icon="send" type={type} onPress={() => router.push({ pathname: '/vendor/leads', params: { view: 'proposals' } } as any)} />
      </View>

      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionTitle, { fontSize: type.sectionTitle, lineHeight: type.sectionTitle + 6 }]}>{t(b('Jouw pakketten', 'Your packages'))}</Text>
        <Text style={[styles.sectionSub, { fontSize: type.sectionSub, lineHeight: type.sectionSub + 5 }]}>{t(b('Gerechten die je kunt aanbieden, en voor hoeveel mensen.', 'Dishes you can offer, and for how many people.'))}</Text>
      </View>
      <Button label="+ Add package" onPress={() => router.push('/vendor/add-package')} />

      {packages.map((item) => <PackageCard key={item.id} item={item} />)}
    </Screen>
  );
}

function MetricCard({ label, value, icon, type, onPress }: { label: string; value: number; icon: 'inbox' | 'send'; type: DashboardType; onPress: () => void }) {
  return (
    <Card style={styles.metric}>
      <View style={styles.metricTop}>
        <View style={styles.metricIcon}><Icon name={icon} color={palette.accentDark} size={type.icon} /></View>
        <Text style={[styles.metricValue, { fontSize: type.metricValue, lineHeight: type.metricValue + 4 }]}>{value}</Text>
      </View>
      <Text style={[styles.metricLabel, { fontSize: type.metricLabel, lineHeight: type.metricLabel + 5 }]} numberOfLines={2}>{label}</Text>
      <Button label="View" variant="ghost" onPress={onPress} style={styles.metricAction} labelStyle={{ fontSize: type.metricLabel, lineHeight: type.metricLabel + 4 }} />
    </Card>
  );
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', gap: 10 },
  metric: { flex: 1, minWidth: 0, padding: 12, gap: 6 },
  metricTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
  metricValue: { color: palette.ink, fontWeight: '800' },
  metricLabel: { color: palette.muted, fontWeight: '600' },
  metricAction: { minHeight: 32, alignSelf: 'flex-start', paddingHorizontal: 0 },
  sectionHeading: { gap: 2 },
  sectionTitle: { color: palette.ink, fontWeight: '700' },
  sectionSub: { color: palette.muted },
});
