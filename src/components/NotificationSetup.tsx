import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { hrefFromNotification, markNotificationHandled, subscribeToOpens } from '@/notifications/push';
import { useApp } from '@/state/store';

const opened = new Set<string>();

export function NotificationSetup() {
  const { session } = useApp();
  useEffect(() => {
    if (Platform.OS === 'web') return;
    return subscribeToOpens((notification, replace) => {
      const id = notification.request.identifier;
      if (opened.has(id)) return;
      const href = hrefFromNotification(notification, session.mode === 'provider' ? 'provider' : 'customer');
      if (!href) return;
      opened.add(id);
      markNotificationHandled();
      if (replace) router.replace(href as never);
      else router.push(href as never);
    });
  }, [session.mode]);

  return null;
}
