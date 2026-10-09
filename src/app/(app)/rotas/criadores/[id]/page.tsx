'use client';
import { MapPin, PlayCircle } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { DemoBadge } from '@/components/ui/DataSource';
import { EmptyState, Notice } from '@/components/ui/States';
import { creatorRoute, demoAffiliates } from '@/data/demo/affiliates';
import { getRoute } from '@/data/demo/routes';
import { getStop } from '@/data/demo/stops';
import { captureReferral } from '@/lib/billing/referral';
import { useAppStore } from '@/store/useAppStore';

export default function CreatorRoutePage() {
  return (
    <Suspense>
      <CreatorRoute />
    </Suspense>
  );
}

function CreatorRoute() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const createTrip = useAppStore((s) => s.createTrip);
  const profile = useAppStore((s) => s.profile);
  const cr = creatorRoute(id);
  const author = cr ? demoAffiliates.find((a) => a.id === cr.affiliateId) : undefined;
  const base = cr ? getRoute(cr.baseRouteId) : undefined;

  if (!cr || !author || !base || !author.nameUseAuthorized) {
    return (
      <>
        <TopBar title="Rota de criador" back="/rotas" />
        <EmptyState title="Rota não disponível" description="Esta rota de criador não existe ou ainda não foi autorizada." />
      </>
    );
  }

  function use() {
    // A rota do criador também atribui uma eventual compra do passe ao criador (link de indicação).
    captureReferral(`?ref=${author!.code}`);
    const t = createTrip({
      routeId: base!.id,
      originId: params.get('origin') ?? profile?.originId ?? 'porto',
      mode: 'easiest',
      days: Number(params.get('days') ?? profile?.daysAvailable ?? 12),
      dailyKm: Number(params.get('km') ?? profile?.dailyKm ?? 20),
      startDate: params.get('start') ?? profile?.startDate ?? new Date().toISOString().slice(0, 10),
      creatorRouteId: cr!.id,
    });
    if (t) router.push('/inicio');
  }

  return (
    <>
      <TopBar title={cr.title} subtitle={`Por ${author.name}`} back="/rotas" actions={cr.isDemo ? <DemoBadge compact /> : undefined} />
      <div className="flex flex-wrap gap-2">
        <Badge tone="terracotta">Rota de criador</Badge>
        <Badge>Base: {base.name}</Badge>
      </div>
      <p className="mt-3">{cr.summary}</p>
      {cr.videoUrl ? (
        <a href={cr.videoUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 font-bold text-primary"><PlayCircle aria-hidden /> Assistir ao vídeo da rota</a>
      ) : (
        <p className="mt-3 text-sm text-muted">O vídeo do criador aparece aqui quando a parceria estiver ativa.</p>
      )}
      <SectionTitle>Dicas por parada</SectionTitle>
      <ol className="flex flex-col gap-2">
        {cr.tips.map((t) => (
          <li key={t.stopId}>
            <Card className="flex gap-3">
              <MapPin aria-hidden className="mt-1 shrink-0 text-terracotta" />
              <div>
                <p className="font-bold">{getStop(t.stopId)?.name}</p>
                <p>{t.text}</p>
              </div>
            </Card>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-col gap-2">
        <Button size="lg" block onClick={use}>Usar esta rota na minha viagem</Button>
        <Notice tone="info">As dicas aparecem no Copiloto do dia. Alertas de segurança e recomendações de hospedagem continuam independentes do criador.</Notice>
      </div>
    </>
  );
}
