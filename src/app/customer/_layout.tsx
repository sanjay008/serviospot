import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { tabIcon, tabOptions } from '@/navigation/tabs';
import { useApp } from '@/state/store';

export default function CustomerTabs() {
  const { session } = useApp();
  if (!session.signedIn) return <Redirect href="/login" />;
  return (
    <Tabs screenOptions={tabOptions()}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="requests" options={{ title: 'Requests', tabBarIcon: tabIcon('doc') }} />
      <Tabs.Screen name="favorites" options={{ title: 'Saved', tabBarIcon: tabIcon('heart') }} />
      <Tabs.Screen name="messages" options={{ title: 'Chat', tabBarIcon: tabIcon('chat') }} />
      <Tabs.Screen name="account" options={{ title: 'Me', tabBarIcon: tabIcon('person') }} />
    </Tabs>
  );
}
