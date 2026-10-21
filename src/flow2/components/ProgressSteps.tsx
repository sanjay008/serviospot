import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { palette } from '@/flow2/constants/theme';

export function ProgressSteps({ steps, current, onPress }: { steps: string[]; current: number; onPress?: (index: number) => void }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [progress] = useState(() => new Animated.Value(current));

  useEffect(() => {
    // Keep the dot and fill line in lockstep. Spring overshoot can move the
    // dot ahead of its line, so use a short, linear timing animation instead.
    const animation = Animated.timing(progress, {
      toValue: current,
      duration: 180,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [current, progress]);

  const maxIndex = Math.max(steps.length - 1, 1);
  const activeDotPosition = progress.interpolate({
    inputRange: [0, maxIndex],
    outputRange: [0, Math.max(trackWidth - 24, 0)],
    extrapolate: 'clamp',
  });
  const completedTrackWidth = progress.interpolate({
    inputRange: [0, maxIndex],
    outputRange: [0, Math.max(trackWidth - 24, 0)],
    extrapolate: 'clamp',
  });

  return (
    <View onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)} style={styles.row} accessibilityRole="progressbar" accessibilityLabel={`Step ${current + 1} of ${steps.length}`}>
      <View pointerEvents="none" style={styles.track} />
      <Animated.View pointerEvents="none" style={[styles.completedTrack, { width: completedTrackWidth }]} />
      {steps.map((step, index) => {
        const active = index === current;
        return (
          <Pressable
            key={step}
            accessibilityRole="button"
            accessibilityLabel={`Step ${index + 1}: ${step}`}
            accessibilityState={{ selected: active }}
            onPress={() => onPress?.(index)}
            style={styles.dotTarget}>
            <View style={[styles.dot, index <= current && styles.completedDot]} />
          </Pressable>
        );
      })}
      <Animated.View pointerEvents="none" style={[styles.activeDot, { transform: [{ translateX: activeDotPosition }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: 32, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', position: 'relative' },
  track: { position: 'absolute', left: 12, right: 12, height: 2, borderRadius: 1, backgroundColor: '#D5D3DD' },
  completedTrack: { position: 'absolute', left: 12, height: 2, borderRadius: 1, backgroundColor: palette.accent, zIndex: 1 },
  dotTarget: { width: 24, height: 32, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#B8B5C4' },
  completedDot: { backgroundColor: palette.accent },
  activeDot: { position: 'absolute', left: 5, top: 9, width: 14, height: 14, borderRadius: 7, backgroundColor: palette.accent, zIndex: 2 },
});
