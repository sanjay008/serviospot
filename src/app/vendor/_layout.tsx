import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { palette } from '@/flow2/constants/theme';
import { useApp } from '@/state/store';

export default function VendorLayout() {
  const { session, restored } = useApp();
  if (!restored) return null;
  if (!session.signedIn || session.mode !== 'provider') return <Redirect href="/" />;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }} />
    </SafeAreaProvider>
  );
}
