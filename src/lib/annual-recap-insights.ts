import {
  ROUTINE_TYPE_LABEL,
  normalizeRecordingEntries,
} from "@/types/supabase";
import type {
  CleanupRecordData,
  RecordingRecordData,
  RoutineTypeDB,
} from "@/types/supabase";
import type {
  AnnualRecapSource,
  RecapCount,
  RecapRoutineInsight,
} from "@/types/annual-recap";
import { RECAP_START_DATE } from "@/types/annual-recap";
import {
  getCleanupAreaLabel,
  getCleanupMetricLabel,
  getCleanupMetricUnit,
  normalizeCleanupMetrics,
} from "@/components/Routines/Cleanup/constants";

export function recapObject(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function recapText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function recapNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : 0;
}

export function recapList(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map(recapObject) : [];
}

export function routineLabel(type: RoutineTypeDB): string {
  return ROUTINE_TYPE_LABEL[type].replace(/리추얼$/, "");
}

export function rankRecapLabels(labels: string[]): RecapCount[] {
  const counts = new Map<string, number>();
  for (const label of labels.filter(Boolean))
    counts.set(label, (counts.get(label) ?? 0) + 1);
  return [...counts]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ko"));
}

const number = (value: number) =>
  value.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
const unique = (values: string[]) => [...new Set(values.filter(Boolean))];

/** Only the member's own prose is used, never photos, links, quiz vocabulary or other authors' quotes. */
export function recapRecordTexts(type: RoutineTypeDB, raw: unknown): string[] {
  const data = recapObject(raw);
  if (type === "recording") {
    return normalizeRecordingEntries(data as RecordingRecordData).map(
      (entry) =>
        entry.type === "write"
          ? recapText(entry.content)
          : recapText(entry.readReason),
    );
  }
  const keys: Partial<Record<RoutineTypeDB, string[]>> = {
    morning: ["success", "reflection"],
    exercise: ["achievement"],
    reading: ["thoughts"],
    english_book: [],
    english: ["achievement"],
    second_language: ["achievement"],
    cleanup: ["note"],
    finance: ["studyContent", "practice"],
  };
  return (keys[type] ?? []).map((key) => recapText(data[key])).filter(Boolean);
}

