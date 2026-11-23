import { router } from 'expo-router';
import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';

import { Button } from '@/flow2/components/Button';
import { Header } from '@/flow2/components/Header';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';

WebBrowser.maybeCompleteAuthSession();

export default function MollieReturnScreen() {
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  return (
    <Screen header={<Header title="Payment" back />}>
      <Notice tone="info" title="Back from Mollie" body="Your plan updates after the server confirms the payment. Open your vendor profile to see the current plan." />
      <Button label="Back to profile" onPress={() => router.replace('/vendor/(tabs)/more' as never)} />
    </Screen>
  );
}
