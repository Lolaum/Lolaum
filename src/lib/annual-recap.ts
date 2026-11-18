import type { RoutineTypeDB } from "@/types/supabase";
import { ROUTINE_TYPE_LABEL } from "@/types/supabase";
import type {
  AnnualRecap,
  AnnualRecapSource,
  RecapQuote,
} from "@/types/annual-recap";
import { RECAP_MILESTONE_COUNTS, RECAP_START_DATE } from "@/types/annual-recap";
import {
  addDaysToDateKey,
  countRoutineDaysInDateKeyRange,
  formatKoreaDateKey,
  getDateKeyDayOfWeek,
} from "@/lib/korea-date";
import { calculateWeeklyRoutineProgress } from "@/lib/weekly-routine-progress";
import { isAllRoutinesCovered } from "@/lib/declarations";
import {
  buildRecapRoutineInsight,
  rankRecapLabels,
  recapList,
  recapObject,
  recapRecordTexts,
  recapText,
  routineLabel,
} from "@/lib/annual-recap-insights";

export const RECAP_YEAR = 2026;
const YEAR_END = "2026-12-31";
const unique = <T>(values: T[]): T[] => [...new Set(values)];
const min = (...dates: string[]) => [...dates].sort()[0];
const max = (...dates: string[]) => [...dates].sort().at(-1)!;

function recordText(record: AnnualRecapSource["records"][number]): string {
  const data = recapObject(record.record_data);
  return unique([
    ...recapRecordTexts(record.routine_type, data),
    recapText(data.note),
    recapText(data.notes),
    ...(record.routine_type === "english" ||
    record.routine_type === "second_language"
      ? recapList(data.expressions).map((expression) =>
          [
            recapText(expression.word),
            recapText(expression.meaning),
            recapText(expression.example),
          ]
            .filter(Boolean)
            .join("\n"),
        )
      : []),
  ])
    .filter(Boolean)
    .join("\n\n");
}

function dateOf(timestamp: string): string {
  const date = new Date(timestamp);
  return Number.isFinite(date.getTime()) ? formatKoreaDateKey(date) : "";
}

function longestRun<T>(
  values: T[],
  follows: (previous: T, next: T) => boolean,
): number {
  let longest = 0;
  let current = 0;
  values.forEach((value, index) => {
    current = index > 0 && follows(values[index - 1], value) ? current + 1 : 1;
    longest = Math.max(longest, current);
  });
  return longest;
}

function declarationTexts(answers: unknown): string[] {
  return recapList(answers)
    .filter((answer) => answer.questionId !== "cert_method")
    .sort(
      (a, b) =>
        Number(b.questionId === "expected_change") -
        Number(a.questionId === "expected_change"),
    )
    .map((answer) => recapText(answer.answer))
    .filter(Boolean);
}

const KEYWORD_STOP_WORDS = new Set([
  "오늘",
  "이번",
  "이제",
  "정말",
  "너무",
  "조금",
  "다시",
  "항상",
  "계속",
  "그냥",
  "아직",
  "정도",
  "많이",
  "매우",
  "내가",
  "제가",
  "나는",
  "저는",
  "나의",
  "나를",
  "나에게",
  "내일",
  "어제",
  "올해",
  "이번달",
  "리추얼",
  "인증",
  "있다",
  "없다",
  "했다",
  "한다",
  "된다",
  "있는",
  "없는",
  "하는",
  "하고",
  "해서",
  "하게",
  "위해",
  "것을",
  "것이",
  "하기",
  "하기로",
  "했어요",
  "했는데",
  "했습니다",
  "합니다",
  "해요",
  "같다",
  "같아요",
  "싶다",
  "싶어요",
  "생각",
  "느낌",
  "그리고",
  "하지만",
  "그래도",
  "그래서",
  "때문",
  "이것",
  "저것",
  "그것",
  "좋았다",
  "좋았어요",
  "좋은",
  "같은",
  "했음",
  "하면서",
  "작은",
  "새로운",
  "달라졌다",
  "느꼈어요",
  "전보다",
  "이렇게",
  "이런",
  "그런",
  "모든",
  "모두",
  "통해",
  "통해서",
  "것",
  "수",
  "더",
  "잘",
  "좀",
  "함",
  "완료",
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
]);

