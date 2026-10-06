import { INDICATIVE, NOT_A_BOOKING } from '@/constants/copy';
import { Notice } from '@/components/Notice';

export function Disclaimer({ short }: { short?: boolean }) {
  return <Notice tone="warning" title={NOT_A_BOOKING} body={short ? 'Final price and conditions are agreed directly with the provider.' : INDICATIVE} />;
}
