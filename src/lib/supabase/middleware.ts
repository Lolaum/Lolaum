import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 인증 불필요한 공개 경로
// Next.js App Router의 metadata 파일들(/icon, /apple-icon, /manifest.*)도 공개 처리.
// 미인증 상태에서도 favicon/PWA manifest는 접근 가능해야 한다.
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/find-account",
  "/reset-password",
  "/auth",
  "/api",
  "/icon",
  "/apple-icon",
  "/manifest",
];

// 30일. PWA(특히 iOS 홈화면 추가)에서 세션 쿠키가 앱 종료 시 사라지는 것을 방지.
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

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
      cookieOptions: {
        maxAge: SESSION_MAX_AGE,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      },
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

  // getUser()는 토큰 검증 + 만료 시 자동 refresh를 수행한다.
  // getSession()은 로컬 쿠키만 읽기 때문에 만료된 토큰을 갱신하지 못해
  // 장시간 미접속한 유저가 강제 로그아웃되는 문제가 발생한다.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 로그인하지 않은 유저는 /login으로 리다이렉트
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
