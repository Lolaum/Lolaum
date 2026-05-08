import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// 30일. PWA(특히 iOS 홈화면 추가)에서 세션 쿠키가 앱 종료 시 사라지는 것을 방지.
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

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
      cookieOptions: {
        maxAge: SESSION_MAX_AGE,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      },
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
 * `getUser()`는 Supabase Auth 서버에 토큰을 검증하므로 쿠키 위/변조에 안전하다.
 * `cache()`로 감싸 같은 요청 내 여러 호출은 1회 네트워크 호출로 합쳐진다.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
});
