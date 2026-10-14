import { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';

export function Screen({
  children,
  header,
  footer,
  scroll = true,
  tab,
  refresh,
  onRefresh,
  canvas,
  style,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  scroll?: boolean;
  tab?: boolean;
  refresh?: boolean;
  onRefresh?: () => void;
  canvas?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const { gutter, maxWidth } = useResponsive();
  const bottom = footer ? 20 : tab ? 24 : insets.bottom + 24;
  const frame = { width: '100%' as const, maxWidth, alignSelf: 'center' as const };
  const [refreshing, setRefreshing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    onRefresh?.();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setRefreshing(false), 700);
  }, [onRefresh]);

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={{ paddingBottom: bottom, flexGrow: 1 }}
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
      alwaysBounceVertical={!!refresh}
      refreshControl={
        refresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={palette.accent} colors={[palette.accent]} progressBackgroundColor={palette.surface} />
        ) : undefined
      }>
      <View style={[styles.content, frame, { paddingHorizontal: gutter }, style]}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.content, frame, { paddingHorizontal: gutter }, style]}>{children}</View>
  );

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: canvas ?? palette.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.flex, { backgroundColor: canvas ?? palette.bg, paddingTop: insets.top }]}>
        {header ? <View style={frame}>{header}</View> : null}
        {body}
        {footer ? (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={[frame, { paddingHorizontal: gutter }]}>{footer}</View>
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 12 },
  footer: { paddingTop: 12, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.line },
});
