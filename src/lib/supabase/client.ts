import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

// 30일. PWA(특히 iOS 홈화면 추가)에서 세션 쿠키가 앱 종료 시 사라지는 것을 방지.
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge: SESSION_MAX_AGE,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      },
    },
  );
}
