import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/flow2/components/Badge';
import { Icon } from '@/flow2/components/Icon';
import { palette } from '@/flow2/constants/theme';
import { money } from '@/flow2/data/format';
import { b } from '@/flow2/data/options';
import { PLAN_LABELS } from '@/flow2/data/seed';
import type { Provider } from '@/flow2/data/types';
import { useApp } from '@/flow2/state/app';
import { useType } from '@/hooks/use-type';

export function ProviderCard({ provider, onPress }: { provider: Provider; onPress: () => void }) {
  const { t, lang } = useApp();
  const type = useType();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={styles.head}>
        <View style={styles.logo}>
          <Text style={[styles.logoText, { fontSize: type.screenTitle }]}>{provider.name.charAt(0)}</Text>
        </View>
        <View style={styles.titleWrap}>
          <Text style={[styles.name, { fontSize: type.cardTitle }]}>{provider.name}</Text>
          <Text style={[styles.cuisine, { fontSize: type.caption }]}>{t(provider.cuisine)}</Text>
        </View>
        <Badge label={t(PLAN_LABELS[provider.plan])} tone={provider.plan === 'platinum' ? 'gold' : provider.plan === 'gold' ? 'accent' : 'neutral'} />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.meta}>
          <Icon name="pin" color={palette.muted} size={14} />
          <Text style={[styles.metaText, { fontSize: type.caption }]}>
            {provider.city} · {provider.radiusKm} km
          </Text>
        </View>
        <View style={styles.meta}>
          <Icon name="star" color={palette.gold} size={14} filled />
          <Text style={[styles.metaText, { fontSize: type.caption }]}>
            {provider.rating.toFixed(1)} ({provider.reviews})
          </Text>
        </View>
      </View>

      <View style={styles.tags}>
        {provider.vegetarian !== 'no' ? <Badge label={t(b('Vegetarisch', 'Vegetarian'))} tone="good" /> : null}
        {provider.halal ? <Badge label={t(b('Halal', 'Halal'))} tone="good" /> : null}
        {provider.vegan ? <Badge label={t(b('Vegan', 'Vegan'))} tone="good" /> : null}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.from, { fontSize: type.secondary }]}>
          {t(b('vanaf', 'from'))} <Text style={[styles.amount, { fontSize: type.cardTitle }]}>{money(provider.fromPrice, lang)}</Text> {t(b('p.p.', 'p.p.'))}
        </Text>
        <View style={styles.viewBtn}>
          <Text style={[styles.viewText, { fontSize: type.secondary }]}>{t(b('Bekijk', 'View'))}</Text>
          <Icon name="chevron" color={palette.accent} size={14} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.line, padding: 14, gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 44, height: 44, borderRadius: 12, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontWeight: '800', color: palette.accentDark },
  titleWrap: { flex: 1, gap: 2, minWidth: 0 },
  name: { fontWeight: '700', color: palette.ink },
  cuisine: { color: palette.muted },
  metaRow: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: palette.muted },
  tags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  from: { color: palette.muted },
  amount: { fontWeight: '800', color: palette.ink },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewText: { fontWeight: '700', color: palette.accentDark },
});
