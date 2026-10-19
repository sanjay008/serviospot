import { Platform } from 'react-native';

import type { AppNotification, NotifyPrefs } from '@/data/types';

type NotificationsModule = typeof import('expo-notifications');
type PushNote = import('expo-notifications').Notification;

export const CHANNEL_ID = 'default';

let handledLaunch = false;

function loadNotifications(): NotificationsModule | null {
  if (Platform.OS === 'web') return null;
  try {
    return require('expo-notifications') as NotificationsModule;
  } catch {
    return null;
  }
}

const Notifications = loadNotifications();

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export function notificationOpenedApp() {
  return handledLaunch;
}

export function hrefFromNotification(notification: PushNote) {
  const url = notification.request.content.data?.url;
  return typeof url === 'string' && url.startsWith('/') ? url : null;
}

export function markNotificationHandled() {
  handledLaunch = true;
  Notifications?.clearLastNotificationResponse();
}

export function subscribeToOpens(onOpen: (notification: PushNote, replace: boolean) => void) {
  if (!Notifications) return () => undefined;
  const last = Notifications.getLastNotificationResponse();
  if (last?.notification) onOpen(last.notification, true);
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    onOpen(response.notification, false);
  });
  return () => subscription.remove();
}

/** Show a phone alert only when the matching settings toggle is on. */
export function wantsPush(prefs: NotifyPrefs, note: Pick<AppNotification, 'title'>) {
  if (!prefs.push) return false;
  const title = note.title.toLowerCase();
  if (title.includes('review')) return prefs.reviews;
  if (title.includes('proposal')) return prefs.proposals;
  if (title.includes('message')) return prefs.messages;
  if (title.includes('request') || title.includes('contact') || title.includes('continued')) return prefs.requests;
  return true;
}

export async function notificationPermission(): Promise<'granted' | 'denied' | 'undetermined' | 'unavailable'> {
  if (!Notifications || Platform.OS === 'web') return 'unavailable';
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export async function prepareNotifications() {
  // Remote push registration is paused while API calls are disabled.
  return null;
}

export async function presentLocal(note: Pick<AppNotification, 'title' | 'body' | 'href'>) {
  if (!Notifications || Platform.OS === 'web') return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: note.title,
        body: note.body,
        data: { url: note.href },
        sound: true,
      },
      trigger: Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null,
    });
  } catch {
    // Permission was denied, or this install does not include the notifications native module yet.
  }
}
