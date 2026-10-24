import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { leading, useType } from '@/hooks/use-type';
import { useLegalText } from '@/state/apiSync';

export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  const privacy = doc === 'privacy';
  const text = useLegalText(privacy ? 'privacy' : 'terms');
  const type = useType();
  return (
    <Screen header={<Header title={privacy ? 'Privacy' : 'Terms'} back />}>
      {text ? <Text style={[styles.body, { fontSize: type.body, lineHeight: leading(type.body, 7) }]}>{text}</Text> : <Text style={[styles.body, { fontSize: type.body, lineHeight: leading(type.body, 7) }]}>This page could not be loaded. Open it again when you are online.</Text>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { color: palette.ink },
});
