import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

import { Header } from '@/flow2/components/Header';
import { Screen } from '@/flow2/components/Screen';

const PRIVACY_POLICY_URL = 'https://app.erpportaal.nl/api/serviospot/privacy';

export default function PrivacyPolicyScreen() {
  return (
    <Screen scroll={false} style={styles.screen} header={<Header title="Privacy Policy" back />}>
      <WebView
        source={{ uri: PRIVACY_POLICY_URL }}
        style={styles.webView}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 0, paddingBottom: 0, gap: 0 },
  webView: { flex: 1, backgroundColor: 'transparent' },
});
