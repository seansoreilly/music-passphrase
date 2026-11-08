export const MAX_KEYWORDS_LENGTH = 100;

export interface ValidatedRequest {
  keywords: string;
  addNumber: boolean;
  addSpecialChar: boolean;
  includeSpaces: boolean;
  length: number | undefined;
}

export type ValidationResult = { ok: true; value: ValidatedRequest } | { ok: false; error: string };

// Control characters (incl. newlines) have no place in an artist name and would
// let a caller inject extra lines into the LLM prompt.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

function optionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null) return false;
  return typeof value === 'boolean' ? value : undefined;
}

export function validateRequestBody(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }
  const { keywords, addNumber, addSpecialChar, includeSpaces, length } = body as Record<string, unknown>;

  if (typeof keywords !== 'string' || keywords.trim().length === 0) {
    return { ok: false, error: 'Keywords are required' };
  }
  const trimmed = keywords.trim();
  if (trimmed.length > MAX_KEYWORDS_LENGTH) {
    return { ok: false, error: `Keywords must be at most ${MAX_KEYWORDS_LENGTH} characters` };
  }
  if (CONTROL_CHARS.test(trimmed)) {
    return { ok: false, error: 'Keywords contain invalid characters' };
  }

  const number = optionalBoolean(addNumber);
  const special = optionalBoolean(addSpecialChar);
  const spaces = optionalBoolean(includeSpaces);
  if (number === undefined || special === undefined || spaces === undefined) {
    return { ok: false, error: 'addNumber, addSpecialChar and includeSpaces must be booleans' };
  }

  if (length !== undefined && length !== null && (typeof length !== 'number' || !Number.isFinite(length))) {
    return { ok: false, error: 'length must be a number' };
  }

  return {
    ok: true,
    value: {
      keywords: trimmed,
      addNumber: number,
      addSpecialChar: special,
      includeSpaces: spaces,
      length: typeof length === 'number' ? length : undefined,
    },
  };
}

export interface RateLimiter {
  check(key: string, now?: number): { allowed: boolean; retryAfterSeconds: number };
}

/**
 * Best-effort per-IP sliding-window limiter held in process memory.
 *
 * It is per serverless instance: instances do not share state and a cold start
 * resets it, so it only blunts casual abuse from a single client. The durable
 * control on cost is a spend cap on the OpenRouter key (and, if needed, a
 * Vercel WAF / Firewall rate-limit rule).
 */
export function createRateLimiter({ limit = 10, windowMs = 60_000, maxKeys = 5000 } = {}): RateLimiter {
  const hits = new Map<string, number[]>();
  return {
    check(key, now = Date.now()) {
      const recent = (hits.get(key) ?? []).filter(t => now - t < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)) };
      }
      recent.push(now);
      // Re-insert so Map iteration order approximates least-recently-seen first.
      hits.delete(key);
      hits.set(key, recent);
      if (hits.size > maxKeys) {
        for (const [k, times] of hits) {
          if (times.every(t => now - t >= windowMs) || hits.size > maxKeys) hits.delete(k);
          if (hits.size <= maxKeys) break;
        }
      }
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}

export function clientIp(headers: Record<string, string | string[] | undefined>): string {
  const forwarded = headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const first = raw?.split(',')[0]?.trim();
  const real = headers['x-real-ip'];
  return first || (Array.isArray(real) ? real[0] : real) || 'unknown';
}
