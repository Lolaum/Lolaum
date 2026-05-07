/**
 * 간단한 인메모리 Rate Limiter (서버 액션용)
 * - 서버리스 환경에서는 인스턴스별로 독립 동작하지만,
 *   단일 인스턴스 내 브루트포스 공격을 효과적으로 차단함.
 * - 프로덕션 스케일업 시 @upstash/ratelimit + Redis로 교체 권장.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// 오래된 엔트리 주기적 정리 (메모리 누수 방지)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 60_000);

interface RateLimitOptions {
  /** 허용 최대 요청 수 */
  limit: number;
  /** 윈도우 크기 (밀리초) */
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
}

export function rateLimit(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { success: true, remaining: options.limit - 1 };
  }

  if (entry.count >= options.limit) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: options.limit - entry.count };
}
