import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/theme';

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={palette.accent} size="large" />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 48 },
  label: { color: palette.muted, fontSize: 15 },
});
