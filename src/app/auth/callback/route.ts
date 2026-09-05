import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const resetPasswordUrl = new URL("/reset-password", request.url);

  if (!code) {
    resetPasswordUrl.searchParams.set("error", "invalid_recovery_link");
    return NextResponse.redirect(resetPasswordUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    resetPasswordUrl.searchParams.set("error", "invalid_recovery_link");
    return NextResponse.redirect(resetPasswordUrl);
  }

  return NextResponse.redirect(resetPasswordUrl);
}
