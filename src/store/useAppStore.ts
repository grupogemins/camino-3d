'use client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_AVATAR } from '@/data/demo/avatarDefaults';
import { getRoute } from '@/data/demo/routes';
import type {
  AvatarConfiguration,
  EmergencyContact,
  JournalEntry,
  LiveInvite,
  LiveReport,
  LocationGranularity,
  Message,
  PlanId,
  PrivacySettings,
  Profile,
  RouteMode,
  SafetyCheckIn,
  Subscription,
  Trip,
  User,
} from '@/lib/domain/types';
import { getPlan, trialEndFor } from '@/lib/billing/plans';
import { planStages, shortenStage } from '@/lib/planner/planner';
import { preciseExpiry } from '@/lib/privacy/location';
import { setAnalyticsConsent, track } from '@/lib/analytics/events';

export type ThemePref = 'system' | 'light' | 'dark' | 'contrast';

const uid = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);
const nowIso = () => new Date().toISOString();

const defaultPrivacy = (userId = 'local'): PrivacySettings => ({
  userId,
  communityPresence: false,
  invisibleMode: false,
  locationGranularity: 'hidden',
  consentLocation: false,
  consentAnalytics: false,
  consentVoiceProcessing: false,
  consentTerms: false,
  updatedAt: nowIso(),
});

export interface ChatThread {
  id: string;
  title: string;
  kind: 'direct' | 'group';
  peerId?: string;
  messages: Message[];
}

interface AppState {
  user: User | null;
  profile: Profile | null;
  privacy: PrivacySettings;
  onboardingDone: boolean;
  trip: Trip | null;
  favorites: string[];
  avatar: AvatarConfiguration;
  subscription: Subscription | null;
  journal: JournalEntry[];
  emergencyContacts: EmergencyContact[];
  checkIns: SafetyCheckIn[];
  connections: Record<string, 'pending' | 'accepted' | 'declined'>;
  blocked: string[];
  reported: string[];
  chats: Record<string, ChatThread>;
  messagesSentToday: { date: string; count: number };
  phraseFavorites: string[];
  translationsUsed: number;
  theme: ThemePref;
  reducedMotion: boolean;
  textScale: 1 | 1.15 | 1.3;
  anonymousId: string;
  achievementsUnlocked: Record<string, string>;
  /** Progresso simulado na rota ativa (km). */
  simulatedKm: number;
  /** Camino Live: meus relatos, confirmações e convites. */
  liveReports: LiveReport[];
  liveVotes: Record<string, 'confirm' | 'gone'>;
  liveInvites: LiveInvite[];
  liveGoing: string[];
  openToWalkTogether: boolean;
  /** Sugestões do copiloto dispensadas (id → data). */
  copilotDismissed: Record<string, string>;

