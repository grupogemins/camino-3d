import { Suspense } from 'react';
import { RouteComparison } from './RouteComparison';

export default function RotasPage() {
  return (
    <Suspense>
      <RouteComparison />
    </Suspense>
  );
}
