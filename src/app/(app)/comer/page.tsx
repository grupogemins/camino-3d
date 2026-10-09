import { Suspense } from 'react';
import { RestaurantList } from './RestaurantList';

export default function ComerPage() {
  return (
    <Suspense>
      <RestaurantList />
    </Suspense>
  );
}
