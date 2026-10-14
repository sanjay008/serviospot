import { router } from 'expo-router';

import { AuthBrand, AuthScreen, authButton } from '@/components/AuthScreen';
import { Button } from '@/components/Button';

export default function RoleScreen() {
  return (
    <AuthScreen scroll={false}>
      <AuthBrand subtitle="Find the best service for your event." />
      <Button label="Customer" style={authButton} onPress={() => router.replace('/customer')} />
      <Button label="Vendor" variant="secondary" style={authButton} onPress={() => router.push('/login?role=vendor')} />
      <Button label="Flow 2" variant="secondary" style={authButton} onPress={() => router.push('/flow2')} />
    </AuthScreen>
  );
}
