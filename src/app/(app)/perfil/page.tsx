'use client';
import { Download, LogOut, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PrivacyControls } from '@/components/community/PrivacyControls';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Field, Segmented, SelectField, Switch } from '@/components/ui/Controls';
import { Dialog } from '@/components/ui/Dialog';
import { Notice } from '@/components/ui/States';
import { COUNTRIES } from '@/lib/i18n/countries';
import { useAppStore, type ThemePref } from '@/store/useAppStore';

export default function PerfilPage() {
  const router = useRouter();
  const state = useAppStore();
  const { profile, privacy, updateProfile, updatePrivacy, theme, setTheme, reducedMotion, setReducedMotion, textScale, setTextScale, deleteAccount, signOut, user } = state;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [typed, setTyped] = useState('');

  function exportData() {
    const { user: u, profile: p, privacy: pr, trip, avatar, journal, emergencyContacts, subscription, favorites, connections } = useAppStore.getState();
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), user: u, profile: p, privacy: pr, trip, avatar, journal, emergencyContacts, subscription, favorites, connections }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'camino-3d-meus-dados.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <TopBar title="Perfil e configurações" back="/eu" />
      <SectionTitle>Perfil público</SectionTitle>
      <Card className="flex flex-col gap-4">
        <Field label="Nome exibido" value={profile?.displayName ?? ''} onChange={(e) => updateProfile({ displayName: e.target.value })} />
        <SelectField label="País" value={profile?.countryCode ?? 'XX'} onChange={(e) => updateProfile({ countryCode: e.target.value })}>
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </SelectField>
        <Field label="Idiomas que você fala" hint="Separe por vírgula. Ex.: pt, es, en" value={(profile?.languages ?? []).join(', ')} onChange={(e) => updateProfile({ languages: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
        <Field label="Sobre você (opcional)" maxLength={160} value={profile?.bio ?? ''} onChange={(e) => updateProfile({ bio: e.target.value })} />
        <p className="text-sm text-muted">Conta: {user?.email} (modo demonstração, salva neste aparelho)</p>
      </Card>

      <SectionTitle>Privacidade e localização</SectionTitle>
      <PrivacyControls />
      <Card className="mt-3 flex flex-col divide-y divide-line">
        <Switch checked={privacy.consentLocation} onChange={(v) => updatePrivacy({ consentLocation: v })} label="Usar minha localização na navegação" description="O GPS fica só no aparelho; não é enviado ao servidor." />
        <Switch checked={privacy.consentAnalytics} onChange={(v) => updatePrivacy({ consentAnalytics: v })} label="Estatísticas anônimas de uso" description="Ajuda a melhorar o app. Sem dados pessoais." />
        <Switch checked={privacy.consentVoiceProcessing} onChange={(v) => updatePrivacy({ consentVoiceProcessing: v })} label="Processamento de voz no tradutor" description="O reconhecimento de voz do navegador pode enviar o áudio ao fornecedor do navegador." />
      </Card>

      <SectionTitle>Aparência e acessibilidade</SectionTitle>
      <Card className="flex flex-col gap-4">
        <Segmented<ThemePref> label="Tema" value={theme} onChange={setTheme} options={[{ id: 'system', label: 'Sistema' }, { id: 'light', label: 'Claro' }, { id: 'dark', label: 'Escuro' }, { id: 'contrast', label: 'Alto contraste' }]} />
        <Segmented label="Tamanho do texto" value={String(textScale) as '1' | '1.15' | '1.3'} onChange={(v) => setTextScale(Number(v) as 1 | 1.15 | 1.3)} options={[{ id: '1', label: 'Normal' }, { id: '1.15', label: 'Grande' }, { id: '1.3', label: 'Muito grande' }]} />
        <Switch checked={reducedMotion} onChange={setReducedMotion} label="Reduzir movimento" description="Desliga animações do app e do personagem 3D. O app também respeita a configuração do sistema." />
      </Card>

      <SectionTitle>Seus dados</SectionTitle>
      <Card className="flex flex-col gap-2">
        <Button variant="outline" onClick={exportData} icon={<Download aria-hidden />}>Baixar meus dados (JSON)</Button>
        <Button variant="outline" onClick={() => { signOut(); router.push('/'); }} icon={<LogOut aria-hidden />}>Sair</Button>
        <Button variant="danger" onClick={() => setConfirmDelete(true)} icon={<Trash2 aria-hidden />}>Apagar conta e todos os dados</Button>
      </Card>

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Apagar conta?"
        footer={
          <>
            <Button variant="outline" block onClick={() => setConfirmDelete(false)}>Cancelar</Button>
            <Button variant="danger" block disabled={typed.trim().toUpperCase() !== 'APAGAR'} onClick={() => { deleteAccount(); router.push('/'); }}>Apagar definitivamente</Button>
          </>
        }
      >
        <Notice tone="danger">Isto remove perfil, viagens, diário, contatos, conexões e assinatura de demonstração deste aparelho. Não pode ser desfeito.</Notice>
        <div className="mt-3">
          <Field label='Digite "APAGAR" para confirmar' value={typed} onChange={(e) => setTyped(e.target.value)} />
        </div>
      </Dialog>
    </>
  );
}
