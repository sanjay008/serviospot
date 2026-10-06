import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { palette } from '@/constants/theme';
import { useApp } from '@/state/store';

export default function SplashScreen() {
  const { session } = useApp();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!session.signedIn) {
        router.replace('/login');
        return;
      }
      if (session.mode === 'provider') router.replace(session.hasProviderProfile ? '/business' : '/setup');
      else router.replace('/customer');
    }, 1100);
    return () => clearTimeout(timer);
  }, [session.hasProviderProfile, session.mode, session.signedIn]);

  return (
    <Screen scroll={false}>
      <View style={styles.center}>
        <View style={styles.logo}>
          <Text style={styles.mark}>S</Text>
        </View>
        <Text style={styles.title}>ServioSpot</Text>
        <Text style={styles.body}>Catering, in one app</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  logo: { width: 72, height: 72, borderRadius: 20, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  mark: { color: '#fff', fontSize: 32, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '700', color: palette.ink },
  body: { fontSize: 15, color: palette.muted },
});
