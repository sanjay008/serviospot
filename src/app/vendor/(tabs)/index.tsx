import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { EmptyState } from '@/flow2/components/EmptyState';
import { Header } from '@/flow2/components/Header';
import { Icon } from '@/flow2/components/Icon';
import { MenuDishImage } from '@/flow2/components/MenuDishImage';
import { Screen } from '@/flow2/components/Screen';
import { SectionTitle } from '@/flow2/components/SectionTitle';
import { palette } from '@/flow2/constants/theme';
import { b } from '@/flow2/data/options';
import type { MenuItem } from '@/flow2/data/types';
import { useApp } from '@/flow2/state/app';

export default function VendorDashboardScreen() {
  const { t, lang, onboarding, leads, menuItems, setRole } = useApp();
  const newLeads = leads.filter((lead) => lead.status === 'invited' || lead.status === 'opened').length;
  const sentProposals = leads.filter((lead) => lead.proposal).length;
  const activeMenuItems = menuItems.filter((item) => item.active);
  const hiddenMenuItems = menuItems.length - activeMenuItems.length;

  return (
    <Screen
      header={(
        <Header
          title={onboarding.profileName || t(b('Vendor dashboard', 'Vendor dashboard'))}
          subtitle={t(b('Overview van aanvragen en je menu', 'A clear overview of requests and your menu'))}
        />
      )}
      footer={<Button label={t(b('Bekijk de klantflow', 'View the customer flow'))} variant="secondary" onPress={() => { setRole('customer'); router.push('/customer' as any); }} />}>
      <View style={styles.metrics}>
        <MetricCard label={t(b('Nieuwe aanvragen', 'New requests'))} value={newLeads} icon="inbox" onPress={() => router.push({ pathname: '/vendor/leads', params: { view: 'requests' } } as any)} />
        <MetricCard label={t(b('Verstuurde voorstellen', 'Proposals sent'))} value={sentProposals} icon="send" onPress={() => router.push({ pathname: '/vendor/leads', params: { view: 'proposals' } } as any)} />
      </View>

      <View style={styles.sectionHeading}>
        <View style={styles.sectionCopy}>
          <SectionTitle title={t(b('Jouw menu', 'Your menu'))} subtitle={t(b('Actieve pakketten die klanten op je profiel zien.', 'Active packages customers can see on your profile.'))} />
        </View>
        <Button label={t(b('Beheer menu', 'Manage menu'))} variant="secondary" onPress={() => router.push('/vendor/menu' as any)} style={styles.manageButton} />
      </View>

      {activeMenuItems.length === 0 ? (
        <Card style={styles.emptyMenu}>
          <EmptyState
            icon="food"
            title={t(b('Nog geen actief menu', 'No active menu yet'))}
            body={t(b('Voeg een pakket toe zodat klanten zien wat je aanbiedt en wat het kost.', 'Add a package so customers can see what you offer and the starting price.'))}
            action={t(b('Open menu beheren', 'Open menu manager'))}
            onAction={() => router.push('/vendor/menu' as any)}
          />
        </Card>
      ) : (
        <View style={styles.menuList}>
          {activeMenuItems.slice(0, 3).map((item) => <MenuPreviewCard key={item.id} item={item} lang={lang} />)}
          {activeMenuItems.length > 3 ? (
            <Text style={styles.moreText}>{t(b(`+ ${activeMenuItems.length - 3} meer actieve pakketten`, `+ ${activeMenuItems.length - 3} more active packages`))}</Text>
          ) : null}
          <View style={styles.menuFootnote}>
            <Icon name="eye" color={palette.muted} size={14} />
            <Text style={styles.footnoteText}>
              {t(b(`${activeMenuItems.length} actief${hiddenMenuItems ? ` · ${hiddenMenuItems} verborgen` : ''}`, `${activeMenuItems.length} active${hiddenMenuItems ? ` · ${hiddenMenuItems} hidden` : ''}`))}
            </Text>
          </View>
        </View>
      )}
    </Screen>
  );
}

function MetricCard({ label, value, icon, onPress }: { label: string; value: number; icon: 'inbox' | 'send'; onPress: () => void }) {
  return (
    <Card style={styles.metric}>
      <View style={styles.metricTop}>
        <View style={styles.metricIcon}><Icon name={icon} color={palette.accentDark} size={17} /></View>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Button label="View" variant="ghost" onPress={onPress} style={styles.metricAction} />
    </Card>
  );
}

function MenuPreviewCard({ item, lang }: { item: MenuItem; lang: 'nl' | 'en' }) {
  const price = new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-NL', { style: 'currency', currency: 'EUR' }).format(item.price);
  return (
    <Card style={styles.menuCard}>
      <MenuDishImage name={item.name} description={item.description} imageUri={item.imageUri} style={styles.menuImage} />
      <View style={styles.menuContent}>
        <View style={styles.menuTitleRow}>
          <Text style={styles.menuName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.activeBadge}><Text style={styles.activeBadgeText}>{lang === 'nl' ? 'Actief' : 'Active'}</Text></View>
        </View>
        <Text style={styles.menuDescription} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.menuPrice}>{price}<Text style={styles.perGuest}> / {lang === 'nl' ? 'gast' : 'guest'}</Text></Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', gap: 10 },
  metric: { flex: 1, minWidth: 0, padding: 12, gap: 6 },
  metricTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
  metricValue: { color: palette.ink, fontSize: 25, fontWeight: '800' },
  metricLabel: { color: palette.muted, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  metricAction: { minHeight: 32, alignSelf: 'flex-start', paddingHorizontal: 0 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionCopy: { flex: 1 },
  manageButton: { minHeight: 40, paddingHorizontal: 11 },
  emptyMenu: { padding: 8 },
  menuList: { gap: 9 },
  menuCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 13 },
  menuImage: { width: 76, height: 78, borderRadius: 14 },
  menuContent: { flex: 1, minWidth: 0, gap: 5 },
  menuTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  menuName: { flex: 1, color: palette.ink, fontSize: 15, fontWeight: '800' },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: palette.mint },
  activeBadgeText: { color: palette.mintDark, fontSize: 10, fontWeight: '800' },
  menuDescription: { color: palette.muted, fontSize: 12, lineHeight: 17 },
  menuPrice: { color: palette.accentDark, fontSize: 14, fontWeight: '800' },
  perGuest: { color: palette.muted, fontSize: 11, fontWeight: '500' },
  moreText: { color: palette.accentDark, fontSize: 12, fontWeight: '700', textAlign: 'center', paddingVertical: 2 },
  menuFootnote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingTop: 2 },
  footnoteText: { color: palette.muted, fontSize: 11 },
});
