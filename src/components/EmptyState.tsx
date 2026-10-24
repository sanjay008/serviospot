import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { palette } from '@/constants/theme';
import { leading, useType } from '@/hooks/use-type';

export function EmptyState({ icon = 'search', title, body, action, onAction }: { icon?: IconName; title: string; body: string; action?: string; onAction?: () => void }) {
  const type = useType();
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <Icon name={icon} color={palette.accent} size={28} />
      </View>
      <Text style={[styles.title, { fontSize: type.sectionTitle, lineHeight: leading(type.sectionTitle, 6) }]}>{title}</Text>
      <Text style={[styles.body, { fontSize: type.body, lineHeight: leading(type.body, 7) }]}>{body}</Text>
      {action && onAction ? <Button label={action} onPress={onAction} variant="secondary" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10, paddingVertical: 28, paddingHorizontal: 12 },
  icon: { width: 56, height: 56, borderRadius: 16, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: '700', color: palette.ink, textAlign: 'center' },
  body: { color: palette.muted, textAlign: 'center' },
});
