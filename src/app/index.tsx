import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { notificationOpenedApp } from '@/notifications/push';
import { useCategoriesSync, usePlansSync } from '@/state/apiSync';
import { homeFor, useApp } from '@/state/store';

const splash = require('../../assets/images/splash-icon.png');

export default function SplashScreen() {
  const { session, restored } = useApp();
  const [timeUp, setTimeUp] = useState(false);
  usePlansSync();
  useCategoriesSync();

  useEffect(() => {
    const timer = setTimeout(() => setTimeUp(true), 1600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!timeUp || !restored || notificationOpenedApp()) return;
    router.replace(homeFor(session));
  }, [timeUp, restored, session]);

  return (
    <View style={styles.screen}>
      <Image source={splash} style={styles.art} contentFit="contain" accessibilityLabel="ServioSpot" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  art: { width: '50%', aspectRatio: 1024 / 271 },
});
