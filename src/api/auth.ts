"use server";

import { createClient } from "@/lib/supabase/server";

// Supabase Auth 영문 에러 메시지를 한국어로 매핑.
// 매칭 안 되면 일반 안내 문구로 폴백 (영문 노출 방지).
function translateAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }
  if (lower.includes("email not confirmed")) {
    return "이메일 인증이 완료되지 않았습니다.";
  }
  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return "이미 가입된 이메일입니다.";
  }
  if (lower.includes("password should be at least")) {
    return "비밀번호는 6자 이상이어야 합니다.";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
  }
  if (lower.includes("invalid email") || lower.includes("unable to validate email")) {
    return "올바른 이메일 형식이 아닙니다.";
  }
  if (lower.includes("network") || lower.includes("fetch failed")) {
    return "네트워크 연결을 확인해주세요.";
  }
  if (lower.includes("user not found")) {
    return "등록되지 않은 계정입니다.";
  }

  return "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
}

export async function login(data: { email: string; password: string }) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  return { success: true };
}

export async function signup(data: {
  username: string;
  name: string;
  email: string;
  password: string;
}) {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
      },
    },
  });

  if (authError) {
    return { error: translateAuthError(authError.message) };
  }

  if (authData.user) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        name: data.name,
        username: data.username,
      })
      .eq("id", authData.user.id);

    if (profileError) {
      return { error: profileError.message };
    }
  }

  return { success: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return { success: true };
}

export async function checkUsername(username: string) {
  if (!username.trim()) {
    return { error: "닉네임을 입력해주세요.", available: false };
  }

  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  return { available: !data };
}

export async function findEmail(username: string) {
  if (!username.trim()) {
    return { error: "닉네임을 입력해주세요." };
  }

  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("email")
    .eq("username", username.trim())
    .single();

  if (!data) {
    return { error: "해당 닉네임으로 등록된 계정을 찾을 수 없습니다." };
  }

  const email = data.email;
  const [local, domain] = email.split("@");
  const masked =
    local.length <= 2
      ? local[0] + "*".repeat(local.length - 1)
      : local.slice(0, 2) + "*".repeat(local.length - 2);

  return { email: masked + "@" + domain };
}

export async function resetPassword(email: string) {
  if (!email.trim()) {
    return { error: "이메일을 입력해주세요." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reset-password`,
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  return { success: true };
}

export async function updatePassword(newPassword: string) {
  if (!newPassword || newPassword.length < 6) {
    return { error: "비밀번호는 6자 이상이어야 합니다." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  return { success: true };
}
