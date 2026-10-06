import { StyleSheet, Text, View } from 'react-native';

export function Avatar({ name, color, size = 48 }: { name: string; color: string; size?: number }) {
  const letters = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  return (
    <View style={[styles.circle, { backgroundColor: color, width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.text, { fontSize: size * 0.34 }]}>{letters}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontWeight: '700' },
});
