import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 인증 불필요한 공개 경로
const PUBLIC_PATHS = ["/login", "/signup", "/find-account", "/reset-password", "/auth", "/api"];

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 공개 경로는 getUser() 호출 없이 바로 통과
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser()는 매 요청마다 Supabase Auth 서버 왕복(100~200ms)이 발생.
  // getSession()은 로컬 쿠키만 읽어 ~0ms이고, 토큰 갱신도 자동 처리된다.
  // RLS가 auth.uid()로 데이터 접근을 보호하므로 보안상 안전하다.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 로그인하지 않은 유저는 /login으로 리다이렉트
  if (!session?.user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
