'use client';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { ChipGroup, Field, RangeField, SelectField, Switch } from '@/components/ui/Controls';
import { Notice } from '@/components/ui/States';
import { destinations, origins } from '@/data/demo/routes';
import { useHydrated } from '@/hooks/useHydrated';
import { COUNTRIES } from '@/lib/i18n/countries';
import type { AccessibilityNeed, CulturalInterest, FitnessLevel, FoodPreference, Locale, LodgingPreference, WalkingStyle } from '@/lib/domain/types';
import { addDays } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';

const STEPS = ['Idioma', 'Datas e rota', 'Ritmo', 'Orçamento', 'Interesses', 'Acessibilidade', 'Companhia', 'Privacidade'] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useAppStore((s) => s.user);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [locale, setLocale] = useState<Locale>('pt');
  const [countryCode, setCountry] = useState('BR');
  const [startDate, setStartDate] = useState(addDays(new Date().toISOString(), 30));
  const [originId, setOrigin] = useState('porto');
  const [destinationId, setDestination] = useState('santiago');
  const [daysAvailable, setDays] = useState(12);
  const [dailyKm, setDailyKm] = useState(20);
  const [fitness, setFitness] = useState<FitnessLevel[]>(['beginner']);
  const [dailyBudgetEur, setBudget] = useState(50);
  const [lodging, setLodging] = useState<LodgingPreference[]>(['albergue', 'pousada']);
  const [food, setFood] = useState<FoodPreference[]>(['local']);
  const [interests, setInterests] = useState<CulturalInterest[]>(['churches', 'gastronomy']);
  const [accessibility, setAccessibility] = useState<AccessibilityNeed[]>([]);
  const [walkingStyle, setWalkingStyle] = useState<WalkingStyle[]>(['meet']);
  const [consentTerms, setTerms] = useState(false);
  const [consentLocation, setLocation] = useState(false);
  const [consentAnalytics, setAnalytics] = useState(false);
  const [consentVoice, setVoice] = useState(false);

  useEffect(() => {
    if (hydrated && !user) router.replace('/entrar?modo=cadastro');
  }, [hydrated, user, router]);

  function next() {
    setError(null);
    if (step === 1 && !startDate) return setError('Escolha uma data estimada de início.');
    if (step === STEPS.length - 1) {
      if (!consentTerms) return setError('Para continuar, aceite os termos de uso e a política de privacidade.');
      const displayName = sessionStorage.getItem('camino-display-name') || user?.email.split('@')[0] || 'Peregrino';
      completeOnboarding(
        {
          displayName,
          locale,
          countryCode,
          startDate,
          originId,
          destinationId,
          daysAvailable,
          dailyKm,
          fitness: fitness[0],
          dailyBudgetEur,
          lodging,
          food,
          interests,
          accessibility,
          walkingStyle: walkingStyle[0],
          languages: [locale],
        },
        { consentTerms, consentLocation, consentAnalytics, consentVoiceProcessing: consentVoice },
      );
      router.push('/planejar?novo=1');
      return;
    }
    setStep((s) => s + 1);
  }

  return (
    <main id="conteudo" className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 py-6">
      <div className="flex items-center justify-between">
        <Logo />
        <span className="text-sm font-semibold text-muted">
          Passo {step + 1} de {STEPS.length}
        </span>
      </div>
      <div className="mt-4 flex gap-1" aria-hidden>
        {STEPS.map((s, i) => (
          <span key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-line'}`} />
        ))}
      </div>
      <h1 className="mt-6 text-2xl font-extrabold" aria-live="polite">
        {STEPS[step]}
      </h1>

      <div className="mt-4 flex flex-1 flex-col gap-5">
        {step === 0 && (
          <>
            <ChipGroup
              label="Idioma do aplicativo"
              single
              value={[locale]}
              onChange={(v) => setLocale(v[0])}
              options={[
                { id: 'pt', label: 'Português' },
                { id: 'en', label: 'English' },
                { id: 'es', label: 'Español' },
              ]}
            />
            {locale !== 'pt' && <Notice tone="info">Neste MVP a interface está em português; inglês e espanhol estão no roadmap. Sua preferência fica salva.</Notice>}
            <SelectField label="País de origem" value={countryCode} onChange={(e) => setCountry(e.target.value)}>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </SelectField>
          </>
        )}
        {step === 1 && (
          <>
            <Field label="Data estimada de início" type="date" value={startDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setStartDate(e.target.value)} />
            <SelectField label="Ponto de partida" value={originId} onChange={(e) => setOrigin(e.target.value)} hint="Caminho Português. Outros caminhos virão em versões futuras.">
              {origins.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </SelectField>
            <SelectField label="Destino final" value={destinationId} onChange={(e) => setDestination(e.target.value)}>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </SelectField>
          </>
        )}
        {step === 2 && (
          <>
            <RangeField label="Dias disponíveis para caminhar" value={daysAvailable} min={3} max={30} unit="dias" onChange={setDays} />
            <RangeField label="Distância diária desejada" value={dailyKm} min={8} max={35} unit="km" onChange={setDailyKm} />
            <ChipGroup
              label="Condicionamento físico"
              single
              value={fitness}
              onChange={setFitness}
              options={[
                { id: 'beginner', label: 'Iniciante' },
                { id: 'intermediate', label: 'Intermediário' },
                { id: 'advanced', label: 'Avançado' },
              ]}
            />
          </>
        )}
        {step === 3 && (
          <>
            <RangeField label="Orçamento diário" value={dailyBudgetEur} min={20} max={200} step={5} unit="EUR" onChange={setBudget} />
            <ChipGroup
              label="Hospedagem preferida"
              value={lodging}
              onChange={setLodging}
              options={[
                { id: 'albergue', label: 'Albergue' },
                { id: 'hostel', label: 'Hostel' },
                { id: 'pousada', label: 'Pousada' },
                { id: 'hotel', label: 'Hotel' },
                { id: 'casa_rural', label: 'Casa rural' },
                { id: 'camping', label: 'Camping' },
                { id: 'religioso', label: 'Acolhida religiosa' },
              ]}
            />
            <ChipGroup
              label="Alimentação"
              value={food}
              onChange={setFood}
              options={[
                { id: 'local', label: 'Cozinha local' },
                { id: 'budget', label: 'Econômica' },
                { id: 'vegetarian', label: 'Vegetariana' },
                { id: 'vegan', label: 'Vegana' },
                { id: 'gluten_free', label: 'Sem glúten' },
              ]}
            />
          </>
        )}
        {step === 4 && (
          <ChipGroup
            label="O que você quer descobrir?"
            value={interests}
            onChange={setInterests}
            options={[
              { id: 'churches', label: 'Igrejas e monumentos' },
              { id: 'museums', label: 'Museus' },
              { id: 'gastronomy', label: 'Gastronomia' },
              { id: 'festivals', label: 'Festas e música' },
              { id: 'nature', label: 'Natureza' },
              { id: 'history', label: 'História' },
              { id: 'markets', label: 'Mercados locais' },
            ]}
          />
        )}
        {step === 5 && (
          <>
            <ChipGroup
              label="Precisa de algum apoio? (opcional)"
              value={accessibility}
              onChange={setAccessibility}
              options={[
                { id: 'low_slope', label: 'Evitar subidas fortes' },
                { id: 'paved', label: 'Preferir piso pavimentado' },
                { id: 'no_stairs', label: 'Evitar escadas' },
                { id: 'transport_support', label: 'Transporte de apoio' },
                { id: 'accessible_places', label: 'Estabelecimentos acessíveis' },
              ]}
            />
            <p className="text-sm text-muted">Essas informações ficam só no seu perfil e servem para sugerir rotas e lugares.</p>
          </>
        )}
        {step === 6 && (
          <ChipGroup
            label="Como prefere caminhar?"
            single
            value={walkingStyle}
            onChange={setWalkingStyle}
            options={[
              { id: 'alone', label: 'Sozinho(a)' },
              { id: 'group', label: 'Em grupo' },
              { id: 'meet', label: 'Quero conhecer pessoas' },
            ]}
          />
        )}
        {step === 7 && (
          <div className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-surface px-4">
            <Switch checked={consentTerms} onChange={setTerms} label="Aceito os termos de uso e a política de privacidade (obrigatório)" description="Você pode apagar sua conta e seus dados a qualquer momento." />
            <Switch checked={consentLocation} onChange={setLocation} label="Usar minha localização durante a navegação" description="Opcional. Compartilhar com a comunidade é outra opção, que começa desligada." />
            <Switch checked={consentAnalytics} onChange={setAnalytics} label="Ajudar a melhorar o app com estatísticas anônimas" description="Opcional. Sem dados pessoais." />
            <Switch checked={consentVoice} onChange={setVoice} label="Permitir processamento de voz no tradutor" description="Opcional. Pediremos confirmação antes de cada gravação." />
          </div>
        )}
        {error && <Notice tone="danger">{error}</Notice>}
      </div>

      <div className="sticky bottom-0 mt-6 flex gap-3 bg-bg py-3">
        {step > 0 && (
          <Button variant="outline" size="lg" onClick={() => setStep((s) => s - 1)} icon={<ArrowLeft aria-hidden />}>
            Voltar
          </Button>
        )}
        <Button size="lg" block onClick={next} icon={step === STEPS.length - 1 ? <Check aria-hidden /> : <ArrowRight aria-hidden />}>
          {step === STEPS.length - 1 ? 'Concluir e planejar' : 'Continuar'}
        </Button>
      </div>
    </main>
  );
}
