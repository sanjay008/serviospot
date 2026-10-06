import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { INDICATIVE } from '@/constants/copy';
import { palette } from '@/constants/theme';

export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  const privacy = doc === 'privacy';
  return (
    <Screen header={<Header title={privacy ? 'Privacy' : 'Terms'} back />}>
      {privacy ? (
        <>
          <Text style={styles.body}>ServioSpot is aimed at people and providers in the Netherlands. This preview stores sample data only on the device.</Text>
          <Text style={styles.body}>A live app would explain what is collected, why, how long it is kept, and how to export or delete an account. Contact details are shown only under the marketplace rules.</Text>
          <Text style={styles.body}>Event details are not used to train unrelated AI systems in this product description.</Text>
        </>
      ) : (
        <>
          <Text style={styles.body}>ServioSpot helps customers and providers find each other. It does not close the catering contract, take the event payment, or enforce cancellation of an off-platform agreement.</Text>
          <Text style={styles.body}>{INDICATIVE}</Text>
          <Text style={styles.body}>Providers are responsible for the food, allergen and dietary information they publish. The platform does not certify halal status or food safety.</Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 15, lineHeight: 22, color: palette.ink },
});
