import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/flow2/components/Icon';
import { palette } from '@/flow2/constants/theme';
import { leading, useType } from '@/hooks/use-type';

export function ListRow({ title, subtitle, onPress, icon, trailing }: { title: string; subtitle?: string; onPress?: () => void; icon?: IconName; trailing?: string }) {
  const type = useType();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      {icon ? (
        <View style={styles.well}>
          <Icon name={icon} color={palette.accent} size={18} />
        </View>
      ) : null}
      <View style={styles.text}>
        <Text style={[styles.title, { fontSize: type.cardTitle, lineHeight: leading(type.cardTitle, 4) }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { fontSize: type.caption, lineHeight: leading(type.caption, 5) }]}>{subtitle}</Text> : null}
      </View>
      {trailing ? <Text style={[styles.trailing, { fontSize: type.secondary }]}>{trailing}</Text> : null}
      {onPress ? <Icon name="chevron" color={palette.muted} size={16} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  well: { width: 36, height: 36, borderRadius: 10, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2, minWidth: 0 },
  title: { color: palette.ink, fontWeight: '600' },
  subtitle: { color: palette.muted },
  trailing: { color: palette.muted },
});
