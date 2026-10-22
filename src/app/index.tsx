import { router } from 'expo-router';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/flow2/components/Button';
import { useApp } from '@/flow2/state/app';

export default function RoleSelectionScreen() {
  const { setRole } = useApp();

  const openCustomer = () => {
    setRole('customer');
    router.push('/customer/auth?role=customer' as any);
  };

  const openVendor = () => {
    setRole('vendor');
    router.push('/customer/auth?role=vendor' as any);
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
          <Button label="Vendor" variant="secondary" onPress={openVendor} style={[styles.button, styles.vendorButton]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#241A14' },
  content: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 16, paddingBottom: 32, gap: 16 },
  copy: { gap: 6 },
  brand: { fontSize: 23, fontWeight: '800', letterSpacing: -0.2 },
  brandErp: { color: '#FFFFFF' },
  brandName: { color: '#8057FF' },
  tagline: { color: 'rgba(255, 255, 255, 0.9)', fontSize: 14 },
  buttons: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, minHeight: 44, borderRadius: 5, paddingVertical: 8 },
  customerButton: { backgroundColor: '#8057FF' },
  vendorButton: { backgroundColor: '#FFFFFF', borderWidth: 0 },
});
