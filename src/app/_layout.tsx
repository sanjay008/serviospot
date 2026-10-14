import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { Provider } from 'react-redux';

import { ChatLive } from '@/components/ChatLive';
import { NotificationSetup } from '@/components/NotificationSetup';
import { OfflineScreen } from '@/components/OfflineScreen';
import { palette } from '@/constants/theme';
import { waitForI18n } from '@/localization/i18n';
import { AppProvider } from '@/state/store';
import { store } from '@/store';

SplashScreen.preventAutoHideAsync();

async function checkForUpdate() {
  if (__DEV__ || !Updates.isEnabled) return;
  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch {
    // A failed check must not block the app. Expo Go and debug builds reject this call.
  }
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
    waitForI18n().finally(checkForUpdate);
  }, []);

  return (
    <Provider store={store}>
      <AppProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }} />
        <ChatLive />
        <NotificationSetup />
        <OfflineScreen />
      </AppProvider>
    </Provider>
  );
}
