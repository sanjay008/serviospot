import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette } from '@/constants/theme';

export function Screen({
  children,
  header,
  footer,
  scroll = true,
  tab,
  style,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  scroll?: boolean;
  tab?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const body = scroll ? (
    <ScrollView contentContainerStyle={[styles.content, style, { paddingBottom: footer ? 20 : tab ? 24 : insets.bottom + 24 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.content, style]}>{children}</View>
  );
  return (
    <View style={[styles.flex, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
      {header}
      {body}
      {footer ? <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },
  footer: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.line },
});
