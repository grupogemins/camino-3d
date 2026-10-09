import { Suspense } from 'react';
import { AccommodationList } from './AccommodationList';

export default function HospedagensPage() {
  return (
    <Suspense>
      <AccommodationList />
    </Suspense>
  );
}
