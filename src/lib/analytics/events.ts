export const ANALYTICS_EVENTS = [
  'signup_started',
  'signup_completed',
  'onboarding_completed',
  'route_created',
  'navigation_started',
  'accommodation_viewed',
  'booking_click',
  'translation_used',
  'location_sharing_enabled',
  'pilgrim_connected',
  'premium_trial_started',
  'subscription_completed',
  'subscription_cancelled',
  'retention_d7',
  'retention_d30',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  props?: Record<string, string | number | boolean>;
  at: string;
}

type Sink = (e: AnalyticsEvent) => void;

let consentGiven = false;
const sinks: Sink[] = [];
const localLog: AnalyticsEvent[] = [];

export function setAnalyticsConsent(value: boolean) {
  consentGiven = value;
}

export function addAnalyticsSink(sink: Sink) {
  sinks.push(sink);
}

/** Registra um evento SOMENTE com consentimento. Sem dados pessoais nas props. */
export function track(name: AnalyticsEventName, props?: AnalyticsEvent['props']): boolean {
  if (!consentGiven) return false;
  const e: AnalyticsEvent = { name, props, at: new Date().toISOString() };
  localLog.push(e);
  if (localLog.length > 500) localLog.shift();
  for (const s of sinks) {
    try {
      s(e);
    } catch {
      /* analytics nunca derruba o app */
    }
  }
  return true;
}

export function getLocalAnalyticsLog(): readonly AnalyticsEvent[] {
  return localLog;
}

/** Retenção: D7/D30 disparam uma vez quando o usuário volta após N dias do cadastro. */
export function retentionEventsDue(signupAt: string, now: Date, alreadySent: AnalyticsEventName[]): AnalyticsEventName[] {
  const days = (now.getTime() - new Date(signupAt).getTime()) / 86_400_000;
  const due: AnalyticsEventName[] = [];
  if (days >= 7 && !alreadySent.includes('retention_d7')) due.push('retention_d7');
  if (days >= 30 && !alreadySent.includes('retention_d30')) due.push('retention_d30');
  return due;
}
