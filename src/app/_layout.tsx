import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { BrandSplash } from '@/components/BrandSplash';
import { NotificationSetup } from '@/components/NotificationSetup';
import { RequiredVendorOnboardingModal } from '@/components/RequiredVendorOnboardingModal';
import { palette } from '@/constants/theme';
import { waitForI18n } from '@/localization/i18n';
import { AppProvider, useApp } from '@/state/store';
import { AppProvider as Flow2Provider } from '@/flow2/state/app';
import { store } from '@/store';

SplashScreen.preventAutoHideAsync();

function BootGate({ children }: { children: ReactNode }) {
  const { restored } = useApp();
  const [intro, setIntro] = useState(true);

  if (!restored) return null;
  if (intro) return <BrandSplash onReady={() => void SplashScreen.hideAsync()} onFinish={() => setIntro(false)} />;
  return children;
}

export default function RootLayout() {
  useEffect(() => {
    void waitForI18n();
  }, []);

  return (
    <Provider store={store}>
      <AppProvider>
        <StatusBar style="dark" />
        <BootGate>
          <Flow2Provider>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }} />
            <NotificationSetup />
            <RequiredVendorOnboardingModal />
          </Flow2Provider>
        </BootGate>
      </AppProvider>
    </Provider>
  );
}
