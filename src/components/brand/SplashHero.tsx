'use client';
import { ExploreViewer } from '@/components/avatar/Lazy3D';
import { useAppStore } from '@/store/useAppStore';

/** Abertura com o mundo 3D ao vivo (o peregrino padrão caminhando ao entardecer). */
export function SplashHero() {
  const avatar = useAppStore((s) => s.avatar);
  return (
    <div className="absolute inset-0">
      <ExploreViewer config={avatar} region="minho" weather="clear" timeOfDay="dusk" action="walk" />
    </div>
  );
}
