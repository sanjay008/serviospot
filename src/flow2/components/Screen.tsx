import { ActivityIndicator, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette } from '@/flow2/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';

export function Screen({
  children,
  header,
  footer,
  scroll = true,
  canvas,
  style,
  loading = false,
  refreshing = false,
  onRefresh,
}: {
  children?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  scroll?: boolean;
  canvas?: string;
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { gutter, maxWidth, width } = useResponsive();
  const bottom = footer ? 20 : insets.bottom + 24;
  const frame = { width: '100%' as const, maxWidth, alignSelf: 'center' as const };
  const contentGap = width < 360 ? 10 : width >= 768 ? 16 : 12;
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
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.accent} colors={[palette.accent]} /> : undefined}
      showsVerticalScrollIndicator={false}>
      <View style={[styles.content, frame, { paddingHorizontal: gutter, paddingTop: topSpace, gap: contentGap }, style]}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.body, styles.content, frame, { paddingHorizontal: gutter, paddingTop: topSpace, gap: contentGap }, style]}>{children}</View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: canvas ?? palette.surface }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
