import { router, useSegments } from 'expo-router';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/flow2/components/Button';
import { palette } from '@/flow2/constants/theme';
import { leading, useType } from '@/hooks/use-type';
import { useApp } from '@/state/store';

export function RequiredVendorOnboardingModal() {
  const { session, restored } = useApp();
  const type = useType();
  const segments = useSegments();
  const onOnboarding = segments[0] === 'vendor' && segments[1] === 'onboarding';
  const visible = restored && session.signedIn && session.mode === 'provider' && !session.hasProviderProfile && !onOnboarding;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={[styles.title, { fontSize: type.prominentTitle }]}>Your profile is incomplete</Text>
          <Text style={[styles.body, { fontSize: type.body, lineHeight: leading(type.body, 7) }]}>Please continue your vendor onboarding to access your account.</Text>
          <Button label="Continue to onboarding" onPress={() => router.replace('/vendor/onboarding' as never)} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: 'rgba(20, 18, 36, 0.55)' },
  card: { width: '100%', maxWidth: 380, borderRadius: 20, padding: 22, gap: 14, backgroundColor: palette.surface },
  title: { color: palette.ink, fontWeight: '800', textAlign: 'center' },
  body: { color: palette.muted, textAlign: 'center' },
});
