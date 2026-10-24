import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/flow2/components/Icon';
import { palette } from '@/flow2/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { leading, useType } from '@/hooks/use-type';

export function Header({ title, subtitle, back, right, prominent = false }: { title: string; subtitle?: string; back?: boolean; right?: React.ReactNode; prominent?: boolean }) {
  const { gutter, isCompact } = useResponsive();
  const type = useType();
  const titleSize = prominent ? type.prominentTitle : type.screenTitle;
  const subtitleSize = prominent ? type.secondary : type.caption;
  return (
    <View style={[styles.row, { paddingHorizontal: gutter, paddingVertical: isCompact ? 8 : 10 }]}>
      {back ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.back}>
          <Icon name="back" color={palette.accentDark} size={18} />
        </Pressable>
      ) : null}
      <View style={styles.titles}>
        <Text style={[styles.title, { fontSize: titleSize, lineHeight: leading(titleSize, 4) }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { fontSize: subtitleSize, lineHeight: leading(subtitleSize, 5) }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const type = useType();
  return (
    <View style={styles.page}>
      <Text style={[styles.pageTitle, { fontSize: type.pageTitle, lineHeight: leading(type.pageTitle, 6) }]}>{title}</Text>
      {subtitle ? <Text style={[styles.pageSub, { fontSize: type.secondary, lineHeight: leading(type.secondary, 6) }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: palette.surface },
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
  title: { fontWeight: '700', color: palette.ink },
  subtitle: { color: palette.muted },
  right: { flexShrink: 1, alignItems: 'flex-end', maxWidth: '46%' },
  page: { gap: 2, paddingTop: 8 },
  pageTitle: { fontWeight: '700', color: palette.ink },
  pageSub: { color: palette.muted },
});
