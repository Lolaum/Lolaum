"use server";

import { revalidatePath } from "next/cache";
import { login, signup } from "@/api/auth";
import { getAdminEmails, isAdminEmail } from "@/lib/admin-auth";
import { logAdminError } from "@/lib/admin-error-log";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEffectiveStart } from "@/lib/current-challenge";
import { getKoreaTodayWithinRange } from "@/lib/korea-date";
import { calculatePenaltyAccounting } from "@/lib/progress-accounting";
import { getCurrentUser } from "@/lib/supabase/server";
import { calculateWeeklyRoutineProgress } from "@/lib/weekly-routine-progress";
import {
  ROUTINE_TYPE_LABEL,
  type Database,
  type Json,
  type Profile,
  type RoutineTypeDB,
} from "@/types/supabase";

type ChallengePeriod = Database["public"]["Tables"]["challenge_periods"]["Row"];
type AdminDeactivatedUser =
  Database["public"]["Tables"]["admin_deactivated_users"]["Row"];
type AdminReviewQuestion =
  Database["public"]["Tables"]["admin_review_questions"]["Row"];
type AdminErrorLog = Database["public"]["Tables"]["admin_error_logs"]["Row"];
type RitualRecord = Database["public"]["Tables"]["ritual_records"]["Row"];

export interface AdminRegisteredRoutine {
  id: string;
  challengeId: string;
  periodId: string | null;
  periodLabel: string;
  routineType: RoutineTypeDB;
  routineLabel: string;
}

export interface AdminUserStatus extends Profile {
  deactivated?: AdminDeactivatedUser | null;
  routineCount: number;
  routines: AdminRegisteredRoutine[];
}

export interface AdminMorningAttendanceUser {
  userId: string;
  name: string;
  username: string;
  email: string;
  challengeId: string;
  periodId: string;
  periodLabel: string;
}

export interface AdminMorningAttendanceExclusion {
  id: string;
  userId: string;
  name: string;
  username: string;
  challengeId: string;
  recordDate: string;
  reason: string | null;
  updatedAt: string;
}

export interface AdminExportRow {
  [key: string]: string | number | boolean | null;
}

export interface AdminDonationExportRow extends AdminExportRow {
  periodId: string;
  name: string;
  penaltyAmount: number;
}

export interface AdminMidReviewExportRow extends AdminExportRow {
  periodId: string;
  periodLabel: string;
  userId: string;
  name: string;
  username: string;
  email: string;
  challengeId: string;
  reviewId: string;
  goodConditions: string;
  goodConditionDetails: string;
  hardConditions: string;
  hardConditionDetails: string;
  whyStarted: string;
  keepDoing: string;
  willChange: string;
  createdAt: string;
}

export interface AdminFinalReviewExportRow extends AdminExportRow {
  periodId: string;
  periodLabel: string;
  userId: string;
  name: string;
  username: string;
  email: string;
  challengeId: string;
  reviewId: string;
  results: string;
  lifeChanges: string;
  continuationChoice: string;
  adjustmentNote: string;
  feedback: string;
  createdAt: string;
}

export interface AdminDashboardData {
  adminEmail: string;
  periods: ChallengePeriod[];
  users: AdminUserStatus[];
  reviewQuestions: AdminReviewQuestion[];
  errorLogs: AdminErrorLog[];
  morningAttendanceUsers: AdminMorningAttendanceUser[];
  morningAttendanceExclusions: AdminMorningAttendanceExclusion[];
  donationExportRows: AdminDonationExportRow[];
  midReviewExportRows: AdminMidReviewExportRow[];
  finalReviewExportRows: AdminFinalReviewExportRow[];
  unsupportedTables: string[];
}

function isMissingRelationError(
  error: { message?: string; code?: string } | null,
) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    /does not exist|schema cache|Could not find the table|relation .* does not exist/i.test(
      error.message ?? "",
    )
  );
}

function getRecordDataObject(recordData: unknown): Record<string, unknown> {
  return recordData &&
    typeof recordData === "object" &&
    !Array.isArray(recordData)
    ? (recordData as Record<string, unknown>)
    : {};
}

function isExcludedFromProgress(recordData: unknown): boolean {
  return getRecordDataObject(recordData).progressExcluded === true;
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
      error:
        "관리자 이메일 목록이 설정되지 않았습니다. LOLAUM_ADMIN_EMAILS 또는 ADMIN_EMAILS를 설정해주세요.",
    };
  }

  if (!isAdminEmail(user.email)) {
    return { user: null, error: "관리자 권한이 없습니다." };
  }

  return { user, error: null };
}

