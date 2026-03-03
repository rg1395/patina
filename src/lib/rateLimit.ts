// Rate limiting in-memory semplice
// In produzione usa Redis (Upstash) per rate limiting distribuito

const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowSeconds: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true; // OK
  }

  if (entry.count >= limit) return false; // Bloccato

  entry.count++;
  return true; // OK
}

// Pulisci le entry scadute ogni 5 minuti
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 5 * 60 * 1000);
}
