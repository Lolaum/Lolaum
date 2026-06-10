"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActivePeriod } from "@/lib/current-challenge";
import { ROUTINE_TYPE_LABEL } from "@/types/supabase";
import type { RoutineTypeDB, RitualRecord } from "@/types/supabase";
import type {
  FeedItem,
  Comment,
  RoutineCategory,
  FeedRoutineData,
  ReadingFeedData,
  ExerciseFeedData,
  MorningFeedData,
  LanguageFeedData,
  FinanceFeedData,
  RecordingFeedData,
  ReflectionFeedData,
} from "@/types/feed";

// routine_type → RoutineCategory 매핑
const ROUTINE_TO_CATEGORY: Record<RoutineTypeDB, RoutineCategory> = {
  morning: "모닝",
  exercise: "운동",
  reading: "독서",
  english: "영어",
  second_language: "제2외국어",
  recording: "기록",
  finance: "자산관리",
  english_book: "원서읽기",
};

interface BookInfo {
  title: string;
  author: string;
  total_value: number | null;
  cover_image_url: string | null;
}

interface ProfileInfo {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface DeclarationArchiveRow {
  id: string;
  user_id: string;
  routine_type: RoutineTypeDB;
  answers: unknown;
  created_at: string;
}

interface MidReviewArchiveRow {
  id: string;
  user_id: string;
  good_conditions: string[];
  hard_conditions: string[];
  why_started: string;
  keep_doing: string;
  will_change: string;
  created_at: string;
}

interface FinalReviewArchiveRow {
  id: string;
  user_id: string;
  results: string;
  life_changes: string;
  continuation_choice: "keep" | "adjust";
  adjustment_note: string;
  feedback: string;
  created_at: string;
}

interface DeletedRitualRecordInfo {
  challenge_id: string;
  record_date: string;
}

// DB record_data → FeedRoutineData 변환 (책 정보는 사전 조회된 map에서 lookup)
function transformRecordData(
  record: RitualRecord,
  bookMap: Map<string, BookInfo>,
): FeedRoutineData | undefined {
  const data = record.record_data as Record<string, unknown>;
  if (!data) return undefined;

  switch (record.routine_type) {
    case "exercise":
      return {
        recordType:
          (data.recordType as ExerciseFeedData["recordType"]) ?? "exercise",
        images: (data.images as string[]) ?? [],
        exerciseName: (data.exerciseName as string) ?? "",
        duration: (data.duration as number) ?? 0,
        macros: data.macros as string | undefined,
        achievement: (data.achievement as string) ?? "",
        certPhotos: (data.certPhotos as string[]) ?? undefined,
      } satisfies ExerciseFeedData;

    case "morning":
      return {
        recordType:
          (data.recordType as MorningFeedData["recordType"]) ?? undefined,
        image: data.image as string | undefined,
        sleepHours: (data.sleepHours as number) ?? 0,
        sleepImprovement: (data.sleepImprovement as string) ?? undefined,
        condition: (data.condition as "상" | "중" | "하") ?? "중",
        success: (data.success as string) ?? "",
        reflection: (data.reflection as string) ?? "",
        certPhotos: (data.certPhotos as string[]) ?? undefined,
      } satisfies MorningFeedData;

    case "reading":
    case "english_book": {
      const bookId = data.bookId as string | undefined;
      const book = bookId ? bookMap.get(bookId) : undefined;

      return {
        bookTitle: book?.title ?? "책 제목 없음",
        author: book?.author ?? "",
        bookCover: book?.cover_image_url ?? undefined,
        trackingType: (data.trackingType as "page" | "percent") ?? "page",
        pagesRead: data.endValue as number | undefined,
        totalPages: book?.total_value ?? undefined,
        progressAmount: data.progressAmount as number | undefined,
        noteType: (data.noteType as "sentence" | "summary") ?? "sentence",
        note: data.note as string | undefined,
        thoughts: data.thoughts as string | undefined,
        certPhotos: (data.certPhotos as string[]) ?? undefined,
      } satisfies ReadingFeedData;
    }

    case "english":
    case "second_language":
      return {
        images: (data.images as string[]) ?? [],
        achievement: (data.achievement as string) ?? "",
        expressions:
          (data.expressions as {
            word: string;
            meaning: string;
            example: string;
          }[]) ?? [],
        certPhotos: (data.certPhotos as string[]) ?? undefined,
      } satisfies LanguageFeedData;

    case "finance":
      return {
        dailyExpenses:
          (data.dailyExpenses as FinanceFeedData["dailyExpenses"]) ?? [],
        studyContent: (data.studyContent as string) ?? "",
        practice: (data.practice as string) ?? "",
        certPhotos: (data.certPhotos as string[]) ?? undefined,
      } satisfies FinanceFeedData;

    case "recording":
      return {
        entries: data.entries as RecordingFeedData["entries"],
        recordType:
          (data.recordType as RecordingFeedData["recordType"]) ?? "write",
        content: data.content as string | undefined,
        link: data.link as string | undefined,
        duration: data.duration as number | undefined,
        readSourceTitle: data.readSourceTitle as string | undefined,
        readResonatedPart: data.readResonatedPart as string | undefined,
        readReason: data.readReason as string | undefined,
        certPhotos: (data.certPhotos as string[]) ?? undefined,
      } satisfies RecordingFeedData;

    default:
      return undefined;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAnyClient = { from: (...args: any[]) => any };

export type ArchiveDeleteKind =
  | "ritual_record"
  | "declaration"
  | "mid_review"
  | "final_review";

export interface ArchiveDeleteTarget {
  kind: ArchiveDeleteKind;
  id: string;
}

// records에 등장하는 모든 bookId를 한 번의 쿼리로 일괄 조회
async function fetchBookMap(
  records: RitualRecord[],
  supabase: SupabaseAnyClient,
): Promise<Map<string, BookInfo>> {
  const bookIds = new Set<string>();
  for (const r of records) {
    if (r.routine_type !== "reading" && r.routine_type !== "english_book")
      continue;
    const data = r.record_data as Record<string, unknown> | null;
    const bookId = data?.bookId as string | undefined;
    if (bookId) bookIds.add(bookId);
  }

  if (bookIds.size === 0) return new Map();

  const { data: books } = await supabase
    .from("books")
    .select("id, title, author, total_value, cover_image_url")
    .in("id", [...bookIds]);

  const map = new Map<string, BookInfo>();
  for (const b of books ?? []) {
    map.set(b.id, {
      title: b.title,
      author: b.author,
      total_value: b.total_value,
      cover_image_url: b.cover_image_url,
    });
  }
  return map;
}

// DB RitualRecord → FeedItem 변환
function recordToFeedItem(
  record: RitualRecord,
  profile: ProfileInfo | null,
  bookMap: Map<string, BookInfo>,
): FeedItem | null {
  const category = ROUTINE_TO_CATEGORY[record.routine_type];

  const routineData = transformRecordData(record, bookMap);

  return {
    id: record.id as unknown as number, // UUID를 id로 사용
    odOriginalId: record.id, // 원본 UUID 보존
    userId: record.user_id as unknown as number,
    userName: profile?.name ?? "알 수 없음",
    userProfileImage: profile?.avatar_url ?? undefined,
    date: record.record_date,
    createdAt: record.created_at,
    routineCategory: category,
    routineId: 0,
    recordId: 0,
    routineData,
    comments: [],
  } as FeedItem;
}

function firstText(values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function declarationToFeedItem(
  row: DeclarationArchiveRow,
  profile: ProfileInfo | null,
): FeedItem {
  const answers = Array.isArray(row.answers)
    ? (row.answers as { answer?: unknown }[])
    : [];
  const preview =
    firstText(answers.map((answer) => answer.answer)) ||
    "리추얼을 시작하는 마음을 남겼어요.";
  const routineLabel = ROUTINE_TO_CATEGORY[row.routine_type] ?? "리추얼";
  const routineTitle = ROUTINE_TYPE_LABEL[row.routine_type] ?? routineLabel;
  const routineData: ReflectionFeedData = {
    kind: "declaration",
    title: "리추얼 선언",
    subtitle: routineTitle,
    preview,
    chips: [routineLabel],
  };

  return {
    id: `declaration-${row.id}`,
    odOriginalId: row.id,
    userId: row.user_id,
    userName: profile?.name ?? "알 수 없음",
    userProfileImage: profile?.avatar_url ?? undefined,
    date: row.created_at,
    createdAt: row.created_at,
    routineCategory: "회고",
    routineId: 0,
    recordId: 0,
    routineData,
    comments: [],
    archiveHref: `/declaration/${row.id}`,
  };
}

function midReviewToFeedItem(
  row: MidReviewArchiveRow,
  profile: ProfileInfo | null,
): FeedItem {
  const preview =
    firstText([row.keep_doing, row.why_started, row.will_change]) ||
    "챌린지 중간 지점을 돌아봤어요.";
  const routineData: ReflectionFeedData = {
    kind: "mid-review",
    title: "중간회고",
    preview,
    chips: [
      ...row.good_conditions.slice(0, 2),
      ...row.hard_conditions.slice(0, 1),
    ],
  };

  return {
    id: `mid-review-${row.id}`,
    odOriginalId: row.id,
    userId: row.user_id,
    userName: profile?.name ?? "알 수 없음",
    userProfileImage: profile?.avatar_url ?? undefined,
    date: row.created_at,
    createdAt: row.created_at,
    routineCategory: "회고",
    routineId: 0,
    recordId: 0,
    routineData,
    comments: [],
    archiveHref: `/mid-review/${row.id}`,
  };
}

function finalReviewToFeedItem(
  row: FinalReviewArchiveRow,
  profile: ProfileInfo | null,
): FeedItem {
  const preview =
    firstText([
      row.results,
      row.life_changes,
      row.feedback,
      row.adjustment_note,
    ]) || "챌린지를 마무리하며 기록을 남겼어요.";
  const routineData: ReflectionFeedData = {
    kind: "final-review",
    title: "최종회고",
    preview,
    chips: [row.continuation_choice === "keep" ? "유지" : "조정"],
  };

  return {
    id: `final-review-${row.id}`,
    odOriginalId: row.id,
    userId: row.user_id,
    userName: profile?.name ?? "알 수 없음",
    userProfileImage: profile?.avatar_url ?? undefined,
    date: row.created_at,
    createdAt: row.created_at,
    routineCategory: "회고",
    routineId: 0,
    recordId: 0,
    routineData,
    comments: [],
    archiveHref: `/final-review/${row.id}`,
  };
}

async function recomputeDailyCompletion(input: {
  supabase: SupabaseAnyClient;
  userId: string;
  challengeId: string;
  recordDate: string;
}) {
  const [registrationsRes, recordsRes] = await Promise.all([
    input.supabase
      .from("challenge_registrations")
      .select("routine_type")
      .eq("user_id", input.userId)
      .eq("challenge_id", input.challengeId),
    input.supabase
      .from("ritual_records")
      .select("routine_type")
      .eq("user_id", input.userId)
      .eq("challenge_id", input.challengeId)
      .eq("record_date", input.recordDate),
  ]);

  const registeredTypes = new Set(
    (registrationsRes.data ?? []).map(
      (r: { routine_type: RoutineTypeDB }) => r.routine_type,
    ),
  );
  const completedTypes = new Set(
    (recordsRes.data ?? []).map(
      (r: { routine_type: RoutineTypeDB }) => r.routine_type,
    ),
  );
  const totalRegistered = registeredTypes.size;
  const totalCompleted = Array.from(registeredTypes).filter((routineType) =>
    completedTypes.has(routineType),
  ).length;

  if (totalRegistered > 0) {
    await input.supabase.from("daily_completions").upsert(
      {
        user_id: input.userId,
        challenge_id: input.challengeId,
        completion_date: input.recordDate,
        total_registered: totalRegistered,
        total_completed: totalCompleted,
      },
      { onConflict: "user_id,challenge_id,completion_date" },
    );
  }
}

function revalidateArchiveSurfaces() {
  revalidatePath("/home");
  revalidatePath("/feeds");
  revalidatePath("/progress");
  revalidatePath("/ritual");
}

/** 내 리추얼 기록 가져오기 (아카이빙용) */
export async function getMyRecordsForDisplay(options?: {
  routineType?: RoutineTypeDB;
  limit?: number;
}): Promise<{ data: FeedItem[]; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { data: [], error: "인증이 필요합니다." };
    }

    const supabase = await createClient();

    // 프로필 + 기록/회고 동시 조회
    const profilePromise = supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .eq("id", user.id)
      .single();

    let query = supabase
      .from("ritual_records")
      .select(
        "id, user_id, routine_type, record_date, record_data, challenge_id, created_at",
      )
      .eq("user_id", user.id)
      .order("record_date", { ascending: false });

    if (options?.routineType) {
      query = query.eq("routine_type", options.routineType);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const shouldIncludeReflections = !options?.routineType;

    const declarationPromise = shouldIncludeReflections
      ? supabase
          .from("declarations")
          .select("id, user_id, routine_type, answers, created_at")
          .eq("user_id", user.id)
      : Promise.resolve({ data: [] as DeclarationArchiveRow[], error: null });
    const midReviewPromise = shouldIncludeReflections
      ? supabase
          .from("mid_reviews")
          .select(
            "id, user_id, good_conditions, hard_conditions, why_started, keep_doing, will_change, created_at",
          )
          .eq("user_id", user.id)
      : Promise.resolve({ data: [] as MidReviewArchiveRow[], error: null });
    const finalReviewPromise = shouldIncludeReflections
      ? supabase
          .from("final_reviews")
          .select(
            "id, user_id, results, life_changes, continuation_choice, adjustment_note, feedback, created_at",
          )
          .eq("user_id", user.id)
      : Promise.resolve({ data: [] as FinalReviewArchiveRow[], error: null });

    const [
      { data: profile },
      { data: records, error },
      declarationsRes,
      midReviewsRes,
      finalReviewsRes,
    ] = await Promise.all([
      profilePromise,
      query,
      declarationPromise,
      midReviewPromise,
      finalReviewPromise,
    ]);

    if (error) return { data: [], error: error.message };
    if (declarationsRes.error) {
      return { data: [], error: declarationsRes.error.message };
    }
    if (midReviewsRes.error) {
      return { data: [], error: midReviewsRes.error.message };
    }
    if (finalReviewsRes.error) {
      return { data: [], error: finalReviewsRes.error.message };
    }

    // 필요한 모든 책을 한 번에 조회
    const recordRows = (records ?? []) as RitualRecord[];
    const bookMap = await fetchBookMap(recordRows, supabase);
    const profileInfo = profile
      ? { id: profile.id, name: profile.name, avatar_url: profile.avatar_url }
      : null;

    const feedItems: FeedItem[] = [];
    for (const record of recordRows) {
      const item = recordToFeedItem(record, profileInfo, bookMap);
      if (item) feedItems.push(item);
    }
    for (const declaration of (declarationsRes.data ??
      []) as DeclarationArchiveRow[]) {
      feedItems.push(declarationToFeedItem(declaration, profileInfo));
    }
    for (const review of (midReviewsRes.data ?? []) as MidReviewArchiveRow[]) {
      feedItems.push(midReviewToFeedItem(review, profileInfo));
    }
    for (const review of (finalReviewsRes.data ??
      []) as FinalReviewArchiveRow[]) {
      feedItems.push(finalReviewToFeedItem(review, profileInfo));
    }

    feedItems.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    });

    return {
      data: options?.limit ? feedItems.slice(0, options.limit) : feedItems,
    };
  } catch (e) {
    console.error("getMyRecordsForDisplay error:", e);
    return { data: [], error: "기록 조회 중 오류가 발생했습니다." };
  }
}

/** 내 아카이빙 항목 다중 삭제 */
export async function deleteMyArchiveItems(
  targets: ArchiveDeleteTarget[],
): Promise<{ deleted: number; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { deleted: 0, error: "인증이 필요합니다." };
    }

