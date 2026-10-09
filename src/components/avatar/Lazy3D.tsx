'use client';
import dynamic from 'next/dynamic';
import { Component, type ReactNode } from 'react';
import { useWebGL, usePrefersReducedMotion } from '@/hooks/useWebGL';
import type { AvatarConfiguration, RouteStop } from '@/lib/domain/types';
import { useAppStore } from '@/store/useAppStore';
import { Avatar2D } from './Avatar2D';
import type { PilgrimAction, WeatherMood } from './PilgrimModel';

// Three.js/R3F só são baixados quando uma cena 3D é exibida (carregamento sob demanda).
const AvatarStage = dynamic(() => import('./AvatarStage'), { ssr: false, loading: () => <Loading3D /> });
const ExploreScene = dynamic(() => import('./ExploreScene'), { ssr: false, loading: () => <Loading3D /> });

function Loading3D() {
  return (
    <div role="status" className="skeleton flex h-full w-full items-center justify-center rounded-2xl text-sm font-semibold text-muted">
      Carregando cena 3D…
    </div>
  );
}

/** Se o WebGL falhar em tempo de execução, mostra a alternativa 2D. */
class WebGLBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function useAnimate() {
  const reducedSystem = usePrefersReducedMotion();
  const reducedApp = useAppStore((s) => s.reducedMotion);
  return !(reducedSystem || reducedApp);
}

const POSE: Record<PilgrimAction, 'walk' | 'rest' | 'celebrate' | 'idle'> = { walk: 'walk', rest: 'rest', celebrate: 'celebrate', idle: 'idle' };

function Fallback2D({ config, action, note }: { config: AvatarConfiguration; action: PilgrimAction; note: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl bg-surface-2 p-4 text-center">
      <Avatar2D config={config} size={180} pose={POSE[action]} />
      <p className="text-sm text-muted">{note}</p>
    </div>
  );
}

export function AvatarViewer({ config, action, weather }: { config: AvatarConfiguration; action: PilgrimAction; weather: WeatherMood }) {
  const webgl = useWebGL();
  const animate = useAnimate();
  if (webgl === null) return <Loading3D />;
  const fallback = <Fallback2D config={config} action={action} note="Visualização 2D: este aparelho não suporta 3D (WebGL). Todas as opções continuam disponíveis." />;
  if (!webgl) return fallback;
  return (
    <WebGLBoundary fallback={fallback}>
      <AvatarStage config={config} action={action} weather={weather} animate={animate} />
    </WebGLBoundary>
  );
}

export function ExploreViewer({ config, region, weather, action, progress }: { config: AvatarConfiguration; region: RouteStop['region']; weather: WeatherMood; action: PilgrimAction; progress?: number }) {
  const webgl = useWebGL();
  const animate = useAnimate();
  if (webgl === null) return <Loading3D />;
  const fallback = <Fallback2D config={config} action={action} note="Modo 3D indisponível neste aparelho. Use o mapa 2D para navegar." />;
  if (!webgl) return fallback;
  return (
    <WebGLBoundary fallback={fallback}>
      <ExploreScene config={config} region={region} weather={weather} action={action} animate={animate} progress={progress} />
    </WebGLBoundary>
  );
}
