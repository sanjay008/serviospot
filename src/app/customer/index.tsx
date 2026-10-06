import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { LoadingState } from '@/components/LoadingState';
import { ProviderCard } from '@/components/ProviderCard';
import { Screen } from '@/components/Screen';
import { SearchBar } from '@/components/SearchBar';
import { palette } from '@/constants/theme';
import { useApp } from '@/state/store';

const TILES: { label: string; icon: IconName; color: string; ink: string }[] = [
  { label: 'Food', icon: 'food', color: '#F3EFFF', ink: '#7C5CFF' },
  { label: 'Drinks', icon: 'drink', color: '#E0F2FE', ink: '#0284C7' },
  { label: 'Staff', icon: 'people', color: '#FEF3C7', ink: '#D97706' },
  { label: 'Dessert', icon: 'spark', color: '#FCE7F3', ink: '#DB2777' },
  { label: 'Ice cream', icon: 'ice', color: '#DCFCE7', ink: '#059669' },
  { label: 'Coffee', icon: 'coffee', color: '#F3E8FF', ink: '#7C3AED' },
  { label: 'Gear', icon: 'box', color: '#F4F2FA', ink: '#4C4668' },
];

export default function DiscoverScreen() {
  const { providers, favorites, toggleFavorite, notifications } = useApp();
  const [loading, setLoading] = useState(true);
  const unread = notifications.filter((item) => item.audience === 'customer' && !item.read).length;
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Screen tab>
      <View style={styles.top}>
        <View style={styles.titles}>
          <Text style={styles.title}>Home</Text>
          <Text style={styles.sub}>Find a caterer for your event</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={() => router.push('/notifications')} style={styles.bell}>
          <Icon name="bell" color={palette.ink} size={18} />
          {unread > 0 ? <View style={styles.dot} /> : null}
        </Pressable>
      </View>
      <Pressable onPress={() => router.push('/search')}>
        <SearchBar value="" placeholder="City, cuisine, or name" />
      </Pressable>
      <View style={styles.grid}>
        {TILES.map((tile) => (
          <Pressable key={tile.label} onPress={() => router.push(`/search?category=${encodeURIComponent(tile.label === 'Gear' ? 'Equipment' : tile.label === 'Dessert' ? 'Desserts' : tile.label)}`)} style={styles.tile}>
            <View style={[styles.well, { backgroundColor: tile.color }]}>
              <Icon name={tile.icon} color={tile.ink} size={20} />
            </View>
            <Text style={styles.tileLabel}>{tile.label}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={() => router.push('/quote')} style={styles.banner}>
        <View style={styles.bannerIcon}>
          <Icon name="doc" color={palette.accent} size={18} />
        </View>
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Ask for quotes</Text>
          <Text style={styles.bannerBody}>Date, guests and city. Prices are estimates.</Text>
        </View>
        <Icon name="chevron" color={palette.accent} size={16} />
      </Pressable>
      <Text style={styles.section}>Caterers</Text>
      {loading ? <LoadingState label="Finding caterers" /> : null}
      {!loading
        ? providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              saved={favorites.providers.includes(provider.id)}
              onPress={() => router.push(`/providers/${provider.id}`)}
              onSave={() => toggleFavorite('providers', provider.id)}
            />
          ))
        : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', paddingTop: 8 },
  titles: { flex: 1, gap: 2 },
  title: { fontSize: 26, fontWeight: '700', color: palette.ink },
  sub: { fontSize: 14, color: palette.muted },
  bell: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: palette.line, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: palette.danger },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '22%', flexGrow: 1, alignItems: 'center', gap: 6 },
  well: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontSize: 12, fontWeight: '600', color: palette.ink },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.accentSoft, padding: 14 },
  bannerIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  bannerText: { flex: 1, gap: 2 },
  bannerTitle: { color: palette.ink, fontSize: 16, fontWeight: '700' },
  bannerBody: { color: palette.muted, fontSize: 13, lineHeight: 18 },
  section: { fontSize: 18, fontWeight: '700', color: palette.ink, marginTop: 4 },
});
