'use client';
import { EyeOff, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Controls';
import { GRANULARITY_OPTIONS, effectiveGranularity, isVisibleToOthers } from '@/lib/privacy/location';
import { useAppStore } from '@/store/useAppStore';

/** Controles de presença e granularidade da localização (desligados por padrão). */
export function PrivacyControls() {
  const privacy = useAppStore((s) => s.privacy);
  const updatePrivacy = useAppStore((s) => s.updatePrivacy);
  const setGranularity = useAppStore((s) => s.setGranularity);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);
  const effective = effectiveGranularity(privacy.locationGranularity, privacy.preciseSharingExpiresAt, now);
  // expiração automática do compartilhamento preciso
  useEffect(() => {
    if (privacy.locationGranularity === 'precise_temporary' && effective === 'hidden') updatePrivacy({ locationGranularity: 'hidden', preciseSharingExpiresAt: undefined });
  }, [effective, privacy.locationGranularity, updatePrivacy]);
  const visible = isVisibleToOthers(privacy, now);
  const minutesLeft = privacy.preciseSharingExpiresAt ? Math.max(0, Math.round((new Date(privacy.preciseSharingExpiresAt).getTime() - now.getTime()) / 60000)) : 0;

  return (
    <Card className="flex flex-col gap-2">
      <Switch checked={privacy.communityPresence} onChange={(v) => updatePrivacy({ communityPresence: v })} label="Aparecer na comunidade" description="Desligado por padrão. Mostra seu perfil público limitado." />
      <Switch checked={privacy.invisibleMode} onChange={(v) => updatePrivacy({ invisibleMode: v })} label="Modo invisível" description="Você vê a comunidade, mas ninguém vê você." />
      <fieldset className="mt-2" disabled={!privacy.communityPresence || privacy.invisibleMode}>
        <legend className="mb-2 font-semibold">Quem vê minha localização e com que precisão</legend>
        <div className="flex flex-col gap-2">
          {GRANULARITY_OPTIONS.map((o) => (
            <label key={o.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 ${effective === o.id ? 'border-primary bg-primary-soft' : 'border-line'}`}>
              <input type="radio" name="granularity" className="mt-1 h-5 w-5 accent-[var(--primary)]" checked={effective === o.id} onChange={() => setGranularity(o.id)} />
              <span>
                <span className="block font-semibold">{o.label}</span>
                <span className="text-sm text-muted">{o.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {effective === 'precise_temporary' && (
        <p className="flex items-center gap-2 text-sm font-semibold text-warning" role="status">
          <Timer aria-hidden size={16} /> Posição precisa visível por mais {minutesLeft} min. Depois volta a oculta automaticamente.
        </p>
      )}
      <p className={`flex items-center gap-2 rounded-xl p-2 text-sm font-semibold ${visible ? 'bg-primary-soft text-primary' : 'bg-surface-2 text-muted'}`} role="status">
        {!visible && <EyeOff aria-hidden size={16} />}
        {visible ? `Você está visível (${GRANULARITY_OPTIONS.find((g) => g.id === effective)?.label.toLowerCase()}).` : 'Você não está visível para outros peregrinos.'}
      </p>
      <p className="text-xs text-muted">Nunca mostramos endereço de hospedagem nem histórico de posições.</p>
    </Card>
  );
}