    const uniqueTargets = Array.from(
      new Map(
        targets
          .filter((target) => target.id)
          .map((target) => [`${target.kind}:${target.id}`, target]),
      ).values(),
    );
    if (uniqueTargets.length === 0) return { deleted: 0 };

    const supabase = await createClient();
    const idsByKind = uniqueTargets.reduce(
      (acc, target) => {
        acc[target.kind].push(target.id);
        return acc;
      },
      {
        ritual_record: [] as string[],
        declaration: [] as string[],
        mid_review: [] as string[],
        final_review: [] as string[],
      },
    );

    let deleted = 0;
    const completionTargets: DeletedRitualRecordInfo[] = [];

    if (idsByKind.ritual_record.length > 0) {
      const { data: records, error: fetchError } = await supabase
        .from("ritual_records")
        .select("id, challenge_id, record_date")
        .eq("user_id", user.id)
        .in("id", idsByKind.ritual_record);
      if (fetchError) return { deleted, error: fetchError.message };

      completionTargets.push(...((records ?? []) as DeletedRitualRecordInfo[]));

      const { error } = await supabase
        .from("ritual_records")
        .delete()
        .eq("user_id", user.id)
        .in("id", idsByKind.ritual_record);
      if (error) return { deleted, error: error.message };
      deleted += records?.length ?? 0;
    }