  signUp: (email: string, displayName: string) => void;
  signIn: (email: string) => void;
  signOut: () => void;
  completeOnboarding: (profile: Omit<Profile, 'userId' | 'createdAt' | 'updatedAt'>, privacy: Partial<PrivacySettings>) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  updatePrivacy: (patch: Partial<PrivacySettings>) => void;
  setGranularity: (g: LocationGranularity) => void;
  createTrip: (input: { routeId: string; originId: string; mode: RouteMode; days: number; dailyKm: number; startDate: string; creatorRouteId?: string }) => Trip | null;
  toggleSegmentDone: (segmentId: string) => void;
  markOfflineDownloaded: () => void;
  setSimulatedKm: (km: number) => void;
  toggleFavorite: (id: string) => void;
  setAvatar: (patch: Partial<AvatarConfiguration>) => void;
  subscribe: (plan: Exclude<PlanId, 'free'>, provider: Subscription['provider'], opts?: { trial?: boolean; couponCode?: string; amountPaidEur?: number; affiliateId?: string }) => void;
  shortenSegment: (segmentId: string, newEndStopId: string) => boolean;
  addLiveReport: (r: Pick<LiveReport, 'stopId' | 'kind' | 'note'>) => void;
  voteLiveReport: (id: string, vote: 'confirm' | 'gone') => void;
  addLiveInvite: (i: Pick<LiveInvite, 'stopId' | 'kind' | 'title' | 'placeName' | 'startsAt'>) => void;
  toggleGoing: (inviteId: string) => void;
  setOpenToWalkTogether: (v: boolean) => void;
  dismissCopilot: (id: string) => void;
  cancelSubscription: () => void;
  addJournal: (e: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  removeJournal: (id: string) => void;
  addContact: (c: Omit<EmergencyContact, 'id' | 'userId'>) => void;
  removeContact: (id: string) => void;
  scheduleCheckIn: (minutes: number) => void;
  resolveCheckIn: (id: string, status: 'ok' | 'missed') => void;
  requestConnection: (pilgrimId: string) => void;
  acceptConnection: (pilgrimId: string) => void;
  block: (pilgrimId: string) => void;
  unblock: (pilgrimId: string) => void;
  report: (targetId: string) => void;
  ensureChat: (id: string, title: string, kind: 'direct' | 'group', peerId?: string) => void;
  appendMessage: (chatId: string, senderId: string, body: string) => void;
  countMessageSent: () => void;
  togglePhraseFavorite: (id: string) => void;
  countTranslation: () => void;
  setTheme: (t: ThemePref) => void;
  setReducedMotion: (v: boolean) => void;
  setTextScale: (v: 1 | 1.15 | 1.3) => void;
  unlock: (code: string) => void;
  deleteAccount: () => void;
}

const initialData = () => ({
  user: null,
  profile: null,
  privacy: defaultPrivacy(),
  onboardingDone: false,
  trip: null,
  favorites: [],
  avatar: DEFAULT_AVATAR,
  subscription: null,
  journal: [],
  emergencyContacts: [],
  checkIns: [],
  connections: {},
  blocked: [],
  reported: [],
  chats: {},
  messagesSentToday: { date: '', count: 0 },
  phraseFavorites: [],
  translationsUsed: 0,
  theme: 'system' as ThemePref,
  reducedMotion: false,
  textScale: 1 as const,
  anonymousId: uid(),
  achievementsUnlocked: {},
  simulatedKm: 0,
  liveReports: [] as LiveReport[],
  liveVotes: {} as Record<string, 'confirm' | 'gone'>,
  liveInvites: [] as LiveInvite[],
  liveGoing: [] as string[],
  openToWalkTogether: false,
  copilotDismissed: {} as Record<string, string>,
});

/**
 * Estado do aplicativo persistido localmente (modo demonstração e offline).
 * Em produção, as ações chamam o repositório Supabase (ver docs/07-substituir-mocks.md)
 * e este store passa a ser cache local sincronizado.
 */
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialData(),

      signUp: (email, displayName) => {
        const user: User = { id: uid(), email: email.trim().toLowerCase(), authProvider: 'demo', createdAt: nowIso(), updatedAt: nowIso() };
        set({ user, privacy: { ...defaultPrivacy(user.id) }, profile: get().profile ? { ...get().profile!, displayName } : null });
        sessionStorage.setItem('camino-display-name', displayName);
        track('signup_completed');
      },
      signIn: (email) => {
        const existing = get().user;
        if (existing && existing.email === email.trim().toLowerCase()) return;
        const user: User = { id: uid(), email: email.trim().toLowerCase(), authProvider: 'demo', createdAt: nowIso(), updatedAt: nowIso() };
        set({ user });
      },
      signOut: () => set({ user: null }),

      completeOnboarding: (p, privacy) => {
        const user = get().user;
        const userId = user?.id ?? 'local';
        const profile: Profile = { ...p, userId, createdAt: nowIso(), updatedAt: nowIso() };
        const merged = { ...get().privacy, ...privacy, userId, updatedAt: nowIso() };
        set({ profile, privacy: merged, onboardingDone: true });
        setAnalyticsConsent(merged.consentAnalytics);
        track('onboarding_completed', { locale: p.locale, fitness: p.fitness });
      },
      updateProfile: (patch) => {
        const prof = get().profile;
        if (prof) set({ profile: { ...prof, ...patch, updatedAt: nowIso() } });
      },
      updatePrivacy: (patch) => {
        const next = { ...get().privacy, ...patch, updatedAt: nowIso() };
        set({ privacy: next });
        setAnalyticsConsent(next.consentAnalytics);
      },
      setGranularity: (g) => {
        const patch: Partial<PrivacySettings> = { locationGranularity: g, preciseSharingExpiresAt: g === 'precise_temporary' ? preciseExpiry() : undefined };
        get().updatePrivacy(patch);
        if (g !== 'hidden') track('location_sharing_enabled', { granularity: g });
      },

