import { router } from 'expo-router';
import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

/** Mollie returns here. The success popup is shown on the vendor profile. */
export default function MollieReturnScreen() {
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
    router.replace('/vendor/(tabs)/more' as never);
  }, []);

  return null;
}
