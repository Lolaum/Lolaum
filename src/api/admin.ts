"use server";

import { revalidatePath } from "next/cache";
import { login, signup } from "@/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/server";
import type { Database, Json, Profile, RoutineTypeDB } from "@/types/supabase";

type ChallengePeriod = Database["public"]["Tables"]["challenge_periods"]["Row"];
type AdminDeactivatedUser = Database["public"]["Tables"]["admin_deactivated_users"]["Row"];
type AdminReviewQuestion = Database["public"]["Tables"]["admin_review_questions"]["Row"];
type AdminErrorLog = Database["public"]["Tables"]["admin_error_logs"]["Row"];

export interface AdminUserStatus extends Profile {
  deactivated?: AdminDeactivatedUser | null;
  routineCount: number;
}

export interface AdminExportRow {
  userId: string;
  name: string;
  username: string;
  email: string;
  challengeId: string;
  periodId: string;
  routineType: RoutineTypeDB | "";
  recordCount: number;
  createdAt: string;
}

export interface AdminDashboardData {
  adminEmail: string;
  periods: ChallengePeriod[];
  users: AdminUserStatus[];
  reviewQuestions: AdminReviewQuestion[];
  errorLogs: AdminErrorLog[];
  exportRows: AdminExportRow[];
  unsupportedTables: string[];
}

function getAdminEmails(): string[] {
  return [process.env.LOLAUM_ADMIN_EMAILS, process.env.ADMIN_EMAILS]
    .filter(Boolean)
    .flatMap((value) => value!.split(","))
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isMissingRelationError(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    /does not exist|schema cache|Could not find the table|relation .* does not exist/i.test(
      error.message ?? "",
    )
  );
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user?.email) {
    return { user: null, error: "관리자 로그인이 필요합니다." };
  }

  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) {
    return {
      user: null,
      error: "관리자 이메일 목록이 설정되지 않았습니다. LOLAUM_ADMIN_EMAILS 또는 ADMIN_EMAILS를 설정해주세요.",
    };
  }

  if (!adminEmails.includes(user.email.toLowerCase())) {
    return { user: null, error: "관리자 권한이 없습니다." };
  }

  return { user, error: null };
}

async function logAdminError(source: string, message: string, metadata?: Json) {
  try {
    const admin = createAdminClient();
    await admin.from("admin_error_logs").insert({
      source,
      message,
      metadata: metadata ?? null,
    });
  } catch {
    // Optional admin table may not exist yet; UI reports unsupported tables from fetches.
  }
}

