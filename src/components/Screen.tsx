import { ActivityIndicator, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';

export function Screen({
  children,
  header,
  footer,
  scroll = true,
  refresh,
  onRefresh,
  loading = false,
  refreshing = false,
  canvas,
  style,
}: {
  children?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  scroll?: boolean;
  tab?: boolean;
  refresh?: boolean;
  onRefresh?: () => void;
  loading?: boolean;
  refreshing?: boolean;
  canvas?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const { gutter, maxWidth, width } = useResponsive();
  const bottom = footer ? 20 : insets.bottom + 24;
  const frame = { width: '100%' as const, maxWidth, alignSelf: 'center' as const };
  const topSpace = width < 360 ? 12 : width >= 768 ? 20 : 16;
  const body = loading ? (
    <View style={[styles.flex, styles.body, styles.loader, { paddingHorizontal: gutter }]}>
      <ActivityIndicator size="large" color={palette.accent} accessibilityLabel="Loading" />
    </View>
  ) : scroll ? (
    <ScrollView
      style={[styles.flex, styles.body]}
      contentContainerStyle={{ paddingBottom: bottom, flexGrow: 1 }}
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
      alwaysBounceVertical={!!(refresh || onRefresh)}
      refreshControl={
        refresh || onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={() => onRefresh?.()} tintColor={palette.accent} colors={[palette.accent]} progressBackgroundColor={palette.surface} />
        ) : undefined
      }>
      <View style={[styles.content, frame, { paddingHorizontal: gutter, paddingTop: topSpace }, style]}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.body, styles.content, frame, { paddingHorizontal: gutter, paddingTop: topSpace }, style, { paddingBottom: footer ? 0 : insets.bottom }]}>{children}</View>
  );

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: canvas ?? palette.surface }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.flex, { backgroundColor: canvas ?? palette.surface, paddingTop: insets.top }]}>
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
  body: { backgroundColor: palette.bg },
  content: { gap: 12 },
  loader: { alignItems: 'center', justifyContent: 'center' },
  footer: { paddingTop: 12, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.line },
});
