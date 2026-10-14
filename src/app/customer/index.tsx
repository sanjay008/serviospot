import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Grid } from '@/components/Grid';
import { NotificationPrompt } from '@/components/NotificationPrompt';
import { Icon, type IconName } from '@/components/Icon';
import { LoadingState } from '@/components/LoadingState';
import { ProviderCard } from '@/components/ProviderCard';
import { Screen } from '@/components/Screen';
import { SearchBar } from '@/components/SearchBar';
import { palette } from '@/constants/theme';
import { useLoginGate } from '@/hooks/use-login-gate';
import { useResponsive } from '@/hooks/use-responsive';
import { useCustomerHomeSync, useMeSync, useNotificationsSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

// Category names and codes come from getCategories; only the picture for each code lives here.
const CATEGORY_ICONS: Record<string, IconName> = {
  food: 'food',
  drinks: 'drink',
  staff: 'people',
  full_service: 'store',
  desserts: 'party',
  ice_cream: 'ice',
  popcorn: 'party',
  coffee: 'coffee',
  mobile_unit: 'place',
  equipment: 'box',
};

export default function DiscoverScreen() {
  const { providers, categories, favorites, toggleFavorite, notifications } = useApp();
  const { requireLogin, gate } = useLoginGate();
  const loading = useCustomerHomeSync();
  useNotificationsSync('customer');
  useMeSync();
  const { isTablet } = useResponsive();
  const unread = notifications.filter((item) => item.audience === 'customer' && !item.read).length;

  return (
    <Screen tab refresh>
      <NotificationPrompt />
      <View style={styles.top}>
        <View style={styles.titles}>
          <Text style={styles.title} numberOfLines={2}>Catering for every occasion</Text>
          <Text style={styles.sub}>Find a caterer, compare prices, then choose one</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={() => router.push('/notifications')} style={styles.bell}>
          <Icon name="bell" color={palette.ink} size={18} />
          {unread > 0 ? <View style={styles.dot} /> : null}
        </Pressable>
      </View>
      <Pressable onPress={() => router.push('/search')}>
        <SearchBar value="" placeholder="City, cuisine, or name" />
      </Pressable>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        {categories.map((category) => (
          <Pressable key={category.code} onPress={() => router.push(`/search?category=${encodeURIComponent(category.code)}`)} style={styles.tile}>
            <View style={styles.well}>
              <Icon name={CATEGORY_ICONS[category.code] ?? 'food'} color={palette.accent} size={24} />
            </View>
            <Text style={styles.tileLabel} numberOfLines={2}>
              {category.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <Pressable onPress={() => requireLogin('/quote')} style={styles.banner}>
        <View style={styles.bannerIcon}>
          <Icon name="doc" color={palette.accent} size={18} />
        </View>
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Ask caterers for a price</Text>
          <Text style={styles.bannerBody}>Tell them the date, city and how many guests. The price is an estimate.</Text>
        </View>
        <Icon name="chevron" color={palette.accent} size={16} />
      </Pressable>
      <Text style={styles.section}>Caterers near you</Text>
      {loading ? <LoadingState label="Finding caterers" /> : null}
      {!loading && providers.length === 0 ? <EmptyState icon="store" title="No caterers yet" body="Caterers appear here as soon as they join." /> : null}
      {!loading && providers.length > 0 ? (
        <Grid minItem={300} maxColumns={isTablet ? 2 : 1} gap={12}>
          {providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              saved={favorites.providers.includes(provider.id)}
              compact
              onPress={() => router.push(`/providers/${provider.id}`)}
              onSave={() => toggleFavorite('providers', provider.id)}
            />
          ))}
        </Grid>
      ) : null}
      {gate}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', paddingTop: 8 },
  titles: { flex: 1, gap: 2, minWidth: 0 },
  title: { fontSize: 24, fontWeight: '700', color: palette.ink, lineHeight: 30 },
  sub: { fontSize: 14, color: palette.muted, lineHeight: 20 },
  bell: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: palette.line, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: palette.danger },
  categoryRow: { gap: 14, paddingRight: 4 },
  tile: { alignItems: 'center', gap: 6, width: 72 },
  well: { width: 56, height: 56, borderRadius: 18, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontSize: 12, fontWeight: '600', color: palette.ink, textAlign: 'center' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.accentSoft, padding: 14 },
  bannerIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  bannerText: { flex: 1, gap: 2 },
  bannerTitle: { color: palette.ink, fontSize: 16, fontWeight: '700' },
  bannerBody: { color: palette.muted, fontSize: 13, lineHeight: 18 },
  section: { fontSize: 18, fontWeight: '700', color: palette.ink, marginTop: 4 },
});
