import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/theme';
import { formatDate } from '@/data/format';
import type { ChatMessage } from '@/data/types';

export function MessageBubble({ message, mine }: { message: ChatMessage; mine: boolean }) {
  return (
    <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
      <Text style={[styles.text, mine && styles.mineText]}>{message.text}</Text>
      <Text style={[styles.time, mine && styles.mineTime]}>{formatDate(message.at)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: '82%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, gap: 4 },
  mine: { alignSelf: 'flex-end', backgroundColor: palette.accent },
  theirs: { alignSelf: 'flex-start', backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  text: { fontSize: 15, lineHeight: 21, color: palette.ink },
  mineText: { color: '#fff' },
  time: { fontSize: 11, color: palette.muted },
  mineTime: { color: '#E4DEFF' },
});