    if (idsByKind.declaration.length > 0) {
      const { data, error } = await supabase
        .from("declarations")
        .delete()
        .eq("user_id", user.id)
        .in("id", idsByKind.declaration)
        .select("id");
      if (error) return { deleted, error: error.message };
      deleted += data?.length ?? 0;
    }

    if (idsByKind.mid_review.length > 0) {
      const { data, error } = await supabase
        .from("mid_reviews")
        .delete()
        .eq("user_id", user.id)
        .in("id", idsByKind.mid_review)
        .select("id");
      if (error) return { deleted, error: error.message };
      deleted += data?.length ?? 0;
    }

    if (idsByKind.final_review.length > 0) {
      const { data, error } = await supabase
        .from("final_reviews")
        .delete()
        .eq("user_id", user.id)
        .in("id", idsByKind.final_review)
        .select("id");
      if (error) return { deleted, error: error.message };
      deleted += data?.length ?? 0;
    }

    const completionKeys = new Set<string>();
    for (const target of completionTargets) {
      const key = `${target.challenge_id}:${target.record_date}`;
      if (completionKeys.has(key)) continue;
      completionKeys.add(key);
      await recomputeDailyCompletion({
        supabase,
        userId: user.id,
        challengeId: target.challenge_id,
        recordDate: target.record_date,
      });
    }

