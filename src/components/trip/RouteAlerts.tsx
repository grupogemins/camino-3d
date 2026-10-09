import { AlertTriangle, Info, OctagonAlert } from 'lucide-react';
import type { RouteAlert } from '@/lib/domain/types';
import { formatDate } from '@/lib/format';

export function RouteAlerts({ alerts }: { alerts: RouteAlert[] }) {
  if (!alerts.length) return null;
  return (
    <ul className="flex flex-col gap-2" aria-label="Alertas da rota">
      {alerts.map((a) => {
        const Icon = a.severity === 'danger' ? OctagonAlert : a.severity === 'warning' ? AlertTriangle : Info;
        const cls = a.severity === 'danger' ? 'bg-danger-soft text-danger' : a.severity === 'warning' ? 'bg-warning-soft text-warning' : 'bg-blue-soft text-blue';
        return (
          <li key={a.id} className={`flex gap-3 rounded-2xl p-3 ${cls}`}>
            <Icon aria-hidden className="mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-bold">
                <span className="sr-only">{a.severity === 'info' ? 'Informação' : 'Atenção'}: </span>
                {a.title}
                {a.km !== undefined && <span className="font-normal"> · km {a.km}</span>}
              </p>
              <p className="text-sm text-ink">{a.description}</p>
              <p className="text-xs opacity-80">Verificado em {formatDate(a.verifiedAt)} (demonstração)</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