export function buildRecapRoutineInsight(
  type: RoutineTypeDB,
  records: AnnualRecapSource["records"],
  books: AnnualRecapSource["books"],
  asOf: string,
): RecapRoutineInsight {
  const rows = records.filter((row) => row.routine_type === type);
  const data = rows.map((row) => recapObject(row.record_data));
  const result: RecapRoutineInsight = {
    type,
    label: routineLabel(type),
    recordDays: new Set(rows.map((row) => row.record_date)).size,
    metrics: [],
    highlights: [],
    note: "저장된 나의 기록을 기준으로 모았어요.",
  };
  const metric = (label: string, value: number, unit: string) =>
    result.metrics.push({ label, value: `${number(value)}${unit}` });
  if (!rows.length) {
    result.note = "올해 남긴 기록이 없어요.";
    return result;
  }
  switch (type) {
    case "morning": {
      const sleep = data.filter(
        (d) =>
          typeof d.sleepHours === "number" &&
          d.sleepHours >= 0 &&
          d.sleepHours <= 24,
      );
      if (sleep.length)
        metric(
          "평균 수면 시간",
          sleep.reduce((sum, d) => sum + recapNumber(d.sleepHours), 0) /
            sleep.length,
          "시간",
        );
      metric(
        "컨디션이 좋았던 날",
        new Set(
          rows
            .filter((row) => recapObject(row.record_data).condition === "상")
            .map((row) => row.record_date),
        ).size,
        "일",
      );
      metric(
        "남긴 작은 성공",
        data.filter((d) => recapText(d.success)).length,
        "개",
      );
      result.highlights = data
        .map((d) => recapText(d.success))
        .filter(Boolean)
        .slice(-3);
      result.note = "수면과 컨디션을 입력한 기록 기준이에요.";
      break;
    }
    case "exercise": {
      const exercise = data.filter((d) => d.recordType !== "diet");
      const minutes = exercise.reduce(
        (sum, d) => sum + recapNumber(d.duration),
        0,
      );
      metric("쌓인 운동 시간", minutes, "분");
      metric("운동 기록", exercise.length, "회");
      if (exercise.length)
        metric("1회 평균 운동", minutes / exercise.length, "분");
      if (data.length > exercise.length)
        metric("식단 기록", data.length - exercise.length, "회");
      result.highlights = rankRecapLabels(
        exercise.map((d) => recapText(d.exerciseName)),
      )
        .slice(0, 3)
        .map((item) => `${item.label} · ${item.count}회`);
      result.note =
        "직접 남긴 운동 시간이며, 식단 기록은 운동 시간에서 제외했어요.";
      break;
    }
    case "reading":
    case "english_book": {
      const bookMap = new Map(books.map((book) => [book.id, book]));
      const bookNames = unique(
        data.map(
          (d) =>
            bookMap.get(recapText(d.bookId))?.title ?? recapText(d.bookTitle),
        ),
      );
      const bookKeys = unique(
        data.map((d) => {
          const book = bookMap.get(recapText(d.bookId));
          const title = book?.title ?? recapText(d.bookTitle);
          return title
            ? `${title.trim()}|${book?.author ?? recapText(d.author)}`
            : recapText(d.bookId);
        }),
      );
      metric("기록에 담긴 책", bookKeys.length, "권");
      const pages = data.filter(
        (d) =>
          d.trackingType === "page" ||
          (d.trackingType == null && typeof d.pagesRead === "number"),
      );
      if (pages.length)
        metric(
          "기록한 독서량",
          pages.reduce(
            (sum, d) => sum + recapNumber(d.progressAmount ?? d.pagesRead),
            0,
          ),
          "쪽",
        );
      metric(
        "남긴 문장과 요약",
        data.filter((d) => recapText(d.note)).length,
        "개",
      );
      if (type === "reading")
        metric(
          "나만의 생각",
          data.filter((d) => recapText(d.thoughts)).length,
          "개",
        );
      result.highlights = bookNames.slice(0, 8);
      result.note =
        "기록에 등장하는 책을 모았어요. 퍼센트로 기록한 분량은 페이지 합계에 포함하지 않아요.";
      break;
    }
    case "english":
    case "second_language": {
      const study = data.filter((d) => d.recordType !== "review_test");
      const expressions = study
        .flatMap((d) => recapList(d.expressions))
        .filter((e) => recapText(e.word));
      metric("쌓인 표현", expressions.length, "개");
      metric(
        "서로 다른 표현",
        unique(
          expressions.map((e) =>
            recapText(e.word)
              .normalize("NFKC")
              .toLocaleLowerCase()
              .replace(/\s+/g, " "),
          ),
        ).length,
        "개",
      );
      metric(
        "복습 인증",
        data.filter((d) => d.recordType === "review_test").length,
        "회",
      );
      result.highlights = unique(
        expressions.map((e) =>
          [recapText(e.word), recapText(e.meaning)].filter(Boolean).join(" — "),
        ),
      ).slice(-3);
      result.note =
        "직접 저장한 표현 기준이에요. 복습 기록은 새로 배운 표현 수에서 제외했어요.";
      break;
    }
    case "recording": {
      const entries = data.flatMap((d) =>
        normalizeRecordingEntries(d as RecordingRecordData),
      );
      const written = entries.filter((e) => e.type === "write");
      metric("쓴 글", written.length, "편");
      metric(
        "글을 읽고 남긴 감상",
        entries.filter((e) => e.type === "read").length,
        "개",
      );
      metric(
        "직접 쓴 글자",
        written.reduce(
          (sum, e) => sum + [...recapText(e.content).replace(/\s/g, "")].length,
          0,
        ),
        "자",
      );
      const timed = written.filter(
        (e) => typeof e.duration === "number" && e.duration > 0,
      );
      if (timed.length)
        metric(
          "기록한 글쓰기 시간",
          timed.reduce((sum, e) => sum + recapNumber(e.duration), 0),
          "분",
        );
      result.highlights = written
        .map((e) => recapText(e.title) || recapText(e.content))
        .filter(Boolean)
        .slice(-3);
      result.note =
        "글자 수는 공백을 제외했어요. 글쓰기 시간은 시간을 입력한 글만 합산해요.";
      break;
    }
    case "cleanup": {
      const cleanup = data as unknown as CleanupRecordData[];
      const areas = cleanup.map((d) =>
        getCleanupAreaLabel(d.area, d.customArea),
      );
      metric("돌본 공간과 영역", unique(areas).length, "곳");
      result.highlights = rankRecapLabels(areas)
        .slice(0, 3)
        .map((item) => `${item.label} · ${item.count}회`);
      const totals = new Map<
        string,
        { label: string; unit: string; value: number }
      >();
      for (const d of cleanup)
        for (const item of normalizeCleanupMetrics(d)) {
          const unit = getCleanupMetricUnit(item);
          // Percentages and free-form units are not additive quantities.
          if (
            ![
              "개",
              "권",
              "벌",
              "장",
              "GB",
              "MB",
              "칸",
              "켤레",
              "박스",
            ].includes(unit)
          )
            continue;
          const label = getCleanupMetricLabel(item, d.area, d.customArea);
          const key = `${label}|${unit}`;
          const previous = totals.get(key);
          totals.set(key, {
            label,
            unit,
            value: (previous?.value ?? 0) + recapNumber(item.value),
          });
        }
      [...totals.values()]
        .sort((a, b) => b.value - a.value)
        .slice(0, 3)
        .forEach((item) => metric(item.label, item.value, item.unit));
      result.note =
        "같은 항목·같은 단위의 정돈량만 합산했어요. 진행 퍼센트는 더하지 않아요.";
      break;
    }
    case "finance": {
      const expenses = new Map<string, Record<string, unknown>>();
      const dates = new Set<string>();
      for (const d of data)
        for (const day of recapList(d.dailyExpenses)) {
          const date = recapText(day.date);
          if (date < RECAP_START_DATE || date > asOf) continue;
          dates.add(date);
          for (const expense of recapList(day.expenses)) {
            const key = `${date}|${recapText(expense.id) || JSON.stringify([expense.name, expense.amount, expense.type])}`;
            expenses.set(key, expense);
          }
        }
      const total = [...expenses.values()].reduce(
        (sum, e) => sum + recapNumber(e.amount),
        0,
      );
      metric("소비를 기록한 날", dates.size, "일");
      metric("기록된 소비", total, "원");
      for (const [key, label] of [
        ["necessary", "필요소비"],
        ["emotional", "감정소비"],
        ["value", "가치소비"],
      ]) {
        const amount = [...expenses.values()]
          .filter((e) => e.type === key)
          .reduce((sum, e) => sum + recapNumber(e.amount), 0);
        if (total > 0)
          result.highlights.push(
            `${label} ${number(amount)}원 · ${Math.round((amount / total) * 100)}%`,
          );
      }
      metric(
        "공부 기록",
        data.filter((d) => recapText(d.studyContent)).length,
        "개",
      );
      metric(
        "실천과 다짐",
        data.filter((d) => recapText(d.practice)).length,
        "개",
      );
      result.note =
        "앱에 입력한 소비만 합산했어요. 같은 소비 항목이 여러 기록에 있어도 한 번만 세어요.";
      break;
    }
  }
  return result;
}
