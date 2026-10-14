import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { tabIcon, useTabScreenOptions } from '@/navigation/tabs';
import { useApp } from '@/state/store';

export default function BusinessTabs() {
  const { session } = useApp();
  const options = useTabScreenOptions();
  if (!session.signedIn) return <Redirect href="/role" />;
  return (
    <Tabs screenOptions={options}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="leads" options={{ title: 'Requests', tabBarIcon: tabIcon('inbox') }} />
      <Tabs.Screen name="offerings" options={{ title: 'Menu', tabBarIcon: tabIcon('food') }} />
      <Tabs.Screen name="messages" options={{ title: 'Chat', tabBarIcon: tabIcon('chat') }} />
      <Tabs.Screen name="menu" options={{ title: 'More', tabBarIcon: tabIcon('list') }} />
    </Tabs>
  );
}
