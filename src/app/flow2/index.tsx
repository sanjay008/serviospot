import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { Icon, type IconName } from '@/flow2/components/Icon';
import { PageTitle } from '@/flow2/components/Header';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { b } from '@/flow2/data/options';
import { useApp } from '@/flow2/state/app';

function RoleCard({ icon, title, subtitle, points, cta, onPress }: { icon: IconName; title: string; subtitle: string; points: string[]; cta: string; onPress: () => void }) {
  return (
    <Card style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.iconWell}>
          <Icon name={icon} color={palette.accent} size={24} />
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSub}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.points}>
        {points.map((point) => (
          <View key={point} style={styles.point}>
            <Icon name="check" color={palette.mintDark} size={16} />
            <Text style={styles.pointText}>{point}</Text>
          </View>
        ))}
      </View>
      <Button label={cta} onPress={onPress} />
    </Card>
  );
}

export default function HomeScreen() {
  const { t, lang, toggleLang, setRole } = useApp();

  return (
    <Screen
      header={
        <View style={styles.topbar}>
          <View style={styles.brand}>
            <Pressable onPress={() => router.replace('/role')} style={styles.back} accessibilityRole="button" accessibilityLabel="Go back">
              <Icon name="back" color={palette.ink} size={18} />
            </Pressable>
            <View style={styles.logo}>
              <Text style={styles.logoText}>S</Text>
            </View>
            <Text style={styles.brandName}>ServioSpot</Text>
          </View>
          <Pressable onPress={toggleLang} style={styles.lang} accessibilityRole="button">
            <Icon name="globe" color={palette.ink} size={16} />
            <Text style={styles.langText}>{lang === 'nl' ? 'NL' : 'EN'}</Text>
          </Pressable>
        </View>
      }>
      <PageTitle title={t(b('Zo werkt ServioSpot', 'How ServioSpot works'))} subtitle={t(b('Eén aanvraag. Eerlijk vergelijken. Kies hieronder een flow.', 'One request. Fair comparison. Pick a flow below.'))} />

      <RoleCard
        icon="person"
        title={t(b('Klantflow', 'Customer flow'))}
        subtitle={t(b('Van aanvraag naar vergelijkbare all-invoorstellen en persoonlijk contact.', 'From a request to comparable all-in proposals and personal contact.'))}
        points={[
          t(b('Zoek aanbieders of vraag direct aan', 'Search providers or request directly')),
          t(b('5-staps aanvraagwizard met live telling', '5-step request wizard with live counts')),
          t(b('Offertes vergelijken en contact delen', 'Compare proposals and share contacts')),
        ]}
        cta={t(b('Start klantflow', 'Start customer flow'))}
        onPress={() => {
          setRole('customer');
          router.push('/flow2/customer');
        }}
      />

      <RoleCard
        icon="store"
        title={t(b('Aanbiederflow', 'Vendor flow'))}
        subtitle={t(b('Onboarding, aanvragen beoordelen en een volledig all-invoorstel sturen.', 'Onboarding, review requests and send a complete all-in proposal.'))}
        points={[
          t(b('8-staps onboarding met verificatie', '8-step onboarding with verification')),
          t(b('Inbox met geanonimiseerde aanvragen', 'Inbox with anonymised requests')),
          t(b('Beschikbaarheid en één all-inprijs', 'Availability and one all-in price')),
        ]}
        cta={t(b('Start aanbiederflow', 'Start vendor flow'))}
        onPress={() => {
          setRole('vendor');
          router.push('/flow2/vendor');
        }}
      />

      <Notice tone="accent" title={t(b('Demonstratie', 'Demonstration'))} body={t(b('Fictieve aanbieders en statische data. Er wordt niets verstuurd of geboekt.', 'Fictional providers and static data. Nothing is sent or booked.'))} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  back: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 36, height: 36, borderRadius: 10, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  brandName: { fontSize: 18, fontWeight: '800', color: palette.ink },
  lang: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  langText: { fontSize: 13, fontWeight: '700', color: palette.ink },
  card: { gap: 12 },
  cardHead: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconWell: { width: 48, height: 48, borderRadius: 14, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: palette.ink },
  cardSub: { fontSize: 14, lineHeight: 20, color: palette.muted },
  points: { gap: 8 },
  point: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  pointText: { flex: 1, fontSize: 14, color: palette.ink },
});
