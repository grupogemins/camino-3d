/** Cache TTL em memória com "stale-if-error". Substituível por Redis/KV mantendo a interface. */
interface Entry<T> {
  value: T;
  expiresAt: number;
  storedAt: number;
}

export class TtlCache<T = unknown> {
  private store = new Map<string, Entry<T>>();

  constructor(private readonly maxEntries = 500) {}

  get(key: string, now = Date.now()): T | undefined {
    const e = this.store.get(key);
    if (!e || e.expiresAt <= now) return undefined;
    return e.value;
  }

  /** Último valor mesmo expirado (usado como fallback quando o provedor falha). */
  getStale(key: string): T | undefined {
    return this.store.get(key)?.value;
  }

  set(key: string, value: T, ttlMs: number, now = Date.now()) {
    if (this.store.size >= this.maxEntries) {
      const oldest = [...this.store.entries()].sort((a, b) => a[1].storedAt - b[1].storedAt)[0];
      if (oldest) this.store.delete(oldest[0]);
    }
    this.store.set(key, { value, expiresAt: now + ttlMs, storedAt: now });
  }
}

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Tempo esgotado após ${ms} ms`);
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(ms)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}
