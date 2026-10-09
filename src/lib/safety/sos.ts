export const EU_EMERGENCY_NUMBER = '112';
/** Segundos de contagem regressiva antes de ligar, cancelável. */
export const SOS_COUNTDOWN_SECONDS = 5;

export type SosState =
  | { step: 'idle' }
  | { step: 'confirming' }
  | { step: 'countdown'; secondsLeft: number }
  | { step: 'activated'; at: string }
  | { step: 'cancelled' };

export type SosAction = { type: 'press' } | { type: 'confirm' } | { type: 'tick' } | { type: 'cancel' } | { type: 'reset' };

/**
 * Máquina de estados do SOS: exige 2 ações deliberadas (pressionar + confirmar)
 * e oferece contagem regressiva cancelável, reduzindo acionamentos acidentais.
 */
export function sosReducer(state: SosState, action: SosAction, now = new Date()): SosState {
  switch (action.type) {
    case 'press':
      return state.step === 'idle' || state.step === 'cancelled' ? { step: 'confirming' } : state;
    case 'confirm':
      return state.step === 'confirming' ? { step: 'countdown', secondsLeft: SOS_COUNTDOWN_SECONDS } : state;
    case 'tick':
      if (state.step !== 'countdown') return state;
      return state.secondsLeft <= 1 ? { step: 'activated', at: now.toISOString() } : { step: 'countdown', secondsLeft: state.secondsLeft - 1 };
    case 'cancel':
      return state.step === 'confirming' || state.step === 'countdown' ? { step: 'cancelled' } : state;
    case 'reset':
      return { step: 'idle' };
  }
}
