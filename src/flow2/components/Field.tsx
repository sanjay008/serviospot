import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/flow2/constants/theme';

export function Field({ label, hint, children }: { label?: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {children}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 15, fontWeight: '700', color: palette.ink },
  hint: { fontSize: 13, lineHeight: 18, color: palette.muted },
});
