"use server";

import { createClient } from "@/lib/supabase/server";

export async function login(data: { email: string; password: string }) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return { error: error.message };
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
    return { error: authError.message };
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
    return { error: error.message };
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
    return { error: error.message };
  }

  return { success: true };
}
