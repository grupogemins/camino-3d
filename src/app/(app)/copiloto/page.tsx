'use client';
import { TopBar } from '@/components/layout/TopBar';
import { CopilotPanel } from '@/components/copilot/CopilotPanel';
import { Card, SectionTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/States';
import { ButtonLink } from '@/components/ui/Button';
import { useTripContext } from '@/hooks/useTripContext';

export default function CopilotoPage() {
  const { trip, currentSegment } = useTripContext();
  return (
    <>
      <TopBar title="Copiloto" subtitle={currentSegment ? `Dia ${currentSegment.day}: ${currentSegment.fromName} → ${currentSegment.toName}` : undefined} back="/inicio" />
      {!trip ? (
        <EmptyState title="Planeje sua viagem primeiro" description="O copiloto analisa a etapa do dia, o clima, o seu ritmo e as hospedagens." action={<ButtonLink href="/planejar">Planejar</ButtonLink>} />
      ) : (
        <>
          <CopilotPanel max={20} showAllLink={false} />
          <SectionTitle>Como o copiloto decide</SectionTitle>
          <Card>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>Cruza a etapa do dia (distância, subida, tempo estimado) com a previsão do tempo, a luz do dia, o seu ritmo recente e o seu orçamento.</li>
              <li>Hospedagens são ordenadas só por proximidade e avaliações. Patrocinadores nunca mudam uma sugestão.</li>
              <li>Relatos da comunidade expiram em 12 horas e mostram quantas pessoas confirmaram.</li>
              <li>As sugestões ajudam a decidir, mas não garantem condições do trecho. Em emergência, ligue 112.</li>
            </ul>
          </Card>
        </>
      )}
    </>
  );
}
