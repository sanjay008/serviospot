import { Redirect } from 'expo-router';

// Menu management uses the server backed offerings screen.
export default function VendorMenuTab() {
  return <Redirect href="/vendor/packages" />;
}
