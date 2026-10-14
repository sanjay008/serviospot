import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette } from '@/constants/theme';

export function Screen({
  children,
  header,
  footer,
  scroll = true,
  canvas,
  style,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  scroll?: boolean;
  canvas?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const bottom = footer ? 20 : insets.bottom + 24;
  const frame = { width: '100%' as const, maxWidth: 640, alignSelf: 'center' as const };

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={{ paddingBottom: bottom, flexGrow: 1 }}
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <View style={[styles.content, frame, style]}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.content, frame, style]}>{children}</View>
  );

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: canvas ?? palette.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.flex, { backgroundColor: canvas ?? palette.bg, paddingTop: insets.top }]}>
        {header ? <View style={frame}>{header}</View> : null}
        {body}
        {footer ? (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={frame}>{footer}</View>
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 12, paddingHorizontal: 16 },
  footer: { paddingTop: 12, paddingHorizontal: 16, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.line },
});