    revalidateArchiveSurfaces();
    return { deleted };
  } catch (e) {
    console.error("deleteMyArchiveItems error:", e);
    return { deleted: 0, error: "기록 삭제 중 오류가 발생했습니다." };
  }
}

/** 단일 리추얼 기록 가져오기 (피드 상세용) */
export async function getRecordById(
  id: string,
): Promise<{ data: FeedItem | null; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { data: null, error: "인증이 필요합니다." };
    }

    // 다른 유저의 기록도 볼 수 있도록 admin 클라이언트 사용
    const admin = createAdminClient();
    const { data: record, error } = await admin
      .from("ritual_records")
      .select(
        "id, user_id, routine_type, record_date, record_data, challenge_id, created_at",
      )
      .eq("id", id)
      .single();

    if (error || !record) {
      return {
        data: null,
        error: error?.message ?? "기록을 찾을 수 없습니다.",
      };
    }

    const isMine = record.user_id === user.id;
    if (!isMine) {
      const { period } = await getActivePeriod();
      if (!period) {
        return { data: null, error: "현재 표시할 인증 게시글이 없습니다." };
      }

      const { data: challenge } = await admin
        .from("challenges")
        .select("period_id")
        .eq("id", record.challenge_id)
        .maybeSingle();

      if (challenge?.period_id !== period.id) {
        return { data: null, error: "현재 표시할 인증 게시글이 없습니다." };
      }
    }

    // 프로필 + 댓글용 feed 매핑 + 책정보 모두 병렬 조회
    const profilePromise = admin
      .from("profiles")
      .select("id, name, avatar_url")
      .eq("id", record.user_id)
      .single();

    const feedPromise = admin
      .from("feeds")
      .select("id")
      .eq("ritual_record_id", id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const bookMapPromise = fetchBookMap([record as RitualRecord], admin);

    const [{ data: profile }, { data: feed }, bookMap] = await Promise.all([
      profilePromise,
      feedPromise,
      bookMapPromise,
    ]);

    const item = recordToFeedItem(record as RitualRecord, profile, bookMap);

    // 댓글 조회
    if (item && feed) {
      const { data: rawComments } = await admin
        .from("feed_comments")
        .select("id, user_id, text, created_at")
        .eq("feed_id", feed.id)
        .order("created_at", { ascending: true });

      if (rawComments?.length) {
        const commentUserIds = [...new Set(rawComments.map((c) => c.user_id))];
        const { data: commentProfiles } = await admin
          .from("profiles")
          .select("id, name")
          .in("id", commentUserIds);

        const nameMap = new Map(
          (commentProfiles ?? []).map((p) => [p.id, p.name]),
        );

        item.comments = rawComments.map(
          (c): Comment => ({
            id: c.id as unknown as number,
            odOriginalId: c.id,
            userId: c.user_id as unknown as number,
            userName: nameMap.get(c.user_id) ?? "알 수 없음",
            text: c.text,
            date: c.created_at,
          }),
        );
      }
    }

    return { data: item };
  } catch (e) {
    console.error("getRecordById error:", e);
    return { data: null, error: "기록 조회 중 오류가 발생했습니다." };
  }
}

