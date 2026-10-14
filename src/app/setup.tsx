import { Redirect } from 'expo-router';

/** Older links land on the real plan screen. Profile setup is plan, then services. */
export default function SetupScreen() {
  return <Redirect href="/vendor-onboarding" />;
}
