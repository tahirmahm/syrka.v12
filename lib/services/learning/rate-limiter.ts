/**
 * Provider-neutral upload-throttling/quota abstraction. No paid
 * rate-limit dependency is added during this hotfix — production stays
 * disabled by LEARNING_AUTHORING_ENABLED regardless, so the in-memory
 * implementation below is a conservative development stand-in, not a
 * durable limiter. See the Learning Persistence and Tenancy Architecture
 * Checkpoint for the production replacement (a durable, cross-instance
 * limiter — e.g. Redis/Upstash-backed — implementing this same interface).
 */
export interface RateLimitDecision {
  allowed: boolean
  retryAfterMs?: number
}

export interface RateLimiter {
  /** Returns whether `key` may proceed right now, consuming one unit of its budget if so. */
  consume(key: string): RateLimitDecision
}

export interface ConcurrencyLimiter {
  tryAcquire(key: string): boolean
  release(key: string): void
}

interface WindowState {
  windowStartMs: number
  count: number
}

/**
 * Fixed-window counter, process-local — resets when a new window
 * starts, and (like the rest of this prototype) does not share state
 * across Vercel instances. Adequate only while production authoring
 * stays disabled.
 */
export class InMemoryRateLimiter implements RateLimiter {
  private readonly windows = new Map<string, WindowState>()

  constructor(
    private readonly maxPerWindow: number,
    private readonly windowMs: number
  ) {}

  consume(key: string): RateLimitDecision {
    const now = Date.now()
    const state = this.windows.get(key)

    if (!state || now - state.windowStartMs >= this.windowMs) {
      this.windows.set(key, { windowStartMs: now, count: 1 })
      return { allowed: true }
    }

    if (state.count >= this.maxPerWindow) {
      return { allowed: false, retryAfterMs: this.windowMs - (now - state.windowStartMs) }
    }

    state.count += 1
    return { allowed: true }
  }
}

/** Caps how many uploads may be mid-extraction for a given key at once — extraction runs synchronously inside the request today. */
export class InMemoryConcurrencyLimiter implements ConcurrencyLimiter {
  private readonly active = new Map<string, number>()

  constructor(private readonly maxConcurrent: number) {}

  tryAcquire(key: string): boolean {
    const current = this.active.get(key) ?? 0
    if (current >= this.maxConcurrent) return false
    this.active.set(key, current + 1)
    return true
  }

  release(key: string): void {
    const current = this.active.get(key) ?? 0
    this.active.set(key, Math.max(0, current - 1))
  }
}

/** Conservative development defaults — a durable per-actor/per-institution quota is part of the persistence checkpoint's scope, not this hotfix. */
export const uploadThrottlePerActor = new InMemoryRateLimiter(10, 60_000)
export const uploadThrottlePerInstitution = new InMemoryRateLimiter(30, 60_000)
export const uploadConcurrencyPerInstitution = new InMemoryConcurrencyLimiter(2)

export class ProcessingTimeoutError extends Error {
  constructor(message = 'Processing timed out.') {
    super(message)
    this.name = 'ProcessingTimeoutError'
  }
}

/** Wraps a promise with a hard timeout — INTAKE_LIMITS.processingTimeoutMs was defined but never enforced before this hotfix. */
export async function withProcessingTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ProcessingTimeoutError(`Processing exceeded ${timeoutMs}ms.`)), timeoutMs)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timer!)
  }
}
