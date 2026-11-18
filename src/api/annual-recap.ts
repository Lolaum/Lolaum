"use server";

import { getCurrentUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatKoreaDateKey } from "@/lib/korea-date";
import { buildAnnualRecap } from "@/lib/annual-recap";
import type { AnnualRecap } from "@/types/annual-recap";
import { RECAP_START_DATE } from "@/types/annual-recap";

// Supabase's default response limit must not truncate a full year of records.
async function readAll<T>(
  page: (
    from: number,
    to: number,
  ) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
): Promise<T[]> {
  const rows: T[] = [];
  const size = 250;
  for (let from = 0; ; from += size) {
    const { data, error } = await page(from, from + size - 1);
    if (error || !data)
      throw new Error(error?.message ?? "회고 데이터를 읽지 못했습니다.");
    rows.push(...data);
    if (data.length < size) return rows;
  }
}

/** This endpoint always derives the owner from the verified session, never from client input. */
export async function getAnnualRecap(): Promise<{
  data?: AnnualRecap;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "로그인 후 나의 회고를 확인할 수 있어요." };
    const db = createAdminClient();
    const [profile, challenges] = await Promise.all([
      db.from("profiles").select("name").eq("id", user.id).maybeSingle(),
      readAll((from, to) =>
        db
          .from("challenges")
          .select("id,user_id,period_id,reset_at")
          .eq("user_id", user.id)
          .order("id")
          .range(from, to),
      ),
    ]);
    if (profile.error) throw new Error(profile.error.message);
    const periodIds = [
      ...new Set(challenges.map((challenge) => challenge.period_id)),
    ];
    const periods = periodIds.length
      ? await readAll((from, to) =>
          db
            .from("challenge_periods")
            .select("id,label,start_date,end_date")
            .in("id", periodIds)
            .lte("start_date", "2026-12-31")
            .gte("start_date", RECAP_START_DATE)
            .order("id")
            .range(from, to),
        )
      : [];
    const asOf = formatKoreaDateKey();
    const scopedPeriodIds = new Set(
      periods
        .filter(
          (period) =>
            !/테스트|test/i.test(period.label ?? "") &&
            period.start_date <= asOf,
        )
        .map((period) => period.id),
    );
    const scopedChallenges = challenges.filter((challenge) =>
      scopedPeriodIds.has(challenge.period_id),
    );
    const ids = scopedChallenges.map((challenge) => challenge.id);
    const base = {
      userId: user.id,
      name: profile.data?.name || "챌린저",
      asOf,
      periods,
      challenges: scopedChallenges,
    };
    if (!ids.length)
      return {
        data: buildAnnualRecap({
          ...base,
          registrations: [],
          records: [],
          declarations: [],
          midReviews: [],
          finalReviews: [],
          books: [],
        }),
      };

    const [
      registrations,
      records,
      declarations,
      midReviews,
      finalReviews,
      books,
    ] = await Promise.all([
      readAll((from, to) =>
        db
          .from("challenge_registrations")
          .select("id,user_id,challenge_id,routine_type,registered_at")
          .eq("user_id", user.id)
          .in("challenge_id", ids)
          .order("id")
          .range(from, to),
      ),
      readAll((from, to) =>
        db
          .from("ritual_records")
          .select(
            "id,user_id,challenge_id,routine_type,record_date,record_data,created_at",
          )
          .eq("user_id", user.id)
          .in("challenge_id", ids)
          .gte("record_date", RECAP_START_DATE)
          .lte("record_date", asOf < "2026-12-31" ? asOf : "2026-12-31")
          .order("id")
          .range(from, to),
      ),
      readAll((from, to) =>
        db
          .from("declarations")
          .select("*")
          .eq("user_id", user.id)
          .in("challenge_id", ids)
          .order("id")
          .range(from, to),
      ),
      readAll((from, to) =>
        db
          .from("mid_reviews")
          .select("*")
          .eq("user_id", user.id)
          .in("challenge_id", ids)
          .order("id")
          .range(from, to),
      ),
      readAll((from, to) =>
        db
          .from("final_reviews")
          .select("*")
          .eq("user_id", user.id)
          .in("challenge_id", ids)
          .order("id")
          .range(from, to),
      ),
      readAll((from, to) =>
        db
          .from("books")
          .select("id,title,author")
          .eq("user_id", user.id)
          .order("id")
          .range(from, to),
      ),
    ]);
    return {
      data: buildAnnualRecap({
        ...base,
        registrations,
        records,
        declarations,
        midReviews,
        finalReviews,
        books,
      }),
    };
  } catch {
    // A failed query must not become a plausible-looking empty retrospective.
    return { error: "회고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요." };
  }
}
