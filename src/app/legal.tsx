import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { useLegalText } from '@/state/apiSync';

export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  const privacy = doc === 'privacy';
  const text = useLegalText(privacy ? 'privacy' : 'terms');
  return (
    <Screen header={<Header title={privacy ? 'Privacy' : 'Terms'} back />}>
      {text ? <Text style={styles.body}>{text}</Text> : <Text style={styles.body}>This page could not be loaded. Open it again when you are online.</Text>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 15, lineHeight: 22, color: palette.ink },
});
