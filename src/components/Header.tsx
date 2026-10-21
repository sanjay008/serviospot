import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { palette } from '@/constants/theme';
import { typography } from '@/constants/typography';
import { useResponsive } from '@/hooks/use-responsive';

export function Header({ title, subtitle, back, right }: { title: string; subtitle?: string; back?: boolean; right?: React.ReactNode }) {
  const { gutter } = useResponsive();
  return (
    <View style={[styles.row, { paddingHorizontal: gutter }]}>
      {back ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.back}>
          <Icon name="back" color={palette.accentDark} size={18} />
        </Pressable>
      ) : null}
      <View style={styles.titles}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const { isCompact } = useResponsive();
  return (
    <View style={styles.page}>
      <Text style={[styles.pageTitle, isCompact && styles.pageTitleCompact]}>{title}</Text>
      {subtitle ? <Text style={styles.pageSub}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, paddingTop: 10, gap: 10, backgroundColor: palette.surface },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
  },
  titles: { flex: 1, gap: 2, minWidth: 0 },
  title: { fontSize: typography.screenTitle, fontWeight: '700', color: palette.ink },
  subtitle: { fontSize: typography.caption, lineHeight: 18, color: palette.muted },
  right: { flexShrink: 1, alignItems: 'flex-end', maxWidth: '46%' },
  page: { gap: 2, paddingTop: 8 },
  pageTitle: { fontSize: typography.pageTitle, lineHeight: 32, fontWeight: '700', color: palette.ink },
  pageTitleCompact: { fontSize: typography.compactPageTitle, lineHeight: 28 },
  pageSub: { fontSize: typography.secondary, lineHeight: 20, color: palette.muted },
});
