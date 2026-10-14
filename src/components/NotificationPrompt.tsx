import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { ConfirmModal } from '@/components/ConfirmModal';
import { notificationPermission, prepareNotifications } from '@/notifications/push';
import { useApp } from '@/state/store';

const SEEN_KEY = 'notificationPromptSeen';

export function NotificationPrompt() {
  const { setNotify } = useApp();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let alive = true;
    const timer = setTimeout(() => {
      void (async () => {
        const seen = await AsyncStorage.getItem(SEEN_KEY);
        if (!alive || seen === '1') return;
        const status = await notificationPermission();
        if (!alive || status !== 'undetermined') return;
        setOpen(true);
      })();
    }, 700);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <ConfirmModal
      visible={open}
      icon="bell"
      title="Allow notifications"
      body="ServioSpot can alert you about new prices, requests and messages. You can change this later in settings."
      confirmLabel="Allow"
      cancelLabel="Not now"
      onConfirm={() => {
        setOpen(false);
        void AsyncStorage.setItem(SEEN_KEY, '1');
        setNotify({ push: true });
        void prepareNotifications();
      }}
      onClose={() => {
        setOpen(false);
        setNotify({ push: false });
        void AsyncStorage.setItem(SEEN_KEY, '1');
      }}
    />
  );
}
