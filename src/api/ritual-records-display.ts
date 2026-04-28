"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActivePeriod } from "@/lib/current-challenge";
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
        images: (data.images as string[]) ?? [],
        exerciseName: (data.exerciseName as string) ?? "",
        duration: (data.duration as number) ?? 0,
        achievement: (data.achievement as string) ?? "",
        certPhotos: (data.certPhotos as string[]) ?? undefined,
      } satisfies ExerciseFeedData;

    case "morning":
      return {
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
          (data.expressions as { word: string; meaning: string; example: string }[]) ?? [],
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
        content: (data.content as string) ?? "",
        link: data.link as string | undefined,
        certPhotos: (data.certPhotos as string[]) ?? undefined,
      } satisfies RecordingFeedData;

    default:
      return undefined;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAnyClient = { from: (...args: any[]) => any };

// records에 등장하는 모든 bookId를 한 번의 쿼리로 일괄 조회
async function fetchBookMap(
  records: RitualRecord[],
  supabase: SupabaseAnyClient,
): Promise<Map<string, BookInfo>> {
  const bookIds = new Set<string>();
  for (const r of records) {
    if (r.routine_type !== "reading" && r.routine_type !== "english_book") continue;
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
  profile: { id: string; name: string; avatar_url: string | null } | null,
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
    routineCategory: category,
    routineId: 0,
    recordId: 0,
    routineData,
    comments: [],
  } as FeedItem;
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

    // 프로필 + 기록 동시 조회
    const profilePromise = supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .eq("id", user.id)
      .single();

    let query = supabase
      .from("ritual_records")
      .select("id, user_id, routine_type, record_date, record_data, challenge_id, created_at")
      .eq("user_id", user.id)
      .order("record_date", { ascending: false });

    if (options?.routineType) {
      query = query.eq("routine_type", options.routineType);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const [{ data: profile }, { data: records, error }] = await Promise.all([
      profilePromise,
      query,
    ]);

    if (error) return { data: [], error: error.message };
    if (!records?.length) return { data: [] };

    // 필요한 모든 책을 한 번에 조회
    const bookMap = await fetchBookMap(records as RitualRecord[], supabase);

    const feedItems: FeedItem[] = [];
    for (const record of records as RitualRecord[]) {
      const item = recordToFeedItem(
        record,
        profile ? { id: profile.id, name: profile.name, avatar_url: profile.avatar_url } : null,
        bookMap,
      );
      if (item) feedItems.push(item);
    }

    return { data: feedItems };
  } catch (e) {
    console.error("getMyRecordsForDisplay error:", e);
    return { data: [], error: "기록 조회 중 오류가 발생했습니다." };
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
      .select("id, user_id, routine_type, record_date, record_data, challenge_id, created_at")
      .eq("id", id)
      .single();

    if (error || !record) {
      return { data: null, error: error?.message ?? "기록을 찾을 수 없습니다." };
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

        item.comments = rawComments.map((c): Comment => ({
          id: c.id as unknown as number,
          odOriginalId: c.id,
          userId: c.user_id as unknown as number,
          userName: nameMap.get(c.user_id) ?? "알 수 없음",
          text: c.text,
          date: c.created_at,
        }));
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
      .select("id, user_id, routine_type, record_date, record_data, challenge_id, created_at")
      .in("challenge_id", periodChallengeIds)
      .gte("record_date", period.start_date)
      .lte("record_date", period.end_date)
      .order("record_date", { ascending: false });

    if (options?.routineType) {
      countQuery = countQuery.eq("routine_type", options.routineType);
      query = query.eq("routine_type", options.routineType);
    }

    if (searchUserIds) {
      countQuery = countQuery.in("user_id", searchUserIds);
      query = query.in("user_id", searchUserIds);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options?.limit ?? 8) - 1);
    }

    const [{ count }, { data: records, error }] = await Promise.all([
      countQuery,
      query,
    ]);

    if (error) return { data: [], total: 0, error: error.message };
    if (!records?.length) return { data: [], total: 0 };

    // 프로필 + 책정보 병렬 조회 (admin으로 전체 유저 프로필 접근)
    const userIds = [...new Set(records.map((r) => r.user_id))];
    const [profilesRes, bookMap] = await Promise.all([
      admin.from("profiles").select("id, name, avatar_url").in("id", userIds),
      fetchBookMap(records as RitualRecord[], admin),
    ]);

    const profileMap = new Map(
      (profilesRes.data ?? []).map((p) => [p.id, p]),
    );

    const feedItems: FeedItem[] = [];
    for (const record of records as RitualRecord[]) {
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
