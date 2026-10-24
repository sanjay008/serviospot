import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useType } from '@/hooks/use-type';

const SPLASH_MS = 1800;

export function BrandSplash({ onReady, onFinish }: { onReady: () => void; onFinish: () => void }) {
  const insets = useSafeAreaInsets();
  const type = useType();
  const started = useRef(false);

  const ready = () => {
    if (started.current) return;
    started.current = true;
    onReady();
    setTimeout(onFinish, SPLASH_MS);
  };

  return (
    <View style={styles.screen} onLayout={ready}>
      <StatusBar style="light" />
      <Image source={require('../../assets/images/welcome-scene.png')} contentFit="cover" style={StyleSheet.absoluteFill} />
      <View style={styles.tint} />
      <View style={styles.center}>
        <Image source={require('../../assets/images/app-logo.png')} contentFit="contain" style={styles.logo} />
        <Text style={[styles.brand, { fontSize: type.pageTitle, lineHeight: type.pageTitle + 6 }]}>ServioSpot</Text>
      </View>
      <Text style={[styles.tagline, { fontSize: type.secondary, lineHeight: type.secondary + 6, marginBottom: Math.max(insets.bottom, 12) + 24 }]}>
        Find. Compare. Connect.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#7C5BFF', justifyContent: 'flex-end' },
  tint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(124, 91, 255, 0.68)' },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  logo: { width: '52%', maxWidth: 230, aspectRatio: 813 / 740 },
  brand: { marginTop: 4, color: '#FFFFFF', fontWeight: '700', textAlign: 'center' },
  tagline: { color: '#FFFFFF', fontWeight: '600', textAlign: 'center' },
});
