import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { palette } from '@/flow2/constants/theme';

export default function CustomerLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }} />
    </>
  );
}
