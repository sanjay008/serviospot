import { router } from 'expo-router';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/flow2/components/Button';
import { useApp } from '@/flow2/state/app';

export default function RoleSelectionScreen() {
  const { onboarding, setRole } = useApp();

  const openCustomer = () => {
    setRole('customer');
    router.push('/customer/auth' as any);
  };

  const openVendor = () => {
    setRole('vendor');
    router.push((onboarding.status === 'approved' ? '/vendor' : '/vendor/onboarding') as any);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <Image
        source={require('../../assets/images/welcome-scene.png')}
        contentFit="cover"
        style={StyleSheet.absoluteFill}
        accessibilityLabel="ServioSpot welcome screen with a blurred cooking scene"
      />

      <View style={styles.content}>
        <View style={styles.copy}>
          <Text style={styles.brand}>
            <Text style={styles.brandErp}>ERP </Text>
            <Text style={styles.brandName}>SERVIOSPOT.NL</Text>
          </Text>
          <Text style={styles.tagline}>Find. Compare. Connect.</Text>
        </View>
        <View style={styles.buttons}>
          <Button label="Customer" onPress={openCustomer} style={[styles.button, styles.customerButton]} />
          <View pointerEvents="none" style={styles.buttonGap} />
          <Button label="Vendor" variant="secondary" onPress={openVendor} style={[styles.button, styles.vendorButton]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#241A14' },
  content: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  copy: { gap: 4 },
  brand: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  brandErp: { color: '#FFFFFF' },
  brandName: { color: '#8057FF' },
  tagline: { color: 'rgba(255, 255, 255, 0.82)', fontSize: 11 },
  buttons: { flexDirection: 'row' },
  button: { flex: 1, minHeight: 44, borderRadius: 5, paddingVertical: 8 },
  buttonGap: { width: 12, height: 44, backgroundColor: 'rgba(18, 13, 10, 0.9)' },
  customerButton: { backgroundColor: '#8057FF' },
  vendorButton: { backgroundColor: '#FFFFFF', borderWidth: 0 },
});
