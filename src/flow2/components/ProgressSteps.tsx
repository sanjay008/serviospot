import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { palette } from '@/flow2/constants/theme';

export function ProgressSteps({ steps, current, onPress }: { steps: string[]; current: number; onPress?: (index: number) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {steps.map((step, index) => {
        const active = index === current;
        const done = index < current;
        return (
          <Pressable key={step} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => onPress?.(index)} style={[styles.step, active && styles.active, done && styles.done]}>
            <Text style={[styles.num, active && styles.activeNum]}>{index + 1}</Text>
            <Text style={[styles.label, active && styles.activeLabel]} numberOfLines={1}>
              {step}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  active: { backgroundColor: palette.accent, borderColor: palette.accent },
  done: { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
  num: { fontSize: 12, fontWeight: '700', color: palette.muted, minWidth: 14, textAlign: 'center' },
  activeNum: { color: '#fff' },
  label: { fontSize: 13, fontWeight: '600', color: palette.ink },
  activeLabel: { color: '#fff' },
});
