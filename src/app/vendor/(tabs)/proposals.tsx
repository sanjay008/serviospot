import { Redirect } from 'expo-router';

export default function VendorProposalsScreen() {
  return <Redirect href={{ pathname: '/vendor/leads', params: { view: 'proposals' } }} />;
}