export async function adminLogin(input: { email: string; password: string }) {
  const result = await login(input);
  if (result.error) return result;

  const adminEmails = getAdminEmails();
  if (!isAdminEmail(input.email)) {
    return {
      error: "로그인은 되었지만 관리자 이메일로 등록되어 있지 않습니다.",
    };
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
  if (!isAdminEmail(input.email)) {
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

  const [
    periodsRes,
    profilesRes,
    registrationsRes,
    challengesRes,
    recordsRes,
    midReviewsRes,
    finalReviewsRes,
  ] = await Promise.all([
    admin
      .from("challenge_periods")
      .select("*")
      .order("start_date", { ascending: false }),
    admin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false }),
    admin
      .from("challenge_registrations")
      .select("id, user_id, challenge_id, routine_type"),
    admin
      .from("challenges")
      .select("id, user_id, period_id, created_at, reset_at"),
    admin
      .from("ritual_records")
      .select("id, user_id, challenge_id, routine_type, record_date, record_data, updated_at"),
    admin
      .from("mid_reviews")
      .select("*")
      .order("created_at", { ascending: false }),
    admin
      .from("final_reviews")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  if (periodsRes.error) {
    await logAdminError("admin.periods.fetch", periodsRes.error.message);
    return { error: periodsRes.error.message };
  }
  if (profilesRes.error) {
    await logAdminError("admin.profiles.fetch", profilesRes.error.message);
    return { error: profilesRes.error.message };
  }
  if (registrationsRes.error) {
    await logAdminError(
      "admin.registrations.fetch",
      registrationsRes.error.message,
    );
    return { error: registrationsRes.error.message };
  }
  if (challengesRes.error) {
    await logAdminError("admin.challenges.fetch", challengesRes.error.message);
    return { error: challengesRes.error.message };
  }
  if (recordsRes.error) {
    await logAdminError("admin.records.fetch", recordsRes.error.message);
    return { error: recordsRes.error.message };
  }
  if (midReviewsRes.error) {
    await logAdminError("admin.mid-reviews.fetch", midReviewsRes.error.message);
    return { error: midReviewsRes.error.message };
  }
  if (finalReviewsRes.error) {
    await logAdminError(
      "admin.final-reviews.fetch",
      finalReviewsRes.error.message,
    );
    return { error: finalReviewsRes.error.message };
  }

  const [deactivatedRes, questionsRes, logsRes] = await Promise.all([
    admin
      .from("admin_deactivated_users")
      .select("*")
      .is("reactivated_at", null)
      .order("deactivated_at", { ascending: false }),
    admin
      .from("admin_review_questions")
      .select("*")
      .order("review_type", { ascending: true }),
    admin
      .from("admin_error_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const deactivatedUsers = deactivatedRes.error
    ? []
    : (deactivatedRes.data ?? []);
  const reviewQuestions = questionsRes.error ? [] : (questionsRes.data ?? []);
  const errorLogs = logsRes.error ? [] : (logsRes.data ?? []);

  if (isMissingRelationError(deactivatedRes.error))
    unsupportedTables.push("admin_deactivated_users");
  if (isMissingRelationError(questionsRes.error))
    unsupportedTables.push("admin_review_questions");
  if (isMissingRelationError(logsRes.error))
    unsupportedTables.push("admin_error_logs");

  if (deactivatedRes.error && !isMissingRelationError(deactivatedRes.error)) {
    await logAdminError(
      "admin.deactivated.fetch",
      deactivatedRes.error.message,
    );
  }
  if (questionsRes.error && !isMissingRelationError(questionsRes.error)) {
    await logAdminError("admin.questions.fetch", questionsRes.error.message);
  }
  if (logsRes.error && !isMissingRelationError(logsRes.error)) {
    unsupportedTables.push("admin_error_logs");
  }

  const profileById = new Map(
    (profilesRes.data ?? []).map((profile) => [profile.id, profile]),
  );
  const periods = periodsRes.data ?? [];
  const periodById = new Map(periods.map((period) => [period.id, period]));
  const periodLabel = (periodId: string) => {
    const period = periodById.get(periodId);
    if (!period) return periodId;
    return period.label || `${period.start_date} ~ ${period.end_date}`;
  };
  const challengeById = new Map(
    (challengesRes.data ?? []).map((challenge) => [challenge.id, challenge]),
  );
  const deactivatedByUser = new Map(
    deactivatedUsers.map((row) => [row.user_id, row]),
  );
  const routinesByUser = new Map<string, AdminRegisteredRoutine[]>();
  for (const row of registrationsRes.data ?? []) {
    const challenge = challengeById.get(row.challenge_id);
    const periodId = challenge?.period_id ?? null;
    const routineType = row.routine_type as RoutineTypeDB;
    const list = routinesByUser.get(row.user_id) ?? [];
    list.push({
      id: row.id,
      challengeId: row.challenge_id,
      periodId,
      periodLabel: periodId ? periodLabel(periodId) : "기간 없음",
      routineType,
      routineLabel: ROUTINE_TYPE_LABEL[routineType],
    });
    routinesByUser.set(row.user_id, list);
  }

  const users = (profilesRes.data ?? []).map((profile) => {
    const routines = routinesByUser.get(profile.id) ?? [];
    return {
      ...profile,
      deactivated: deactivatedByUser.get(profile.id) ?? null,
      routineCount: routines.length,
      routines,
    };
  });
  const activePeriod = periods.find((period) => period.is_active);
  const morningAttendanceUsers: AdminMorningAttendanceUser[] = activePeriod
    ? (registrationsRes.data ?? [])
        .map((registration) => {
          if (registration.routine_type !== "morning") return null;
          const challenge = challengeById.get(registration.challenge_id);
          if (!challenge || challenge.period_id !== activePeriod.id)
            return null;
          const profile = profileById.get(registration.user_id);
          if (!profile) return null;

          return {
            userId: registration.user_id,
            name: profile.name,
            username: profile.username,
            email: profile.email,
            challengeId: registration.challenge_id,
            periodId: activePeriod.id,
            periodLabel: periodLabel(activePeriod.id),
          };
        })
        .filter((row): row is AdminMorningAttendanceUser => row !== null)
        .sort((a, b) => a.name.localeCompare(b.name, "ko"))
    : [];
  const morningAttendanceExclusions: AdminMorningAttendanceExclusion[] = (
    recordsRes.data ?? []
  )
    .map((record) => {
      if (record.routine_type !== "morning") return null;
      if (!isExcludedFromProgress(record.record_data)) return null;
      const challenge = challengeById.get(record.challenge_id);
      if (!challenge || challenge.period_id !== activePeriod?.id) return null;
      const profile = profileById.get(record.user_id);
      const recordData = getRecordDataObject(record.record_data);

      return {
        id: record.id,
        userId: record.user_id,
        name: profile?.name ?? "",
        username: profile?.username ?? "",
        challengeId: record.challenge_id,
        recordDate: record.record_date,
        reason:
          typeof recordData.progressExcludedReason === "string"
            ? recordData.progressExcludedReason
            : null,
        updatedAt: record.updated_at,
      };
    })
    .filter(
      (row): row is AdminMorningAttendanceExclusion => row !== null,
    )
    .sort((a, b) => b.recordDate.localeCompare(a.recordDate));

  const challengesByPeriod = new Map<string, typeof challengesRes.data>();
  for (const challenge of challengesRes.data ?? []) {
    const list = challengesByPeriod.get(challenge.period_id) ?? [];
    list.push(challenge);
    challengesByPeriod.set(challenge.period_id, list);
  }

  const userRegisteredTypesByChallenge = new Map<string, Set<string>>();
  for (const registration of registrationsRes.data ?? []) {
    const challenge = challengeById.get(registration.challenge_id);
    if (!challenge?.user_id) continue;

    const challengeTypes =
      userRegisteredTypesByChallenge.get(registration.challenge_id) ??
      new Set<string>();
    challengeTypes.add(registration.routine_type);
    userRegisteredTypesByChallenge.set(
      registration.challenge_id,
      challengeTypes,
    );
  }

  const userRecordTypesByDatePeriod = new Map<
    string,
    Map<string, Set<string>>
  >();
  for (const record of recordsRes.data ?? []) {
    if (isExcludedFromProgress(record.record_data)) continue;

    const challenge = challengeById.get(record.challenge_id);
    if (!challenge) continue;
    const key = `${challenge.period_id}:${record.user_id}`;
    const dateMap =
      userRecordTypesByDatePeriod.get(key) ?? new Map<string, Set<string>>();
    const types = dateMap.get(record.record_date) ?? new Set<string>();
    types.add(record.routine_type);
    dateMap.set(record.record_date, types);
    userRecordTypesByDatePeriod.set(key, dateMap);
  }

  const donationExportRows: AdminDonationExportRow[] = [];
  for (const period of periods) {
    const periodChallenges = challengesByPeriod.get(period.id) ?? [];
    for (const challenge of periodChallenges) {
      if (!challenge.user_id) continue;
      const profile = profileById.get(challenge.user_id);
      const registeredTypes =
        userRegisteredTypesByChallenge.get(challenge.id) ?? new Set<string>();
      if (registeredTypes.size === 0) continue;
      const effectiveStart = getEffectiveStart(
        period.start_date,
        challenge.reset_at,
      );
      const rangeEnd = getKoreaTodayWithinRange(period.end_date);
      const progress = calculateWeeklyRoutineProgress({
        dateMap:
          userRecordTypesByDatePeriod.get(
            `${period.id}:${challenge.user_id}`,
          ) ?? new Map(),
        registeredTypes,
        rangeStart: effectiveStart,
        rangeEnd,
      });
      const { penaltyAmount } = calculatePenaltyAccounting(
        progress.weekdayMissed,
        0,
      );
      donationExportRows.push({
        name: profile?.name ?? "",
        penaltyAmount,
        periodId: period.id,
      });
    }
  }

  const midReviewExportRows: AdminMidReviewExportRow[] = (
    midReviewsRes.data ?? []
  )
    .map((review) => {
      const challenge = challengeById.get(review.challenge_id);
      if (
        !challenge ||
        !userRegisteredTypesByChallenge.has(review.challenge_id)
      )
        return null;
      const profile = profileById.get(review.user_id);
      const periodId = challenge.period_id;
      return {
        periodId,
        periodLabel: periodLabel(periodId),
        userId: review.user_id,
        name: profile?.name ?? "",
        username: profile?.username ?? "",
        email: profile?.email ?? "",
        challengeId: review.challenge_id,
        reviewId: review.id,
        goodConditions: review.good_conditions.join(", "),
        goodConditionDetails: JSON.stringify(
          review.good_condition_details ?? {},
        ),
        hardConditions: review.hard_conditions.join(", "),
        hardConditionDetails: JSON.stringify(
          review.hard_condition_details ?? {},
        ),
        whyStarted: review.why_started,
        keepDoing: review.keep_doing,
        willChange: review.will_change,
        createdAt: review.created_at,
      };
    })
    .filter((row): row is AdminMidReviewExportRow => row !== null);

  const finalReviewExportRows: AdminFinalReviewExportRow[] = (
    finalReviewsRes.data ?? []
  )
    .map((review) => {
      const challenge = challengeById.get(review.challenge_id);
      if (
        !challenge ||
        !userRegisteredTypesByChallenge.has(review.challenge_id)
      )
        return null;
      const profile = profileById.get(review.user_id);
      const periodId = challenge.period_id;
      return {
        periodId,
        periodLabel: periodLabel(periodId),
        userId: review.user_id,
        name: profile?.name ?? "",
        username: profile?.username ?? "",
        email: profile?.email ?? "",
        challengeId: review.challenge_id,
        reviewId: review.id,
        results: review.results,
        lifeChanges: review.life_changes,
        continuationChoice:
          review.continuation_choice === "keep"
            ? "유지하고 싶다"
            : review.continuation_choice === "adjust"
              ? "조정이 필요하다"
              : review.adjustment_note || "기타",
        adjustmentNote: review.adjustment_note,
        feedback: review.feedback,
        createdAt: review.created_at,
      };
    })
    .filter((row): row is AdminFinalReviewExportRow => row !== null);

  return {
    data: {
      adminEmail: user.email ?? "",
      periods,
      users,
      reviewQuestions,
      errorLogs,
      morningAttendanceUsers,
      morningAttendanceExclusions,
      donationExportRows,
      midReviewExportRows,
      finalReviewExportRows,
      unsupportedTables,
    },
  };
}

export async function upsertChallengePeriod(input: {
  id?: string;
  label: string;
  startDate: string;
  endDate: string;
  midReviewStartDate?: string;
  midReviewEndDate?: string;
  finalReviewStartDate?: string;
  finalReviewEndDate?: string;
  isActive: boolean;
}) {
  const { user, error } = await requireAdmin();
  if (!user) return { error: error ?? "관리자 권한이 없습니다." };
  if (!input.startDate || !input.endDate)
    return { error: "기간을 입력해주세요." };
  if (input.startDate > input.endDate)
    return { error: "시작일은 종료일보다 빠르거나 같아야 합니다." };
  if (Boolean(input.midReviewStartDate) !== Boolean(input.midReviewEndDate)) {
    return { error: "중간회고 노출 시작일과 종료일을 모두 입력해주세요." };
  }
  if (
    input.midReviewStartDate &&
    input.midReviewEndDate &&
    input.midReviewStartDate > input.midReviewEndDate
  ) {
    return {
      error: "중간회고 노출 시작일은 종료일보다 빠르거나 같아야 합니다.",
    };
  }
  if (
    Boolean(input.finalReviewStartDate) !== Boolean(input.finalReviewEndDate)
  ) {
    return { error: "최종회고 노출 시작일과 종료일을 모두 입력해주세요." };
  }
  if (
    input.finalReviewStartDate &&
    input.finalReviewEndDate &&
    input.finalReviewStartDate > input.finalReviewEndDate
  ) {
    return {
      error: "최종회고 노출 시작일은 종료일보다 빠르거나 같아야 합니다.",
    };
  }

  const admin = createAdminClient();
  if (input.isActive) {
    const inactive = await admin
      .from("challenge_periods")
      .update({ is_active: false })
      .eq("is_active", true);
    if (inactive.error) return { error: inactive.error.message };
  }

  const payload = {
    label: input.label.trim() || null,
    start_date: input.startDate,
    end_date: input.endDate,
    mid_review_start_date: input.midReviewStartDate || null,
    mid_review_end_date: input.midReviewEndDate || null,
    final_review_start_date: input.finalReviewStartDate || null,
    final_review_end_date: input.finalReviewEndDate || null,
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

export async function deleteRegisteredRoutine(input: {
  registrationId: string;
}): Promise<{ success?: boolean; error?: string }> {
  const { user, error } = await requireAdmin();
  if (!user) return { error: error ?? "관리자 권한이 없습니다." };

  const admin = createAdminClient();
  const { data: registration, error: fetchError } = await admin
    .from("challenge_registrations")
    .select("id, user_id, challenge_id, routine_type")
    .eq("id", input.registrationId)
    .maybeSingle();

  if (fetchError) {
    await logAdminError("admin.routine.delete.fetch", fetchError.message, {
      registrationId: input.registrationId,
    });
    return { error: fetchError.message };
  }
  if (!registration) return { error: "삭제할 리추얼 신청을 찾을 수 없습니다." };

  const { error: deleteError } = await admin
    .from("challenge_registrations")
    .delete()
    .eq("id", input.registrationId);

  if (deleteError) {
    await logAdminError("admin.routine.delete", deleteError.message, {
      registrationId: input.registrationId,
    });
    return { error: deleteError.message };
  }

  const { error: declarationError } = await admin
    .from("declarations")
    .delete()
    .eq("user_id", registration.user_id)
    .eq("challenge_id", registration.challenge_id)
    .eq("routine_type", registration.routine_type);

  if (declarationError) {
    await logAdminError(
      "admin.routine.delete.declaration",
      declarationError.message,
      {
        registrationId: input.registrationId,
      },
    );
    return { error: declarationError.message };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/ritual");
  return { success: true };
}

async function recomputeDailyCompletionWithProgressExclusions(input: {
  admin: ReturnType<typeof createAdminClient>;
  userId: string;
  challengeId: string;
  recordDate: string;
}) {
  const [registrationsRes, recordsRes] = await Promise.all([
    input.admin
      .from("challenge_registrations")
      .select("routine_type")
      .eq("user_id", input.userId)
      .eq("challenge_id", input.challengeId),
    input.admin
      .from("ritual_records")
      .select("routine_type, record_data")
      .eq("user_id", input.userId)
      .eq("challenge_id", input.challengeId)
      .eq("record_date", input.recordDate),
  ]);

  if (registrationsRes.error) return { error: registrationsRes.error.message };
  if (recordsRes.error) return { error: recordsRes.error.message };

  const registeredTypes = new Set(
    (registrationsRes.data ?? []).map(
      (row: { routine_type: RoutineTypeDB }) => row.routine_type,
    ),
  );
  const completedTypes = new Set(
    (recordsRes.data ?? [])
      .filter((row: { record_data: unknown }) => {
        return !isExcludedFromProgress(row.record_data);
      })
      .map((row: { routine_type: RoutineTypeDB }) => row.routine_type),
  );
  const totalRegistered = registeredTypes.size;
  const totalCompleted = Array.from(registeredTypes).filter((routineType) =>
    completedTypes.has(routineType),
  ).length;

  if (totalRegistered === 0) return {};

  const result = await input.admin.from("daily_completions").upsert(
    {
      user_id: input.userId,
      challenge_id: input.challengeId,
      completion_date: input.recordDate,
      total_registered: totalRegistered,
      total_completed: totalCompleted,
      is_happy_chance: totalCompleted < totalRegistered,
      has_penalty: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,challenge_id,completion_date" },
  );

  if (result.error) return { error: result.error.message };
  return {};
}

export async function setMorningAttendanceExcluded(input: {
  userId: string;
  challengeId: string;
  recordDate: string;
  excluded: boolean;
  reason?: string;
}): Promise<{ success?: boolean; error?: string }> {
  const { user, error } = await requireAdmin();
  if (!user) return { error: error ?? "관리자 권한이 없습니다." };
  if (!input.userId || !input.challengeId || !input.recordDate) {
    return { error: "사용자와 날짜를 선택해주세요." };
  }

  const admin = createAdminClient();
  const { data: registration, error: registrationError } = await admin
    .from("challenge_registrations")
    .select("id")
    .eq("user_id", input.userId)
    .eq("challenge_id", input.challengeId)
    .eq("routine_type", "morning")
    .maybeSingle();

  if (registrationError) {
    await logAdminError(
      "admin.morning-attendance.registration.fetch",
      registrationError.message,
      input,
    );
    return { error: registrationError.message };
  }
  if (!registration) {
    return { error: "선택한 사용자는 해당 기간에 모닝리추얼을 신청하지 않았습니다." };
  }

  const { data: records, error: recordsError } = await admin
    .from("ritual_records")
    .select("*")
    .eq("user_id", input.userId)
    .eq("challenge_id", input.challengeId)
    .eq("routine_type", "morning")
    .eq("record_date", input.recordDate);

  if (recordsError) {
    await logAdminError(
      "admin.morning-attendance.records.fetch",
      recordsError.message,
      input,
    );
    return { error: recordsError.message };
  }
  if (!records?.length) {
    return { error: "선택한 날짜의 모닝리추얼 기록이 없습니다." };
  }

  const updates = (records as RitualRecord[]).map((record) => {
    const recordData = getRecordDataObject(record.record_data);
    const nextRecordData = { ...recordData };
    if (input.excluded) {
      nextRecordData.progressExcluded = true;
      nextRecordData.progressExcludedReason =
        input.reason?.trim() || "admin_morning_attendance_exclusion";
    } else {
      delete nextRecordData.progressExcluded;
      delete nextRecordData.progressExcludedReason;
    }

    return admin
      .from("ritual_records")
      .update({
        record_data: nextRecordData as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.id);
  });

  const updateResults = await Promise.all(updates);
  const failedUpdate = updateResults.find((result) => result.error);
  if (failedUpdate?.error) {
    await logAdminError(
      "admin.morning-attendance.records.update",
      failedUpdate.error.message,
      input,
    );
    return { error: failedUpdate.error.message };
  }

  const recompute = await recomputeDailyCompletionWithProgressExclusions({
    admin,
    userId: input.userId,
    challengeId: input.challengeId,
    recordDate: input.recordDate,
  });
  if (recompute.error) {
    await logAdminError(
      "admin.morning-attendance.daily.recompute",
      recompute.error,
      input,
    );
    return { error: recompute.error };
  }

  revalidatePath("/admin");
  revalidatePath("/progress");
  revalidatePath("/ritual");
  revalidatePath("/home");
  return { success: true };
}

export async function upsertReviewQuestion(input: {
  id?: string;
  reviewType: "mid" | "final";
  questionKey: string;
  label: string;
  helperText: string;
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
    is_active: input.isActive,
    updated_at: new Date().toISOString(),
  };

  const admin = createAdminClient();
  const result = input.id
    ? await admin
        .from("admin_review_questions")
        .update(payload)
        .eq("id", input.id)
    : await admin.from("admin_review_questions").insert(payload);

  if (result.error) {
    await logAdminError(
      "admin.review-question.upsert",
      result.error.message,
      payload,
    );
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
      await logAdminError("ritual.deactivation-check", error.message, {
        userId,
      });
      return { deactivated: false, error: error.message };
    }

    return { deactivated: Boolean(data) };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Unknown deactivation check error";
    await logAdminError("ritual.deactivation-check", message, { userId });
    return { deactivated: false, error: message };
  }
}
