"use server";

import { createClient } from "@/lib/supabase/server";
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
} from "@/types/feed";

// routine_type → RoutineCategory 매핑
const ROUTINE_TO_CATEGORY: Partial<Record<RoutineTypeDB, RoutineCategory>> = {
  morning: "모닝",
  exercise: "운동",
  reading: "독서",
  english: "영어",
  second_language: "제2외국어",
  finance: "자산관리",
  english_book: "독서", // 원서읽기도 독서 카테고리로 표시
};

// DB record_data → FeedRoutineData 변환
async function transformRecordData(
  record: RitualRecord,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<FeedRoutineData | undefined> {
  const data = record.record_data as Record<string, unknown>;
  if (!data) return undefined;

  switch (record.routine_type) {
    case "exercise":
      return {
        images: (data.images as string[]) ?? [],
        exerciseName: (data.exerciseName as string) ?? "",
        duration: (data.duration as number) ?? 0,
        achievement: (data.achievement as string) ?? "",
      } satisfies ExerciseFeedData;

    case "morning":
      return {
        image: data.image as string | undefined,
        sleepHours: (data.sleepHours as number) ?? 0,
        condition: (data.condition as "상" | "중" | "하") ?? "중",
        successAndReflection: (data.successAndReflection as string) ?? "",
        gift: (data.gift as string) ?? "",
      } satisfies MorningFeedData;

    case "reading":
    case "english_book": {
      const bookId = data.bookId as string | undefined;
      let bookTitle = "책 제목 없음";
      let author = "";
      let totalPages: number | undefined;

      if (bookId) {
        const { data: book } = await supabase
          .from("books")
          .select("title, author, total_value, current_value, tracking_type")
          .eq("id", bookId)
          .single();
        if (book) {
          bookTitle = book.title;
          author = book.author;
          totalPages = book.total_value;
        }
      }

      return {
        bookTitle,
        author,
        trackingType: (data.trackingType as "page" | "percent") ?? "page",
        pagesRead: data.endValue as number | undefined,
        totalPages,
        progressAmount: data.progressAmount as number | undefined,
        noteType: (data.noteType as "sentence" | "summary") ?? "sentence",
        note: data.note as string | undefined,
        thoughts: data.thoughts as string | undefined,
      } satisfies ReadingFeedData;
    }

    case "english":
    case "second_language":
      return {
        images: (data.images as string[]) ?? [],
        achievement: (data.achievement as string) ?? "",
        expressions:
          (data.expressions as { word: string; meaning: string; example: string }[]) ?? [],
      } satisfies LanguageFeedData;

    case "finance":
      return {
        dailyExpenses:
          (data.dailyExpenses as FinanceFeedData["dailyExpenses"]) ?? [],
        studyContent: (data.studyContent as string) ?? "",
        practice: (data.practice as string) ?? "",
      } satisfies FinanceFeedData;

    default:
      return undefined;
  }
}

// DB RitualRecord → FeedItem 변환
async function recordToFeedItem(
  record: RitualRecord,
  profile: { id: string; name: string; avatar_url: string | null } | null,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<FeedItem | null> {
  const category = ROUTINE_TO_CATEGORY[record.routine_type];
  if (!category) return null; // recording 등 지원하지 않는 타입은 스킵

  const routineData = await transformRecordData(record, supabase);

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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: [], error: "인증이 필요합니다." };
  }

  // 프로필 가져오기
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .eq("id", user.id)
    .single();

  let query = supabase
    .from("ritual_records")
    .select("*")
    .eq("user_id", user.id);

  if (options?.routineType) {
    query = query.eq("routine_type", options.routineType);
  }

  // recording 타입은 제외 (UI에서 지원하지 않음)
  query = query.neq("routine_type", "recording");

  query = query.order("record_date", { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data: records, error } = await query;

  if (error) return { data: [], error: error.message };
  if (!records?.length) return { data: [] };

  const feedItems: FeedItem[] = [];
  for (const record of records) {
    const item = await recordToFeedItem(
      record,
      profile ? { id: profile.id, name: profile.name, avatar_url: profile.avatar_url } : null,
      supabase,
    );
    if (item) feedItems.push(item);
  }

  return { data: feedItems };
}

/** 단일 리추얼 기록 가져오기 (피드 상세용) */
export async function getRecordById(
  id: string,
): Promise<{ data: FeedItem | null; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "인증이 필요합니다." };
  }

  const { data: record, error } = await supabase
    .from("ritual_records")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !record) {
    return { data: null, error: error?.message ?? "기록을 찾을 수 없습니다." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .eq("id", record.user_id)
    .single();

  const item = await recordToFeedItem(record, profile, supabase);

  // 댓글 가져오기: feeds 테이블에서 매핑된 feed_id로 조회
  if (item) {
    const { data: feed } = await supabase
      .from("feeds")
      .select("id")
      .eq("ritual_record_id", id)
      .single();

    if (feed) {
      const { data: rawComments } = await supabase
        .from("feed_comments")
        .select("id, user_id, text, created_at")
        .eq("feed_id", feed.id)
        .order("created_at", { ascending: true });

      if (rawComments?.length) {
        const commentUserIds = [...new Set(rawComments.map((c) => c.user_id))];
        const { data: commentProfiles } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", commentUserIds);

        const nameMap = new Map(
          (commentProfiles ?? []).map((p) => [p.id, p.name]),
        );

        item.comments = rawComments.map((c) => ({
          id: c.id as unknown as number,
          odOriginalId: c.id,
          userId: c.user_id as unknown as number,
          userName: nameMap.get(c.user_id) ?? "알 수 없음",
          text: c.text,
          date: c.created_at,
        }));
      }
    }
  }

  return { data: item };
}

/** 전체 유저 리추얼 기록 가져오기 (피드용) */
export async function getAllRecordsForDisplay(options?: {
  routineType?: RoutineTypeDB;
  limit?: number;
  offset?: number;
}): Promise<{ data: FeedItem[]; total: number; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: [], total: 0, error: "인증이 필요합니다." };
  }

  // 먼저 총 개수 쿼리
  let countQuery = supabase
    .from("ritual_records")
    .select("id", { count: "exact", head: true })
    .neq("routine_type", "recording");

  if (options?.routineType) {
    countQuery = countQuery.eq("routine_type", options.routineType);
  }

  const { count } = await countQuery;

  // 데이터 쿼리
  let query = supabase
    .from("ritual_records")
    .select("*")
    .neq("routine_type", "recording")
    .order("record_date", { ascending: false });

  if (options?.routineType) {
    query = query.eq("routine_type", options.routineType);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options?.limit ?? 8) - 1);
  }

  const { data: records, error } = await query;

  if (error) return { data: [], total: 0, error: error.message };
  if (!records?.length) return { data: [], total: 0 };

  // 관련된 모든 user_id의 프로필 가져오기
  const userIds = [...new Set(records.map((r) => r.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p]),
  );

  const feedItems: FeedItem[] = [];
  for (const record of records) {
    const profile = profileMap.get(record.user_id) ?? null;
    const item = await recordToFeedItem(record, profile, supabase);
    if (item) feedItems.push(item);
  }

  return { data: feedItems, total: count ?? 0 };
}
