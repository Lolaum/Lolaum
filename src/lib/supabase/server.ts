import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * 요청당 한 번만 Supabase 클라이언트를 생성하도록 캐시.
 * 동일 요청 내 여러 server action / helper에서 호출해도 동일 인스턴스를 공유한다.
 */
export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component에서는 쿠키 설정 불가 - 무시
          }
        },
      },
    },
  );
});

/**
 * 현재 로그인한 유저를 요청당 1회만 조회.
 *
 * `getUser()`는 매 호출마다 Supabase Auth 서버 왕복(100~200ms)이 발생하지만,
 * `getSession()`은 로컬 쿠키만 읽어 거의 0ms이다.
 *
 * 미들웨어(`src/lib/supabase/middleware.ts`)에서 이미 모든 요청에 대해
 * `getUser()`로 토큰 검증/갱신을 수행하므로, 서버 액션 단계에서는 검증된
 * 쿠키를 그대로 신뢰해도 안전하다. user.id는 RLS에서 `auth.uid()`로 다시
 * 검증되기 때문에 데이터 접근 자체도 보호된다.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user ?? null;
});