export async function adminLogin(input: { email: string; password: string }) {
  const result = await login(input);
  if (result.error) return result;

  const adminEmails = getAdminEmails();
  if (!adminEmails.includes(input.email.trim().toLowerCase())) {
    return { error: "로그인은 되었지만 관리자 이메일로 등록되어 있지 않습니다." };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function adminSignup(input: {
  username: string;
  email: string;
  password: string;
  inviteCode: string;
}) {
  const expectedCode = process.env.LOLAUM_ADMIN_INVITE_CODE;
  if (!expectedCode) {
    return { error: "관리자 가입 코드가 설정되지 않았습니다." };
  }
  if (input.inviteCode !== expectedCode) {
    return { error: "관리자 가입 코드가 올바르지 않습니다." };
  }

  const adminEmails = getAdminEmails();
  if (!adminEmails.includes(input.email.trim().toLowerCase())) {
    return { error: "관리자 이메일 허용 목록에 없는 계정입니다." };
  }

  const result = await signup({
    name: input.username.trim(),
    username: input.username.trim(),
    email: input.email.trim(),
    password: input.password,
  });

  if (result.error) return result;
  return { success: true };
}

export async function getAdminDashboardData(): Promise<{
  data?: AdminDashboardData;
  error?: string;
}> {
  const { user, error } = await requireAdmin();
  if (!user) return { error: error ?? "관리자 권한이 없습니다." };

  const admin = createAdminClient();
  const unsupportedTables: string[] = [];

  const [periodsRes, profilesRes, registrationsRes, challengesRes, recordsRes] =
    await Promise.all([
      admin.from("challenge_periods").select("*").order("start_date", { ascending: false }),
      admin.from("profiles").select("*").order("created_at", { ascending: false }),
      admin.from("challenge_registrations").select("id, user_id, challenge_id, routine_type"),
      admin.from("challenges").select("id, user_id, period_id, created_at"),
      admin.from("ritual_records").select("id, user_id, challenge_id, routine_type"),
    ]);

  if (periodsRes.error) return { error: periodsRes.error.message };
  if (profilesRes.error) return { error: profilesRes.error.message };
  if (registrationsRes.error) return { error: registrationsRes.error.message };
  if (challengesRes.error) return { error: challengesRes.error.message };
  if (recordsRes.error) return { error: recordsRes.error.message };

  const [deactivatedRes, questionsRes, logsRes] = await Promise.all([
    admin
      .from("admin_deactivated_users")
      .select("*")
      .is("reactivated_at", null)
      .order("deactivated_at", { ascending: false }),
    admin
      .from("admin_review_questions")
      .select("*")
      .order("review_type", { ascending: true })
      .order("sort_order", { ascending: true }),
    admin
      .from("admin_error_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const deactivatedUsers = deactivatedRes.error ? [] : (deactivatedRes.data ?? []);
  const reviewQuestions = questionsRes.error ? [] : (questionsRes.data ?? []);
  const errorLogs = logsRes.error ? [] : (logsRes.data ?? []);

  if (isMissingRelationError(deactivatedRes.error)) unsupportedTables.push("admin_deactivated_users");
  if (isMissingRelationError(questionsRes.error)) unsupportedTables.push("admin_review_questions");
  if (isMissingRelationError(logsRes.error)) unsupportedTables.push("admin_error_logs");

  if (deactivatedRes.error && !isMissingRelationError(deactivatedRes.error)) {
    await logAdminError("admin.deactivated.fetch", deactivatedRes.error.message);
  }
  if (questionsRes.error && !isMissingRelationError(questionsRes.error)) {
    await logAdminError("admin.questions.fetch", questionsRes.error.message);
  }
  if (logsRes.error && !isMissingRelationError(logsRes.error)) {
    unsupportedTables.push("admin_error_logs");
  }

  const deactivatedByUser = new Map(deactivatedUsers.map((row) => [row.user_id, row]));
  const routineCountByUser = new Map<string, number>();
  for (const row of registrationsRes.data ?? []) {
    routineCountByUser.set(row.user_id, (routineCountByUser.get(row.user_id) ?? 0) + 1);
  }

  const users = (profilesRes.data ?? []).map((profile) => ({
    ...profile,
    deactivated: deactivatedByUser.get(profile.id) ?? null,
    routineCount: routineCountByUser.get(profile.id) ?? 0,
  }));

  const profileById = new Map((profilesRes.data ?? []).map((profile) => [profile.id, profile]));
  const recordCountByChallengeRoutine = new Map<string, number>();
  for (const record of recordsRes.data ?? []) {
    const key = `${record.challenge_id}:${record.routine_type}`;
    recordCountByChallengeRoutine.set(key, (recordCountByChallengeRoutine.get(key) ?? 0) + 1);
  }

  const challengeById = new Map((challengesRes.data ?? []).map((challenge) => [challenge.id, challenge]));
  const exportRows: AdminExportRow[] = (registrationsRes.data ?? []).map((registration) => {
    const profile = profileById.get(registration.user_id);
    const challenge = challengeById.get(registration.challenge_id);
    return {
      userId: registration.user_id,
      name: profile?.name ?? "",
      username: profile?.username ?? "",
      email: profile?.email ?? "",
      challengeId: registration.challenge_id,
      periodId: challenge?.period_id ?? "",
      routineType: registration.routine_type,
      recordCount:
        recordCountByChallengeRoutine.get(
          `${registration.challenge_id}:${registration.routine_type}`,
        ) ?? 0,
      createdAt: challenge?.created_at ?? "",
    };
  });

  return {
    data: {
      adminEmail: user.email ?? "",
      periods: periodsRes.data ?? [],
      users,
      reviewQuestions,
      errorLogs,
      exportRows,
      unsupportedTables,
    },
  };
}

export async function upsertChallengePeriod(input: {
  id?: string;
  label: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}) {
  const { user, error } = await requireAdmin();
  if (!user) return { error: error ?? "관리자 권한이 없습니다." };
  if (!input.startDate || !input.endDate) return { error: "기간을 입력해주세요." };
  if (input.startDate > input.endDate) return { error: "시작일은 종료일보다 빠르거나 같아야 합니다." };

  const admin = createAdminClient();
  if (input.isActive) {
    const inactive = await admin.from("challenge_periods").update({ is_active: false }).eq("is_active", true);
    if (inactive.error) return { error: inactive.error.message };
  }

  const payload = {
    label: input.label.trim() || null,
    start_date: input.startDate,
    end_date: input.endDate,
    is_active: input.isActive,
  };

  const result = input.id
    ? await admin.from("challenge_periods").update(payload).eq("id", input.id)
    : await admin.from("challenge_periods").insert(payload);

  if (result.error) {
    await logAdminError("admin.period.upsert", result.error.message, payload);
    return { error: result.error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function setUserDeactivated(input: {
  userId: string;
  reason: string;
  deactivated: boolean;
}) {
  const { user, error } = await requireAdmin();
  if (!user) return { error: error ?? "관리자 권한이 없습니다." };

  const admin = createAdminClient();
  if (input.deactivated) {
    const result = await admin.from("admin_deactivated_users").insert({
      user_id: input.userId,
      reason: input.reason.trim() || null,
      deactivated_by: user.id,
    });
    if (result.error) {
      await logAdminError("admin.user.deactivate", result.error.message, {
        userId: input.userId,
      });
      return { error: result.error.message };
    }
  } else {
    const result = await admin
      .from("admin_deactivated_users")
      .update({ reactivated_at: new Date().toISOString() })
      .eq("user_id", input.userId)
      .is("reactivated_at", null);
    if (result.error) {
      await logAdminError("admin.user.reactivate", result.error.message, {
        userId: input.userId,
      });
      return { error: result.error.message };
    }
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function upsertReviewQuestion(input: {
  id?: string;
  reviewType: "mid" | "final";
  questionKey: string;
  label: string;
  helperText: string;
  sortOrder: number;
  isActive: boolean;
}) {
  const { user, error } = await requireAdmin();
  if (!user) return { error: error ?? "관리자 권한이 없습니다." };
  if (!input.questionKey.trim() || !input.label.trim()) {
    return { error: "질문 키와 라벨을 입력해주세요." };
  }

  const payload = {
    review_type: input.reviewType,
    question_key: input.questionKey.trim(),
    label: input.label.trim(),
    helper_text: input.helperText.trim() || null,
    sort_order: Number.isFinite(input.sortOrder) ? input.sortOrder : 0,
    is_active: input.isActive,
    updated_at: new Date().toISOString(),
  };

  const admin = createAdminClient();
  const result = input.id
    ? await admin.from("admin_review_questions").update(payload).eq("id", input.id)
    : await admin.from("admin_review_questions").insert(payload);

  if (result.error) {
    await logAdminError("admin.review-question.upsert", result.error.message, payload);
    return { error: result.error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function resolveErrorLog(id: string) {
  const { user, error } = await requireAdmin();
  if (!user) return { error: error ?? "관리자 권한이 없습니다." };

  const admin = createAdminClient();
  const result = await admin
    .from("admin_error_logs")
    .update({ resolved_at: new Date().toISOString() })
    .eq("id", id);
  if (result.error) return { error: result.error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function isUserDeactivatedForRitual(userId: string): Promise<{
  deactivated: boolean;
  error?: string;
}> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("admin_deactivated_users")
      .select("id")
      .eq("user_id", userId)
      .is("reactivated_at", null)
      .limit(1)
      .maybeSingle();

    if (error) {
      if (isMissingRelationError(error)) return { deactivated: false };
      await logAdminError("ritual.deactivation-check", error.message, { userId });
      return { deactivated: false, error: error.message };
    }

    return { deactivated: Boolean(data) };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown deactivation check error";
    await logAdminError("ritual.deactivation-check", message, { userId });
    return { deactivated: false, error: message };
  }
}
