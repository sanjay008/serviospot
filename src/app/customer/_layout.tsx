import { Tabs } from 'expo-router/js-tabs';

import { tabIcon, useTabScreenOptions } from '@/navigation/tabs';

export default function CustomerTabs() {
  const options = useTabScreenOptions();
  return (
    <Tabs screenOptions={options}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="requests" options={{ title: 'Requests', tabBarIcon: tabIcon('doc') }} />
      <Tabs.Screen name="favorites" options={{ title: 'Saved', tabBarIcon: tabIcon('heart') }} />
      <Tabs.Screen name="messages" options={{ title: 'Chat', tabBarIcon: tabIcon('chat') }} />
      <Tabs.Screen name="account" options={{ title: 'Me', tabBarIcon: tabIcon('person') }} />
    </Tabs>
  );
}
