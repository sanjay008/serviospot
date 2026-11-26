import type { Ref } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette, spacing } from '@/flow2/constants/theme';
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
  scrollRef,
  liftFooter = true,
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
  scrollRef?: Ref<ScrollView>;
  /** When false, the footer stays at the bottom and does not rise with the keyboard. */
  liftFooter?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const innerScroll = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const keyboardTop = useRef(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    if (liftFooter) return;
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (event) => {
      keyboardTop.current = event.endCoordinates.screenY;
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      keyboardTop.current = 0;
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [liftFooter]);
  useEffect(() => {
    if (liftFooter || keyboardHeight === 0) return;
    const timer = setTimeout(() => {
      const scroll = innerScroll.current;
      const input = TextInput.State.currentlyFocusedInput() as {
        measureInWindow?: (callback: (x: number, y: number, width: number, height: number) => void) => void;
      } | null;
      if (!scroll || !input?.measureInWindow) return;
      const scrollNode = scroll as unknown as {
        measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => void;
      };
      scrollNode.measureInWindow((sx, sy, _sw, sh) => {
        const limit = Math.min(sy + sh, keyboardTop.current || sy + sh) - 20;
        input.measureInWindow?.((_x, y, _w, h) => {
          const overflow = y + h - limit;
          if (overflow > 0) scroll.scrollTo({ y: scrollY.current + overflow, animated: true });
        });
      });
    }, 80);
    return () => clearTimeout(timer);
  }, [keyboardHeight, liftFooter]);
  const showFooter = Boolean(footer) && (liftFooter || keyboardHeight === 0);
  const { gutter, maxWidth, width } = useResponsive();
  const bottom = footer ? spacing.xl : insets.bottom + spacing.xxl;
  const frame = { width: '100%' as const, maxWidth, alignSelf: 'center' as const };
  const contentGap = width < 360 ? spacing.md : width >= 768 ? spacing.lg : 14;
  const topSpace = width < 360 ? spacing.md : width >= 768 ? spacing.xl : spacing.lg;

  const body = loading ? (
    <View style={[styles.flex, styles.body, styles.loader, { paddingHorizontal: gutter }]}>
      <ActivityIndicator size="large" color={palette.accent} accessibilityLabel="Loading" />
    </View>
  ) : scroll ? (
    <ScrollView
      ref={(node) => {
        innerScroll.current = node;
        assignScrollRef(scrollRef, node);
      }}
      style={[styles.flex, styles.body]}
      contentContainerStyle={{ paddingBottom: bottom + (liftFooter ? 0 : keyboardHeight), flexGrow: 1 }}
      automaticallyAdjustKeyboardInsets={liftFooter}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={liftFooter ? (Platform.OS === 'ios' ? 'interactive' : 'on-drag') : 'none'}
      onScroll={(event) => {
        scrollY.current = event.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.accent} colors={[palette.accent]} />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}>
      <View style={[styles.content, frame, { paddingHorizontal: gutter, paddingTop: topSpace, gap: contentGap }, style]}>
        {children}
      </View>
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.body, styles.content, frame, { paddingHorizontal: gutter, paddingTop: topSpace, gap: contentGap }, style, { paddingBottom: footer ? 0 : insets.bottom }]}>
      {children}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: canvas ?? palette.surface }]}
      behavior={liftFooter ? (Platform.OS === 'ios' ? 'padding' : 'height') : undefined}>
      <View style={[styles.flex, { backgroundColor: canvas ?? palette.surface, paddingTop: insets.top }]}>
        {header ? <View style={frame}>{header}</View> : null}
        {body}
        {showFooter ? (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <View style={[frame, { paddingHorizontal: gutter }]}>{footer}</View>
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

function assignScrollRef(scrollRef: Ref<ScrollView> | undefined, node: ScrollView | null) {
  if (!scrollRef) return;
  if (typeof scrollRef === 'function') scrollRef(node);
  else scrollRef.current = node;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { backgroundColor: palette.bg },
  content: { gap: spacing.md },
  loader: { alignItems: 'center', justifyContent: 'center' },
  footer: {
    paddingTop: spacing.md,
    backgroundColor: palette.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.line,
  },
});
