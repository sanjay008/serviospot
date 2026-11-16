import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/flow2/constants/theme';
import { leading, useType } from '@/hooks/use-type';

export function ProgressSteps({
  steps,
  current,
  onPress,
  title,
  subtitle,
}: {
  steps: string[];
  current: number;
  onPress?: (index: number) => void;
  title?: string;
  subtitle?: string;
}) {
  const type = useType();
  const [trackWidth, setTrackWidth] = useState(0);
  const [progress] = useState(() => new Animated.Value(current));
  const showLabels = steps.length <= 5;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: current,
      duration: 180,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [current, progress]);

  const maxIndex = Math.max(steps.length - 1, 1);
  const completedTrackWidth = progress.interpolate({
    inputRange: [0, maxIndex],
    outputRange: [0, Math.max(trackWidth - 28, 0)],
    extrapolate: 'clamp',
  });

  const heading = title ?? steps[current] ?? '';

  return (
    <View style={styles.panel}>
      <View
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        style={[styles.row, showLabels ? styles.rowWithLabels : null]}
        accessibilityRole="progressbar"
        accessibilityLabel={`Step ${current + 1} of ${steps.length}`}>
        <View pointerEvents="none" style={styles.track} />
        <Animated.View pointerEvents="none" style={[styles.completedTrack, { width: completedTrackWidth }]} />
        {steps.map((step, index) => {
          const active = index === current;
          const done = index < current;
          return (
            <Pressable
              key={`${step}-${index}`}
              accessibilityRole="button"
              accessibilityLabel={`Step ${index + 1}: ${step}`}
              accessibilityState={{ selected: active }}
              onPress={() => onPress?.(index)}
              style={styles.stepTarget}>
              <View style={[styles.circle, done && styles.circleDone, active && styles.circleActive]}>
                <Text
                  style={[
                    styles.circleText,
                    { fontSize: type.small },
                    (done || active) && styles.circleTextOn,
                  ]}>
                  {done ? '✓' : String(index + 1)}
                </Text>
              </View>
              {showLabels ? (
                <Text
                  numberOfLines={2}
                  style={[
                    styles.stepLabel,
                    { fontSize: type.micro, lineHeight: leading(type.micro, 3) },
                    active && styles.stepLabelActive,
                    done && styles.stepLabelDone,
                  ]}>
                  {step}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.header}>
        <Text style={[styles.meta, { fontSize: type.caption, lineHeight: leading(type.caption, 4) }]}>
          {`Step ${current + 1} of ${steps.length}`}
        </Text>
        <Text style={[styles.title, { fontSize: type.prominentTitle, lineHeight: leading(type.prominentTitle, 5) }]}>
          {heading}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { fontSize: type.secondary, lineHeight: leading(type.secondary, 6) }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 14,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: '#E4E0F0',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 14,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    paddingHorizontal: 2,
    minHeight: 28,
  },
  rowWithLabels: {
    alignItems: 'flex-start',
    minHeight: 58,
  },
  track: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 13,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#DDD9E8',
  },
  completedTrack: {
    position: 'absolute',
    left: 20,
    top: 13,
    height: 2,
    borderRadius: 1,
    backgroundColor: palette.accent,
    zIndex: 1,
  },
  stepTarget: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    zIndex: 2,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    borderWidth: 1.5,
    borderColor: '#C9C4D8',
  },
  circleDone: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  circleActive: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
    borderWidth: 2,
    transform: [{ scale: 1.06 }],
  },
  circleText: {
    color: palette.muted,
    fontWeight: '800',
  },
  circleTextOn: {
    color: '#FFFFFF',
  },
  stepLabel: {
    color: '#9A95AB',
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  stepLabelActive: {
    color: palette.accentDark,
    fontWeight: '800',
  },
  stepLabelDone: {
    color: palette.ink,
    fontWeight: '700',
  },
  header: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#EEEAF6',
    paddingTop: 12,
  },
  meta: {
    color: palette.accentDark,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    color: palette.ink,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.muted,
    fontWeight: '500',
  },
});
