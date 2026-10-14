import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { palette } from '@/constants/theme';

export function ListRow({ title, subtitle, onPress, icon, trailing }: { title: string; subtitle?: string; onPress?: () => void; icon?: IconName; trailing?: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      {icon ? (
        <View style={styles.well}>
          <Icon name={icon} color={palette.accent} size={18} />
        </View>
      ) : null}
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {trailing ? <Text style={styles.trailing}>{trailing}</Text> : null}
      {onPress ? <Icon name="chevron" color={palette.muted} size={16} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  well: { width: 36, height: 36, borderRadius: 10, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2, minWidth: 0 },
  title: { fontSize: 16, color: palette.ink, fontWeight: '600' },
  subtitle: { fontSize: 13, color: palette.muted, lineHeight: 18 },
  trailing: { fontSize: 14, color: palette.muted },
});