/** Counts documents mentioning a word, without inventing personality or growth claims. */
export function extractRecapKeywords(documents: string[]) {
  const words: string[] = [];
  for (const document of documents) {
    const tokens =
      document
        .replace(/https?:\/\/\S+/g, " ")
        .toLocaleLowerCase()
        .match(/[가-힣]{2,}|[a-z]{3,}/g) ?? [];
    words.push(
      ...unique(
        tokens
          .map((token) => {
            if (KEYWORD_STOP_WORDS.has(token)) return "";
            const stem = token.replace(
              /(에서는|으로는|에게는|에서도|에서|으로|처럼|보다|까지|부터|에게|하고|이며|이랑|이지만|은|는|을|를|이|가|와|과|도|에)$/,
              "",
            );
            return stem.length >= 2 ? stem : token;
          })
          .filter((word) => word && !KEYWORD_STOP_WORDS.has(word)),
      ),
    );
  }
  return rankRecapLabels(words)
    .filter((word) => word.count >= 2)
    .slice(0, 6);
}

export function buildAnnualRecap(source: AnnualRecapSource): AnnualRecap {
  const asOf = min(source.asOf, YEAR_END);
  const periods = new Map(
    source.periods
      .filter(
        (period) =>
          !/테스트|test/i.test(period.label ?? "") &&
          period.start_date <= asOf &&
          period.start_date >= RECAP_START_DATE,
      )
      .map((period) => [period.id, period]),
  );
  const challenges = source.challenges.filter(
    (challenge) =>
      challenge.user_id === source.userId && periods.has(challenge.period_id),
  );
  const challengeMap = new Map(
    challenges.map((challenge) => [challenge.id, challenge]),
  );
  const owns = (row: { user_id: string; challenge_id: string }) =>
    row.user_id === source.userId && challengeMap.has(row.challenge_id);
  const happened = (row: { created_at: string }) => {
    const date = dateOf(row.created_at);
    return date >= RECAP_START_DATE && date <= asOf;
  };
  const registrations = source.registrations.filter(
    (row) =>
      owns(row) &&
      row.routine_type !== "english_book" &&
      dateOf(row.registered_at) <= asOf,
  );
  const recapTypes = new Set(registrations.map((row) => row.routine_type));
  const recapChallengeIds = new Set(
    registrations.map((row) => row.challenge_id),
  );
  const records = source.records
    .filter((row) => {
      if (
        !owns(row) ||
        !recapTypes.has(row.routine_type) ||
        row.record_date < RECAP_START_DATE ||
        row.record_date > asOf
      )
        return false;
      const period = periods.get(
        challengeMap.get(row.challenge_id)!.period_id,
      )!;
      return (
        row.record_date >= period.start_date &&
        row.record_date <= period.end_date
      );
    })
    .sort(
      (a, b) =>
        a.record_date.localeCompare(b.record_date) ||
        a.created_at.localeCompare(b.created_at) ||
        a.id.localeCompare(b.id),
    );
  const validRecords = records.filter(
    (row) => recapObject(row.record_data).progressExcluded !== true,
  );
  const declarations = source.declarations.filter(
    (row) => owns(row) && recapTypes.has(row.routine_type) && happened(row),
  );
  const midReviews = source.midReviews.filter(
    (row) =>
      owns(row) && recapChallengeIds.has(row.challenge_id) && happened(row),
  );
  const finalReviews = source.finalReviews.filter(
    (row) =>
      owns(row) && recapChallengeIds.has(row.challenge_id) && happened(row),
  );

  const monthTypes = new Map<number, Set<RoutineTypeDB>>();
  for (const registration of registrations) {
    const period = periods.get(
      challengeMap.get(registration.challenge_id)!.period_id,
    )!;
    if (!period.start_date.startsWith(String(RECAP_YEAR))) continue;
    const month = Number(period.start_date.slice(5, 7));
    const types = monthTypes.get(month) ?? new Set<RoutineTypeDB>();
    types.add(registration.routine_type);
    monthTypes.set(month, types);
  }
  const months = [...monthTypes.keys()].sort((a, b) => a - b);
  const selectedTypes = unique(
    [...monthTypes.values()].flatMap((types) => [...types]),
  );
  const routines = selectedTypes
    .map((type) => ({
      type,
      label: routineLabel(type),
      months: [...monthTypes.values()].filter((types) => types.has(type))
        .length,
    }))
    .sort(
      (a, b) => b.months - a.months || a.label.localeCompare(b.label, "ko"),
    );
  const favorites = routines
    .filter((routine) => routine.months === routines[0]?.months)
    .map((routine) => routine.type);
  const pairs = new Map<string, number>();
  for (const types of monthTypes.values()) {
    const sorted = [...types].sort();
    sorted.forEach((type, i) =>
      sorted.slice(i + 1).forEach((other) => {
        const key = `${type}|${other}`;
        pairs.set(key, (pairs.get(key) ?? 0) + 1);
      }),
    );
  }
  const combinations = [...pairs]
    .map(([key, count]) => ({
      types: key.split("|") as RoutineTypeDB[],
      months: count,
    }))
    .sort(
      (a, b) =>
        b.months - a.months || a.types.join().localeCompare(b.types.join()),
    );
  const maxRoutineCount = Math.max(
    0,
    ...[...monthTypes.values()].map((types) => types.size),
  );

  // Records are ordered by activity date, then creation time and ID. Keep the
  // first valid post for each daily certification to show in milestone toggles.
  const certificationMap = new Map<string, (typeof validRecords)[number]>();
  for (const record of validRecords) {
    const key = `${record.record_date}|${record.routine_type}`;
    if (!certificationMap.has(key)) certificationMap.set(key, record);
  }
  const certifications = [...certificationMap.keys()];
  const certificationRecords = [...certificationMap.values()];
  const dates = unique(records.map((record) => record.record_date)).sort();
  const weekdayCounts = new Map<number, number>();
  for (const certification of certifications) {
    const day = getDateKeyDayOfWeek(certification.split("|")[0]);
    weekdayCounts.set(day, (weekdayCounts.get(day) ?? 0) + 1);
  }
  const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];
  const weekdays = [1, 2, 3, 4, 5, 6, 0].map((day) => ({
    day,
    label: weekdayLabels[day],
    certifications: weekdayCounts.get(day) ?? 0,
  }));
  const startMonth = Number(RECAP_START_DATE.slice(5, 7));
  const monthly = Array.from({ length: 13 - startMonth }, (_, i) => {
    const month = startMonth + i;
    const prefix = `2026-${String(month).padStart(2, "0")}`;
    return {
      month,
      records: records.filter((row) => row.record_date.startsWith(prefix))
        .length,
      certifications: certifications.filter((key) => key.startsWith(prefix))
        .length,
      days: dates.filter((date) => date.startsWith(prefix)).length,
    };
  });
  const mostRecords = Math.max(0, ...monthly.map((month) => month.records));
  const quoteRecord = (
    record: (typeof records)[number] | undefined,
    fullText = false,
  ): RecapQuote | null => {
    if (!record) return null;
    const data = recapObject(record.record_data);
    return {
      date: record.record_date,
      label: routineLabel(record.routine_type),
      text: fullText
        ? recordText(record) || "이 기록에는 작성한 글이 없어요."
        : (
            recapRecordTexts(record.routine_type, data)[0] ||
            recapText(data.note) ||
            recapText(data.exerciseName) ||
            "이날의 실천을 기록으로 남겼어요."
          ).slice(0, 600),
    };
  };

  const achievement: AnnualRecap["achievement"] = {
    periods: [],
    bestIds: [],
    perfectCount: 0,
    allRoutineDays: 0,
    completeWeeks: 0,
  };
  const allDays = new Map<string, boolean>();
  const weeks = new Map<string, boolean>();
  for (const challenge of challenges) {
    const period = periods.get(challenge.period_id)!;
    // Each cohort belongs to its start month; records may extend into the next month.
    if (!period.start_date.startsWith(String(RECAP_YEAR))) continue;
    const registeredTypes = new Set(
      registrations
        .filter((row) => row.challenge_id === challenge.id)
        .map((row) => row.routine_type),
    );
    if (!registeredTypes.size) continue;
    const start = max(
      RECAP_START_DATE,
      period.start_date,
      challenge.reset_at?.slice(0, 10) ?? RECAP_START_DATE,
    );
    const end = min(period.end_date, YEAR_END);
    if (start > asOf || start > end) continue;
    const dateMap = new Map<string, Set<string>>();
    for (const record of validRecords.filter(
      (row) => row.challenge_id === challenge.id && row.record_date >= start,
    )) {
      const types = dateMap.get(record.record_date) ?? new Set<string>();
      types.add(record.routine_type);
      dateMap.set(record.record_date, types);
    }
    const completed = calculateWeeklyRoutineProgress({
      dateMap,
      registeredTypes,
      rangeStart: start,
      rangeEnd: min(end, asOf),
      today: asOf,
    }).completedDays;
    const target = countRoutineDaysInDateKeyRange(start, end) + 3;
    const achieved =
      completed +
      Number(
        isAllRoutinesCovered(
          registeredTypes,
          declarations.filter((row) => row.challenge_id === challenge.id),
        ),
      ) +
      Number(midReviews.some((row) => row.challenge_id === challenge.id)) +
      Number(finalReviews.some((row) => row.challenge_id === challenge.id));
    const rate = Math.min(100, Math.round((achieved / target) * 100));
    const ended = period.end_date <= asOf;
    achievement.periods.push({
      id: challenge.id,
      label:
        period.label || `${Number(period.start_date.slice(5, 7))}월 리추얼`,
      start: period.start_date,
      end: period.end_date,
      rate,
      ended,
    });
    if (ended && achieved >= target) achievement.perfectCount++;

    for (
      let day = start;
      day <= min(end, asOf);
      day = addDaysToDateKey(day, 1)
    ) {
      const complete = [...registeredTypes].every((type) =>
        dateMap.get(day)?.has(type),
      );
      allDays.set(day, (allDays.get(day) ?? true) && complete);
    }
    const weekday = getDateKeyDayOfWeek(start);
    for (
      let monday = addDaysToDateKey(start, weekday === 0 ? -6 : 1 - weekday);
      monday <= end;
      monday = addDaysToDateKey(monday, 7)
    ) {
      const weekStart = max(start, monday);
      const weekEnd = min(end, addDaysToDateKey(monday, 6));
      const weekTarget = countRoutineDaysInDateKeyRange(weekStart, weekEnd);
      if (weekTarget === 0) continue;
      const done = calculateWeeklyRoutineProgress({
        dateMap,
        registeredTypes,
        rangeStart: weekStart,
        rangeEnd: min(weekEnd, asOf),
        today: asOf,
      }).completedDays;
      weeks.set(
        monday,
        (weeks.get(monday) ?? true) && weekEnd <= asOf && done >= weekTarget,
      );
    }
  }
  achievement.periods.sort(
    (a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id),
  );
  const bestRate = Math.max(
    0,
    ...achievement.periods.map((period) => period.rate),
  );
  achievement.bestIds = achievement.periods
    .filter((period) => period.rate === bestRate)
    .map((period) => period.id);
  achievement.allRoutineDays = [...allDays.values()].filter(Boolean).length;
  achievement.completeWeeks = [...weeks.values()].filter(Boolean).length;

  const annualDeclarations = declarations
    .filter((row) => dateOf(row.created_at) >= RECAP_START_DATE)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const annualMid = midReviews.filter(
    (row) => dateOf(row.created_at) >= RECAP_START_DATE,
  );
  const annualFinal = finalReviews.filter(
    (row) => dateOf(row.created_at) >= RECAP_START_DATE,
  );
  const first = annualDeclarations[0];
  const reviews: RecapQuote[] = [
    ...annualMid.map((row) => ({
      date: dateOf(row.created_at),
      label: "중간회고",
      text: [row.why_started, row.keep_doing, row.will_change]
        .filter(Boolean)
        .join("\n\n"),
      createdAt: row.created_at,
    })),
    ...annualFinal.map((row) => ({
      date: dateOf(row.created_at),
      label: "최종회고",
      text: [row.results, row.life_changes, row.adjustment_note]
        .filter(Boolean)
        .join("\n\n"),
      createdAt: row.created_at,
    })),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(({ date, label, text }) => ({
      date,
      label,
      text: text.slice(0, 1800),
    }));
  const documents = [
    ...records.map((row) =>
      recapRecordTexts(row.routine_type, row.record_data).join(" "),
    ),
    ...annualDeclarations.map((row) => declarationTexts(row.answers).join(" ")),
    ...annualMid.map((row) =>
      [row.why_started, row.keep_doing, row.will_change]
        .filter(Boolean)
        .join(" "),
    ),
    ...annualFinal.map((row) =>
      [row.results, row.life_changes, row.adjustment_note]
        .filter(Boolean)
        .join(" "),
    ),
  ];
  const countsByType = rankRecapLabels(
    certifications.map((key) => key.split("|")[1]),
  );
  const representatives = countsByType
    .filter((row) => row.count === countsByType[0]?.count)
    .map((row) => row.label as RoutineTypeDB);
  const insightTypes = (
    Object.keys(ROUTINE_TYPE_LABEL) as RoutineTypeDB[]
  ).filter((type) => selectedTypes.includes(type));

  return {
    year: RECAP_YEAR,
    name: source.name,
    asOf,
    participation: {
      months,
      longestMonths: longestRun(months, (a, b) => b === a + 1),
      routines,
      favorites,
      combinations: combinations.filter(
        (pair) => pair.months === combinations[0]?.months,
      ),
      maxRoutineCount,
      maxRoutineMonths: months.filter(
        (month) => monthTypes.get(month)!.size === maxRoutineCount,
      ),
    },
    activity: {
      recordCount: records.length,
      certificationCount: certifications.length,
      days: dates.length,
      longestStreak: longestRun(dates, (a, b) => addDaysToDateKey(a, 1) === b),
      weekdays,
      monthly,
      busiestMonths:
        mostRecords > 0
          ? monthly
              .filter((month) => month.records === mostRecords)
              .map((month) => month.month)
          : [],
      firstRecord: quoteRecord(records[0]),
      lastRecord: quoteRecord(records.at(-1), true),
      milestones: RECAP_MILESTONE_COUNTS.filter(
        (count) => certificationRecords.length >= count,
      ).map((count) => {
        const record = certificationRecords[count - 1];
        return {
          count,
          date: record.record_date,
          recordId: record.id,
          routineType: record.routine_type,
          text: recordText(record),
        };
      }),
    },
    achievement,
    reflection: {
      firstDeclaration: first
        ? {
            date: dateOf(first.created_at),
            label: `${routineLabel(first.routine_type)} 첫 선언`,
            text: declarationTexts(first.answers).join("\n\n").slice(0, 1800),
          }
        : null,
      latestReview: reviews[0] ?? null,
      goodConditions: rankRecapLabels(
        annualMid.flatMap((row) => unique(row.good_conditions ?? [])),
      ).slice(0, 3),
      hardConditions: rankRecapLabels(
        annualMid.flatMap((row) => unique(row.hard_conditions ?? [])),
      ).slice(0, 3),
      keepCount: annualFinal.filter((row) => row.continuation_choice === "keep")
        .length,
      reviewCount: annualFinal.length,
      keywords: extractRecapKeywords(documents),
    },
    representatives: representatives.length ? representatives : favorites,
    representativeBasis: representatives.length
      ? "certifications"
      : "registrations",
    routines: insightTypes.map((type) =>
      buildRecapRoutineInsight(type, records, source.books, asOf),
    ),
  };
}
