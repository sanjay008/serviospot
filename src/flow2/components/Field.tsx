import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/flow2/constants/theme';
import { leading, useType } from '@/hooks/use-type';

export function Field({ label, hint, children }: { label?: string; hint?: string; children: React.ReactNode }) {
  const type = useType();
  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { fontSize: type.label, lineHeight: leading(type.label, 4) }]}>{label}</Text> : null}
      {children}
      {hint ? <Text style={[styles.hint, { fontSize: type.caption, lineHeight: leading(type.caption, 5) }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontWeight: '700', color: palette.ink },
  hint: { color: palette.muted },
});
