import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Provider } from 'react-redux';

import { NotificationSetup } from '@/components/NotificationSetup';
import { palette } from '@/constants/theme';
import { waitForI18n } from '@/localization/i18n';
import { AppProvider } from '@/state/store';
import { AppProvider as Flow2Provider } from '@/flow2/state/app';
import { store } from '@/store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
    // Keep the prototype offline; update checks are re-enabled with backend integration.
    void waitForI18n();
  }, []);

  return (
    <Provider store={store}>
      <AppProvider>
        <StatusBar style="dark" />
        <Flow2Provider>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }} />
          <NotificationSetup />
        </Flow2Provider>
      </AppProvider>
    </Provider>
  );
}
