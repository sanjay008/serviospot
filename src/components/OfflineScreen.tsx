import { useNetworkState, NetworkStateType, type NetworkState } from 'expo-network';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { palette } from '@/constants/theme';

function isOffline(state: NetworkState) {
  if (state.type === NetworkStateType.NONE) return true;
  return state.isConnected === true && state.isInternetReachable === false;
}

export function OfflineScreen() {
  const network = useNetworkState();
  return (
    <Modal visible={isOffline(network)} animationType="none" statusBarTranslucent transparent={false}>
      <View style={styles.screen}>
        <OfflineArt />
        <Text style={styles.title}>No internet connection</Text>
        <Text style={styles.body}>No internet data connection</Text>
      </View>
    </Modal>
  );
}

function OfflineArt() {
  return (
    <Svg width={180} height={180} viewBox="0 0 180 180">
      <Circle cx="90" cy="90" r="78" fill={palette.accentSoft} />
      <Path d="M46 98c24-30 64-30 88 0" stroke={palette.accent} strokeWidth="8" strokeLinecap="round" fill="none" />
      <Path d="M62 114c15-18 41-18 56 0" stroke={palette.accent} strokeWidth="8" strokeLinecap="round" fill="none" />
      <Circle cx="90" cy="132" r="6" fill={palette.accent} />
      <Path d="M58 58 L124 132" stroke={palette.ink} strokeWidth="8" strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: '700', color: palette.ink, textAlign: 'center' },
  body: { fontSize: 16, lineHeight: 22, color: palette.muted, textAlign: 'center' },
});