/** 전체 유저 리추얼 기록 가져오기 (피드용) */
export async function getAllRecordsForDisplay(options?: {
  routineType?: RoutineTypeDB;
  limit?: number;
  offset?: number;
  searchName?: string;
}): Promise<{ data: FeedItem[]; total: number; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { data: [], total: 0, error: "인증이 필요합니다." };
    }

    // 피드는 모든 유저의 기록을 보여줘야 하므로 RLS를 우회하는 admin 클라이언트 사용
    const admin = createAdminClient();

    // 닉네임 검색 시 해당 유저 ID 먼저 조회
    let searchUserIds: string[] | undefined;
    if (options?.searchName) {
      const { data: matchedProfiles } = await admin
        .from("profiles")
        .select("id")
        .ilike("name", `%${options.searchName}%`);

      searchUserIds = (matchedProfiles ?? []).map((p) => p.id);
      if (searchUserIds.length === 0) {
        return { data: [], total: 0 };
      }
    }

    // 활성 기간의 challenge_id 목록 (이전 기간 인증 게시글은 피드에서 자동으로 사라짐)
    const { period } = await getActivePeriod();
    if (!period) {
      return { data: [], total: 0 };
    }
    const { data: periodChallenges } = await admin
      .from("challenges")
      .select("id")
      .eq("period_id", period.id);
    const periodChallengeIds = (periodChallenges ?? []).map((c) => c.id);
    if (periodChallengeIds.length === 0) {
      return { data: [], total: 0 };
    }

    // count + 데이터 쿼리
    // 챌린지 기간 안에 record_date가 있는 것만 (옛 챌린지가 마이그레이션으로 현재 period에 묶인 케이스 방지)
    let countQuery = admin
      .from("ritual_records")
      .select("id", { count: "exact", head: true })
      .in("challenge_id", periodChallengeIds)
      .gte("record_date", period.start_date)
      .lte("record_date", period.end_date);

    let query = admin
      .from("ritual_records")
      .select(
        "id, user_id, routine_type, record_date, record_data, challenge_id, created_at",
      )
      .in("challenge_id", periodChallengeIds)
      .gte("record_date", period.start_date)
      .lte("record_date", period.end_date)
      .order("record_date", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (options?.routineType) {
      countQuery = countQuery.eq("routine_type", options.routineType);
      query = query.eq("routine_type", options.routineType);
    }

    if (searchUserIds) {
      countQuery = countQuery.in("user_id", searchUserIds);
      query = query.in("user_id", searchUserIds);
    }

    if (options?.limit && options.limit > 0) {
      const offset = Math.max(0, options.offset ?? 0);
      query = query.range(offset, offset + options.limit - 1);
    }

    const [{ count }, { data: records, error }] = await Promise.all([
      countQuery,
      query,
    ]);

    if (error) return { data: [], total: 0, error: error.message };
    if (!records?.length) return { data: [], total: 0 };

    // id 기준으로 dedup (정렬 불안정성/캐시 등으로 인한 중복 행 방어)
    const seen = new Set<string>();
    const uniqueRecords = (records as RitualRecord[]).filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    // 프로필 + 책정보 병렬 조회 (admin으로 전체 유저 프로필 접근)
    const userIds = [...new Set(uniqueRecords.map((r) => r.user_id))];
    const [profilesRes, bookMap] = await Promise.all([
      admin.from("profiles").select("id, name, avatar_url").in("id", userIds),
      fetchBookMap(uniqueRecords, admin),
    ]);

    const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));

    const feedItems: FeedItem[] = [];
    for (const record of uniqueRecords) {
      const profile = profileMap.get(record.user_id) ?? null;
      const item = recordToFeedItem(record, profile, bookMap);
      if (item) feedItems.push(item);
    }

    return { data: feedItems, total: count ?? 0 };
  } catch (e) {
    console.error("getAllRecordsForDisplay error:", e);
    return { data: [], total: 0, error: "피드 조회 중 오류가 발생했습니다." };
  }
}