      createTrip: ({ routeId, originId, mode, days, dailyKm, startDate, creatorRouteId }) => {
        const route = getRoute(routeId);
        if (!route) return null;
        const fitness = get().profile?.fitness ?? 'intermediate';
        const plan = planStages({ route, originId, days, dailyKm, fitness });
        const trip: Trip = {
          id: uid(),
          userId: get().user?.id ?? 'local',
          routeId,
          mode,
          startDate,
          days,
          dailyKm,
          segments: plan.segments,
          status: 'planned',
          completedSegmentIds: [],
          completedAt: {},
          creatorRouteId,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        set({ trip, simulatedKm: plan.segments[0]?.startKm ?? 0 });
        get().unlock('first_step');
        track('route_created', { routeId, mode, days });
        return trip;
      },
      toggleSegmentDone: (segmentId) => {
        const trip = get().trip;
        if (!trip) return;
        const done = trip.completedSegmentIds.includes(segmentId) ? trip.completedSegmentIds.filter((s) => s !== segmentId) : [...trip.completedSegmentIds, segmentId];
        const status = done.length === trip.segments.length ? 'completed' : done.length ? 'active' : 'planned';
        const completedAt = { ...(trip.completedAt ?? {}) };
        if (done.includes(segmentId)) completedAt[segmentId] = nowIso();
        else delete completedAt[segmentId];
        set({ trip: { ...trip, completedSegmentIds: done, completedAt, status, updatedAt: nowIso() } });
        const walked = trip.segments.filter((s) => done.includes(s.id)).reduce((a, s) => a + s.distanceKm, 0);
        if (done.length) get().unlock('first_stage');
        if (walked >= 50) get().unlock('km_50');
        if (walked >= 100) get().unlock('km_100');
        if (trip.segments.some((s) => done.includes(s.id) && s.toStopId === 'tui')) get().unlock('border');
        if (status === 'completed') get().unlock('santiago');
      },
      markOfflineDownloaded: () => {
        const trip = get().trip;
        if (trip) set({ trip: { ...trip, offlineDownloadedAt: nowIso() } });
      },
      setSimulatedKm: (km) => set({ simulatedKm: km }),
      toggleFavorite: (id) => {
        const f = get().favorites;
        set({ favorites: f.includes(id) ? f.filter((x) => x !== id) : [...f, id] });
      },
      setAvatar: (patch) => set({ avatar: { ...get().avatar, ...patch } }),

      subscribe: (plan, provider, opts = {}) => {
        const trial = Boolean(opts.trial);
        const seats = getPlan(plan).seats;
        const sub: Subscription = {
          id: uid(),
          userId: get().user?.id ?? 'local',
          plan,
          status: trial ? 'trialing' : 'active',
          // O passe pago não expira; só o teste tem data de fim.
          currentPeriodEnd: trial ? trialEndFor() : undefined,
          routeFamily: 'caminho-portugues',
          amountPaidEur: trial ? 0 : opts.amountPaidEur ?? getPlan(plan).priceEur,
          couponCode: opts.couponCode,
          affiliateId: opts.affiliateId,
          seats,
          inviteCodes: seats > 1 ? Array.from({ length: seats - 1 }, () => `CP-${uid().slice(0, 6).toUpperCase()}`) : undefined,
          provider,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        set({ subscription: sub });
        track(trial ? 'premium_trial_started' : 'subscription_completed', { plan, provider, coupon: opts.couponCode ?? '' });
      },
      shortenSegment: (segmentId, newEndStopId) => {
        const trip = get().trip;
        const route = trip && getRoute(trip.routeId);
        if (!trip || !route) return false;
        const segments = shortenStage(route, trip.segments, segmentId, newEndStopId, { daysTotal: trip.days, dailyKm: trip.dailyKm, fitness: get().profile?.fitness ?? 'intermediate' });
        if (!segments) return false;
        set({ trip: { ...trip, segments, updatedAt: nowIso() } });
        track('route_created', { routeId: trip.routeId, mode: trip.mode, days: trip.days, replanned: true });
        return true;
      },
      addLiveReport: (r) => {
        const trip = get().trip;
        const report: LiveReport = { ...r, id: uid(), routeId: trip?.routeId ?? 'central', createdAt: nowIso(), expiresAt: new Date(Date.now() + 12 * 3_600_000).toISOString(), confirmations: 0, authorIsMe: true, isDemo: false };
        set({ liveReports: [report, ...get().liveReports] });
      },
      voteLiveReport: (id, vote) => set({ liveVotes: { ...get().liveVotes, [id]: vote } }),
      addLiveInvite: (i) => {
        const invite: LiveInvite = { ...i, id: uid(), going: 1, hostName: get().profile?.displayName ?? 'Você', hostIsMe: true, isDemo: false };
        set({ liveInvites: [invite, ...get().liveInvites], liveGoing: [...get().liveGoing, invite.id] });
      },
      toggleGoing: (inviteId) => {
        const g = get().liveGoing;
        set({ liveGoing: g.includes(inviteId) ? g.filter((x) => x !== inviteId) : [...g, inviteId] });
      },
      setOpenToWalkTogether: (v) => set({ openToWalkTogether: v }),
      dismissCopilot: (id) => set({ copilotDismissed: { ...get().copilotDismissed, [id]: nowIso() } }),
      cancelSubscription: () => {
        const s = get().subscription;
        if (!s) return;
        set({ subscription: { ...s, status: 'cancelled', updatedAt: nowIso() } });
        track('subscription_cancelled', { plan: s.plan });
      },

      addJournal: (e) => {
        const entry: JournalEntry = { ...e, id: uid(), userId: get().user?.id ?? 'local', createdAt: nowIso(), updatedAt: nowIso() };
        const journal = [entry, ...get().journal];
        set({ journal });
        if (journal.length >= 3) get().unlock('journal_3');
      },
      removeJournal: (id) => set({ journal: get().journal.filter((j) => j.id !== id) }),

      addContact: (c) => set({ emergencyContacts: [...get().emergencyContacts, { ...c, id: uid(), userId: get().user?.id ?? 'local' }] }),
      removeContact: (id) => set({ emergencyContacts: get().emergencyContacts.filter((c) => c.id !== id) }),
      scheduleCheckIn: (minutes) =>
        set({ checkIns: [{ id: uid(), userId: get().user?.id ?? 'local', dueAt: new Date(Date.now() + minutes * 60_000).toISOString(), status: 'scheduled', createdAt: nowIso() }, ...get().checkIns] }),
      resolveCheckIn: (id, status) => set({ checkIns: get().checkIns.map((c) => (c.id === id ? { ...c, status } : c)) }),

      requestConnection: (pilgrimId) => set({ connections: { ...get().connections, [pilgrimId]: 'pending' } }),
      acceptConnection: (pilgrimId) => {
        set({ connections: { ...get().connections, [pilgrimId]: 'accepted' } });
        track('pilgrim_connected');
      },
      block: (pilgrimId) => {
        const { [pilgrimId]: _removed, ...rest } = get().connections;
        void _removed;
        set({ blocked: [...new Set([...get().blocked, pilgrimId])], connections: rest });
      },
      unblock: (pilgrimId) => set({ blocked: get().blocked.filter((b) => b !== pilgrimId) }),
      report: (targetId) => set({ reported: [...new Set([...get().reported, targetId])] }),
      ensureChat: (id, title, kind, peerId) => {
        if (get().chats[id]) return;
        set({ chats: { ...get().chats, [id]: { id, title, kind, peerId, messages: [] } } });
      },
      appendMessage: (chatId, senderId, body) => {
        const chat = get().chats[chatId];
        if (!chat) return;
        const msg: Message = { id: uid(), conversationId: chatId, senderId, body, sentAt: nowIso() };
        set({ chats: { ...get().chats, [chatId]: { ...chat, messages: [...chat.messages, msg] } } });
      },
      countMessageSent: () => {
        const today = new Date().toISOString().slice(0, 10);
        const m = get().messagesSentToday;
        set({ messagesSentToday: { date: today, count: m.date === today ? m.count + 1 : 1 } });
      },

      togglePhraseFavorite: (id) => {
        const f = get().phraseFavorites;
        set({ phraseFavorites: f.includes(id) ? f.filter((x) => x !== id) : [...f, id] });
      },
      countTranslation: () => {
        const n = get().translationsUsed + 1;
        set({ translationsUsed: n });
        if (n >= 5) get().unlock('polyglot');
        track('translation_used');
      },

      setTheme: (theme) => set({ theme }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setTextScale: (textScale) => set({ textScale }),
      unlock: (code) => {
        if (get().achievementsUnlocked[code]) return;
        set({ achievementsUnlocked: { ...get().achievementsUnlocked, [code]: nowIso() } });
      },

      /** Direito ao apagamento (GDPR art. 17): remove todos os dados locais. */
      deleteAccount: () => {
        set({ ...initialData() });
        try {
          localStorage.removeItem('camino-3d');
          sessionStorage.clear();
          if ('caches' in window) caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
        } catch {
          /* ambiente sem storage */
        }
      },
    }),
    {
      name: 'camino-3d',
      version: 2,
      // v1 → v2: assinatura mensal virou Camino Pass (pagamento único).
      migrate: (persisted, version) => {
        const st = persisted as Record<string, unknown>;
        const sub = st.subscription as { plan: string } | null | undefined;
        if (version < 2 && sub?.plan === 'monthly') st.subscription = { ...sub, plan: 'pass', currentPeriodEnd: undefined };
        return st as unknown as AppState;
      },
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) setAnalyticsConsent(state.privacy.consentAnalytics);
      },
    },
  ),
);
