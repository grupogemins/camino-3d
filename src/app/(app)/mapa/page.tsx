import { Suspense } from 'react';
import { MapScreen } from './MapScreen';

export default function MapaPage() {
  return (
    <Suspense>
      <MapScreen />
    </Suspense>
  );
}
