import { Suspense } from 'react';
import { PremiumScreen } from './PremiumScreen';

export default function PremiumPage() {
  return (
    <Suspense>
      <PremiumScreen />
    </Suspense>
  );
}
