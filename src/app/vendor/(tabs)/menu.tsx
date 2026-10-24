import { Redirect } from 'expo-router';

// Menu is paused. The vendor tab now shows packages with dummy data, and this screen does not call the menu API.
export default function VendorMenuTab() {
  return <Redirect href="/vendor/packages" />;
}
