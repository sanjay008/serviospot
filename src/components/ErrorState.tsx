import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { palette } from '@/constants/theme';

export function ErrorState({ title = 'Something went wrong', body, onRetry }: { title?: string; body: string; onRetry?: () => void }) {
  return (
    <View style={styles.wrap}>
      <Icon name="warning" color={palette.danger} size={28} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {onRetry ? <Button label="Try again" onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10, padding: 24 },
  title: { fontSize: 18, fontWeight: '700', color: palette.ink, textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 22, color: palette.muted, textAlign: 'center' },
});
