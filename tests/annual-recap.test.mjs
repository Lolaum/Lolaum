import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import test from "node:test";
import ts from "typescript";

function loadTS(file, mocks = {}, cache = new Map()) {
  const filename = resolve(file);
  if (cache.has(filename)) return cache.get(filename);
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const loadedModule = { exports: {} };
  const require = (name) => {
    if (name in mocks) return mocks[name];
    const target = name.startsWith("@/")
      ? resolve("src", name.slice(2))
      : resolve(dirname(filename), name);
    return loadTS(`${target}.ts`, mocks, cache);
  };
  new Function("require", "module", "exports", outputText)(
    require,
    loadedModule,
    loadedModule.exports,
  );
  cache.set(filename, loadedModule.exports);
  return loadedModule.exports;
}

const { buildAnnualRecap, extractRecapKeywords } = loadTS(
  "src/lib/annual-recap.ts",
);
const { buildRecapRoutineInsight } = loadTS("src/lib/annual-recap-insights.ts");
const period = (
  id,
  start,
  end,
  label = `${Number(start.slice(5, 7))}월 리추얼`,
) => ({ id, start_date: start, end_date: end, label });
const challenge = (id, periodId = id, extra = {}) => ({
  id,
  user_id: "me",
  period_id: periodId,
  reset_at: null,
  ...extra,
});
const registration = (id, type = "reading", extra = {}) => ({
  id: `reg-${id}-${type}`,
  user_id: "me",
  challenge_id: id,
  routine_type: type,
  registered_at: "2026-05-01T00:00:00Z",
  ...extra,
});
const record = (
  id,
  date = "2026-05-04",
  type = "reading",
  data = {},
  extra = {},
) => ({
  id,
  user_id: "me",
  challenge_id: "may",
  routine_type: type,
  record_date: date,
  record_data: data,
  created_at: `${date}T00:00:00Z`,
  ...extra,
});
const declaration = (type = "reading", extra = {}) => ({
  id: `declaration-${type}`,
  user_id: "me",
  challenge_id: "may",
  routine_type: type,
  answers: [
    { questionId: "expected_change", answer: "독서를 꾸준히 해보고 싶어요." },
  ],
  created_at: "2026-05-01T00:00:00Z",
  ...extra,
});
const mid = (extra = {}) => ({
  id: "mid",
  user_id: "me",
  challenge_id: "may",
  good_conditions: [],
  hard_conditions: [],
  good_condition_details: {},
  hard_condition_details: {},
  why_started: "나를 위해",
  keep_doing: "",
  will_change: "",
  created_at: "2026-05-05T00:00:00Z",
  ...extra,
});
const final = (extra = {}) => ({
  id: "final",
  user_id: "me",
  challenge_id: "may",
  results: "독서를 계속하고 싶어요.",
  life_changes: "",
  continuation_choice: "keep",
  adjustment_note: "",
  feedback: "",
  created_at: "2026-05-08T00:00:00Z",
  ...extra,
});
const source = (extra = {}) => ({
  userId: "me",
  name: "테스트",
  asOf: "2026-11-18",
  periods: [period("may", "2026-05-01", "2026-05-31")],
  challenges: [challenge("may")],
  registrations: [registration("may")],
  records: [],
  declarations: [],
  midReviews: [],
  finalReviews: [],
  books: [],
  ...extra,
});

test("participation counts distinct official cohort months, not registrations, duplicate periods, or spillover record months", () => {
  const data = buildAnnualRecap(
    source({
      periods: [
        period("may", "2026-05-11", "2026-05-31"),
        period("may2", "2026-05-11", "2026-05-31"),
        period("june", "2026-06-08", "2026-06-28"),
        period("july", "2026-07-13", "2026-08-02"),
        period("test", "2026-08-04", "2026-08-08", "8월 테스트"),
        period("future", "2026-12-01", "2026-12-31"),
      ],
      challenges: ["may", "may2", "june", "july", "test", "future"].map((id) =>
        challenge(id),
      ),
      registrations: [
        registration("may"),
        registration("may2"),
        registration("may", "exercise"),
        registration("june"),
        registration("july"),
        registration("test"),
        registration("future"),
      ],
      records: [
        record("summer", "2026-08-01", "reading", {}, { challenge_id: "july" }),
        record("test", "2026-08-05", "reading", {}, { challenge_id: "test" }),
      ],
    }),
  );
  assert.deepEqual(data.participation.months, [5, 6, 7]);
  assert.equal(data.participation.longestMonths, 3);
  assert.equal(
    data.participation.routines.find((row) => row.type === "reading").months,
    3,
  );
  assert.equal(data.participation.maxRoutineCount, 2);
  assert.deepEqual(data.participation.combinations, [
    { types: ["exercise", "reading"], months: 1 },
  ]);
  assert.equal(data.activity.recordCount, 1);
  assert.equal(data.activity.monthly.find((row) => row.month === 8).records, 1);
});

test("recap begins in May, retains advance signups and uses the Korean date boundary for reflections", () => {
  const input = source({
    registrations: [
      registration("may", "reading", { registered_at: "2026-04-30T00:00:00Z" }),
    ],
    records: [record("may-post", "2026-05-01")],
    declarations: [
      declaration("reading", { created_at: "2026-04-30T15:00:00Z" }),
    ],
  });
  const data = buildAnnualRecap({
    ...input,
    periods: [
      period("april", "2026-04-27", "2026-05-09", "준비 기수"),
      ...input.periods,
    ],
    challenges: [challenge("april"), ...input.challenges],
    registrations: [registration("april", "exercise"), ...input.registrations],
    records: [
      record(
        "april-post",
        "2026-04-30",
        "exercise",
        {},
        { challenge_id: "april" },
      ),
      record(
        "april-spillover",
        "2026-05-02",
        "exercise",
        {},
        { challenge_id: "april" },
      ),
      ...input.records,
    ],
    declarations: [
      declaration("reading", {
        id: "before-start",
        created_at: "2026-04-30T14:59:59Z",
      }),
      ...input.declarations,
    ],
    midReviews: [mid({ created_at: "2026-04-30T14:59:59Z" })],
    finalReviews: [final({ created_at: "2026-04-30T14:59:59Z" })],
  });
  assert.deepEqual(data, buildAnnualRecap(input));
  assert.deepEqual(
    data.activity.monthly.map((row) => row.month),
    [5, 6, 7, 8, 9, 10, 11, 12],
  );
  assert.deepEqual(data.participation.months, [5]);
  assert.equal(data.reflection.firstDeclaration.date, "2026-05-01");
});

test("record rows, distinct valid certifications, recorded days, and streaks have separate semantics", () => {
  const data = buildAnnualRecap(
    source({
      registrations: [registration("may"), registration("may", "exercise")],
      records: [
        record("a"),
        record("b"),
        record("c", "2026-05-04", "exercise"),
        record("d", "2026-05-05"),
        record("excluded", "2026-05-06", "reading", { progressExcluded: true }),
        record("gap", "2026-05-08"),
        record("future", "2026-12-01"),
        record("foreign", "2026-05-04", "reading", {}, { user_id: "other" }),
      ],
    }),
  );
  assert.equal(data.activity.recordCount, 6);
  assert.equal(data.activity.certificationCount, 4);
  assert.equal(data.activity.days, 4);
  assert.equal(data.activity.longestStreak, 3);
  assert.equal(data.activity.firstRecord.date, "2026-05-04");
  assert.equal(data.activity.lastRecord.date, "2026-05-08");
});

test("weekday summary counts distinct certifications by activity date, with excluded rows removed", () => {
  const data = buildAnnualRecap(
    source({
      registrations: [registration("may"), registration("may", "exercise")],
      records: [
        record("monday"),
        record("duplicate-monday"),
        record(
          "monday-exercise",
          "2026-05-04",
          "exercise",
          {},
          { created_at: "2026-05-05T01:00:00Z" },
        ),
        record("excluded", "2026-05-05", "reading", { progressExcluded: true }),
        record("sunday", "2026-05-10"),
        record(
          "another-member",
          "2026-05-06",
          "reading",
          {},
          { user_id: "other" },
        ),
      ],
    }),
  );
  assert.deepEqual(
    data.activity.weekdays.map((day) => day.label),
    ["월", "화", "수", "목", "금", "토", "일"],
  );
  assert.deepEqual(
    data.activity.weekdays.map((day) => day.certifications),
    [2, 0, 0, 0, 0, 0, 1],
  );
  assert.equal(
    data.activity.weekdays.reduce((sum, day) => sum + day.certifications, 0),
    data.activity.certificationCount,
  );
});

test("weekday summary preserves tied weekdays and has zero totals for members with no certifications", () => {
  const empty = buildAnnualRecap(source());
  assert.equal(empty.activity.weekdays.length, 7);
  assert.ok(empty.activity.weekdays.every((day) => day.certifications === 0));
  const tied = buildAnnualRecap(
    source({ records: [record("monday"), record("tuesday", "2026-05-05")] }),
  );
  assert.deepEqual(
    tied.activity.weekdays
      .filter((day) => day.certifications === 1)
      .map((day) => day.label),
    ["월", "화"],
  );
});

test("all tied favorites and busiest months remain visible", () => {
  const data = buildAnnualRecap(
    source({
      periods: [
        period("may", "2026-05-01", "2026-05-31"),
        period("june", "2026-06-01", "2026-06-30"),
      ],
      challenges: [challenge("may"), challenge("june")],
      registrations: [registration("may"), registration("may", "exercise")],
      records: [
        record("a"),
        record("b", "2026-06-02", "reading", {}, { challenge_id: "june" }),
      ],
    }),
  );
  assert.deepEqual([...data.participation.favorites].sort(), [
    "exercise",
    "reading",
  ]);
  assert.deepEqual(data.activity.busiestMonths, [5, 6]);
});

test("certification milestones collapse same-day routine duplicates", () => {
  const records = Array.from({ length: 12 }, (_, i) =>
    record(String(i), `2026-05-${String(i + 1).padStart(2, "0")}`),
  );
  const data = buildAnnualRecap(
    source({ records: [...records, record("duplicate", "2026-05-01")] }),
  );
  assert.deepEqual(data.activity.milestones, [
    {
      count: 10,
      date: "2026-05-10",
      recordId: "9",
      routineType: "reading",
      text: "",
    },
  ]);
});

test("all eight certification milestones identify the correct post, only after their threshold is reached", () => {
  const records = Array.from({ length: 300 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 4, Math.floor(index / 2) + 1))
      .toISOString()
      .slice(0, 10);
    return record(
      `post-${index + 1}`,
      date,
      index % 2 === 0 ? "reading" : "exercise",
      {},
      {
        created_at: `${date}T0${index % 2}:00:00Z`,
      },
    );
  });
  const input = source({
    periods: [period("may", "2026-05-01", "2026-12-31")],
    registrations: [registration("may"), registration("may", "exercise")],
    records: [...records].reverse(),
  });
  const data = buildAnnualRecap(input);
  const thresholds = [10, 30, 50, 100, 150, 200, 250, 300];
  assert.deepEqual(
    data.activity.milestones,
    thresholds.map((count) => ({
      count,
      date: records[count - 1].record_date,
      recordId: `post-${count}`,
      routineType: records[count - 1].routine_type,
      text: "",
    })),
  );
  for (const threshold of thresholds) {
    const before = buildAnnualRecap({
      ...input,
      records: records.slice(0, threshold - 1),
    });
    assert.deepEqual(
      before.activity.milestones.map((item) => item.count),
      thresholds.filter((count) => count < threshold),
    );
    const reached = buildAnnualRecap({
      ...input,
      records: records.slice(0, threshold),
    });
    assert.equal(
      reached.activity.milestones.at(-1).recordId,
      `post-${threshold}`,
    );
  }
});

test("milestone post selection uses creation order within a day and ignores duplicates, excluded posts and other members", () => {
  const earlier = Array.from({ length: 9 }, (_, index) =>
    record(`earlier-${index}`, `2026-05-${String(index + 1).padStart(2, "0")}`),
  );
  const records = [
    ...earlier,
    record(
      "duplicate-later",
      "2026-05-10",
      "reading",
      {},
      { created_at: "2026-05-10T10:00:00Z" },
    ),
    record(
      "exercise",
      "2026-05-10",
      "exercise",
      {},
      { created_at: "2026-05-10T09:00:00Z" },
    ),
    record(
      "target",
      "2026-05-10",
      "reading",
      {},
      { created_at: "2026-05-10T08:00:00Z" },
    ),
    record(
      "foreign",
      "2026-05-09",
      "exercise",
      {},
      { user_id: "someone-else" },
    ),
    record("excluded", "2026-05-09", "exercise", { progressExcluded: true }),
  ];
  for (const ordered of [records, [...records].reverse()]) {
    const data = buildAnnualRecap(
      source({
        registrations: [registration("may"), registration("may", "exercise")],
        records: ordered,
      }),
    );
    assert.equal(data.activity.certificationCount, 11);
    assert.deepEqual(data.activity.milestones, [
      {
        count: 10,
        date: "2026-05-10",
        recordId: "target",
        routineType: "reading",
        text: "",
      },
    ]);
  }
});

test("milestone toggles retain complete authored text across all ritual types", () => {
  const longText = "오늘의 생각을 길게 남겼어요.\n".repeat(100).trim();
  const cases = [
    [
      "reading",
      { thoughts: longText, note: "기억할 문장", notes: "기억할 문장" },
      `${longText}\n\n기억할 문장`,
    ],
    [
      "morning",
      { success: "오늘의 성공", reflection: "내일의 다짐" },
      "오늘의 성공\n\n내일의 다짐",
    ],
    ["exercise", { achievement: "러닝을 마쳤어요." }, "러닝을 마쳤어요."],
    [
      "recording",
      {
        entries: [
          { type: "write", title: "일기", content: "직접 쓴 일기" },
          { type: "read", readReason: "읽고 나서 든 생각" },
        ],
      },
      "직접 쓴 일기\n\n읽고 나서 든 생각",
    ],
    [
      "english",
      {
        achievement: "오늘의 공부",
        expressions: [
          { word: "keep going", meaning: "계속해", example: "I keep going." },
        ],
      },
      "오늘의 공부\n\nkeep going\n계속해\nI keep going.",
    ],
    [
      "second_language",
      { expressions: [{ word: "bonjour", meaning: "안녕하세요" }] },
      "bonjour\n안녕하세요",
    ],
    ["cleanup", { note: "책상을 정리했어요." }, "책상을 정리했어요."],
    [
      "finance",
      { studyContent: "배운 내용", practice: "실천한 내용" },
      "배운 내용\n\n실천한 내용",
    ],
  ];
  for (const [type, body, expected] of cases) {
    const records = Array.from({ length: 9 }, (_, index) =>
      record(
        `earlier-${index}`,
        `2026-05-${String(index + 1).padStart(2, "0")}`,
      ),
    );
    records.push(record("milestone-post", "2026-05-10", type, body));
    const milestone = buildAnnualRecap(
      source({
        registrations: [registration("may"), registration("may", type)],
        records,
      }),
    ).activity.milestones[0];
    assert.equal(milestone.text, expected, type);
    assert.equal(milestone.recordId, "milestone-post");
  }
});

test("last record remains distinct from the latest milestone and keeps the complete post", () => {
  const fullText = "마지막 날 남긴 생각\n".repeat(100).trim();
  const records = Array.from({ length: 31 }, (_, index) =>
    record(
      `post-${index + 1}`,
      `2026-05-${String(index + 1).padStart(2, "0")}`,
      "reading",
      index === 30
        ? { thoughts: fullText, note: "마지막 문장" }
        : { thoughts: "이전 기록" },
    ),
  );
  const data = buildAnnualRecap(source({ records }));
  assert.equal(data.activity.milestones.at(-1).count, 30);
  assert.equal(data.activity.milestones.at(-1).date, "2026-05-30");
  assert.equal(data.activity.lastRecord.date, "2026-05-31");
  assert.equal(data.activity.lastRecord.text, `${fullText}\n\n마지막 문장`);
  assert.equal(buildAnnualRecap(source()).activity.lastRecord, null);
});

test("completion uses weekly pooling and review bonuses, while all-routine days require same-day certification", () => {
  const data = buildAnnualRecap(
    source({
      periods: [period("may", "2026-05-04", "2026-05-05")],
      registrations: [registration("may"), registration("may", "exercise")],
      records: [
        record("r1"),
        record("r2", "2026-05-05"),
        record("e1", "2026-05-05", "exercise"),
      ],
      declarations: [declaration(), declaration("exercise")],
      midReviews: [mid()],
      finalReviews: [final()],
    }),
  );
  assert.equal(data.achievement.periods[0].rate, 80); // 1 pooled day + 3 bonuses / 2 days + 3 bonuses
  assert.equal(data.achievement.allRoutineDays, 1);
  assert.equal(data.achievement.completeWeeks, 0);
  assert.equal(data.achievement.perfectCount, 0);
});

test("full cohorts count once and perfect milestones require completed periods", () => {
  const input = source({
    periods: [period("may", "2026-05-04", "2026-05-10")],
    records: ["04", "05", "06", "07", "08"].map((day) =>
      record(day, `2026-05-${day}`),
    ),
    declarations: [declaration()],
    midReviews: [mid()],
    finalReviews: [final()],
  });
  const ended = buildAnnualRecap(input);
  assert.equal(ended.achievement.perfectCount, 1);
  assert.equal(ended.achievement.completeWeeks, 1);
  const ongoing = buildAnnualRecap({ ...input, asOf: "2026-05-08" });
  assert.equal(ongoing.achievement.periods[0].rate, 100);
  assert.equal(ongoing.achievement.perfectCount, 0);
  assert.equal(ongoing.achievement.completeWeeks, 0);
});

test("resets retain history but restrict completion, including excluded records and Chuseok makeup", () => {
  const data = buildAnnualRecap(
    source({
      periods: [period("may", "2026-09-21", "2026-09-27")],
      challenges: [challenge("may", "may", { reset_at: "2026-09-22" })],
      records: [
        record("before", "2026-09-21"),
        record("excluded", "2026-09-22", "reading", { progressExcluded: true }),
        record("makeup1", "2026-09-24"),
        record("makeup2", "2026-09-25"),
      ],
    }),
  );
  assert.equal(data.activity.recordCount, 4);
  assert.equal(data.activity.certificationCount, 3);
  assert.equal(data.achievement.periods[0].rate, 40); // 2 days / (2 target weekdays + 3)
  assert.equal(data.achievement.allRoutineDays, 2);
  assert.equal(data.achievement.completeWeeks, 1);
});

test("review quotes use Korea dates, exclude shared policy answers, choose latest mid or final, and omit future/foreign reviews", () => {
  const data = buildAnnualRecap(
    source({
      declarations: [
        declaration("reading", {
          answers: [
            { questionId: "cert_method", answer: "shared boilerplate" },
            { questionId: "expected_change", answer: "나만의 다짐" },
          ],
        }),
      ],
      midReviews: [
        mid({
          created_at: "2026-05-10T15:30:00Z",
          good_conditions: ["충분한 수면", "충분한 수면"],
          hard_conditions: ["야근"],
        }),
        mid({ id: "other", user_id: "other" }),
      ],
      finalReviews: [
        final(),
        final({ id: "future", created_at: "2026-12-01T00:00:00Z" }),
      ],
    }),
  );
  assert.equal(data.reflection.firstDeclaration.text, "나만의 다짐");
  assert.equal(data.reflection.latestReview.label, "중간회고");
  assert.equal(data.reflection.latestReview.date, "2026-05-11");
  assert.deepEqual(data.reflection.goodConditions, [
    { label: "충분한 수면", count: 1 },
  ]);
  assert.equal(data.reflection.keepCount, 1);
});

test("keywords count separate authored documents and filter filler and URLs", () => {
  assert.deepEqual(
    extractRecapKeywords([
      "독서를 독서를 오늘 했어요 https://example.com",
      "독서가 즐거워요",
    ]),
    [{ label: "독서", count: 2 }],
  );
  assert.deepEqual(extractRecapKeywords(["한번뿐인단어 한번뿐인단어"]), []);
});

test("category totals preserve units, exclude diets/reviews, and support legacy reading and recording", () => {
  const insight = (type, values, books = []) =>
    buildRecapRoutineInsight(
      type,
      values.map((data, i) => record(`${type}-${i}`, "2026-05-04", type, data)),
      books,
      "2026-11-18",
    );
  const metrics = (data) =>
    Object.fromEntries(data.metrics.map((item) => [item.label, item.value]));
  assert.equal(
    metrics(
      insight("exercise", [
        { duration: 30, exerciseName: "걷기" },
        { duration: 999, recordType: "diet" },
      ]),
    )["쌓인 운동 시간"],
    "30분",
  );
  const reading = insight(
    "reading",
    [
      { trackingType: "page", progressAmount: 20, bookId: "a" },
      { trackingType: "percent", progressAmount: 50, bookId: "a" },
      { pagesRead: 10, bookTitle: "책", author: "작가" },
    ],
    [{ id: "a", title: "책", author: "작가" }],
  );
  assert.equal(metrics(reading)["기록한 독서량"], "30쪽");
  assert.equal(metrics(reading)["기록에 담긴 책"], "1권");
  const english = insight("english", [
    {
      expressions: [
        { word: "Hello", meaning: "안녕" },
        { word: "hello", meaning: "안녕" },
      ],
    },
    { recordType: "review_test", expressions: [{ word: "reviewed" }] },
  ]);
  assert.equal(metrics(english)["쌓인 표현"], "2개");
  assert.equal(metrics(english)["서로 다른 표현"], "1개");
  const writing = insight("recording", [
    { recordType: "write", content: "가 나", duration: 15 },
    {
      entries: [
        { type: "read", readReason: "좋아요" },
        { type: "write", content: "다 라", duration: 20 },
      ],
    },
  ]);
  assert.equal(metrics(writing)["쓴 글"], "2편");
  assert.equal(metrics(writing)["직접 쓴 글자"], "4자");
  assert.equal(metrics(writing)["기록한 글쓰기 시간"], "35분");
});

test("cleanup does not double count legacy metric or sum percentages", () => {
  const data = buildRecapRoutineInsight(
    "cleanup",
    [
      record("cleanup", "2026-05-04", "cleanup", {
        area: "photo_album",
        metric: { label: "사진", value: 10, unit: "장" },
        metrics: [
          { label: "사진", value: 10, unit: "장" },
          { label: "진행", value: 30, unit: "%" },
        ],
      }),
    ],
    [],
    "2026-11-18",
  );
  assert.ok(data.metrics.some((item) => item.value === "10장"));
  assert.ok(!data.metrics.some((item) => item.value.includes("%")));
});

test("finance deduplicates repeated expense IDs and includes expenses from May onward", () => {
  const expense = {
    id: "expense",
    amount: 5000,
    type: "necessary",
    name: "식사",
  };
  const data = buildRecapRoutineInsight(
    "finance",
    [
      record("a", "2026-05-04", "finance", {
        dailyExpenses: [
          { date: "2026-05-04", expenses: [expense] },
          { date: "2025-12-31", expenses: [{ ...expense, id: "old" }] },
          { date: "2026-04-30", expenses: [{ ...expense, id: "april" }] },
        ],
      }),
      record("b", "2026-05-05", "finance", {
        dailyExpenses: [
          { date: "2026-05-04", expenses: [expense] },
          { date: "2026-12-01", expenses: [expense] },
        ],
      }),
    ],
    [],
    "2026-11-18",
  );
  assert.equal(
    data.metrics.find((item) => item.label === "기록된 소비").value,
    "5,000원",
  );
});

test("only personally registered rituals appear, including registrations with no records", () => {
  const data = buildAnnualRecap(
    source({
      registrations: [
        registration("may"),
        registration("may", "second_language"),
        registration("may", "finance"),
        registration("may", "exercise", { user_id: "other" }),
        registration("may", "english", {
          registered_at: "2026-12-01T00:00:00Z",
        }),
      ],
      records: [
        record("reading-post"),
        record("unregistered-post", "2026-05-05", "exercise"),
      ],
    }),
  );
  assert.deepEqual(
    data.routines.map((routine) => routine.type),
    ["reading", "second_language", "finance"],
  );
  assert.deepEqual(
    data.participation.routines.map((routine) => routine.type).sort(),
    ["finance", "reading", "second_language"],
  );
  assert.equal(data.activity.recordCount, 1);
  assert.equal(data.activity.certificationCount, 1);
  for (const type of ["second_language", "finance"]) {
    const routine = data.routines.find((item) => item.type === type);
    assert.equal(routine.recordDays, 0);
    assert.deepEqual(routine.metrics, []);
    assert.deepEqual(routine.highlights, []);
    assert.equal(routine.note, "올해 남긴 기록이 없어요.");
  }
});

test("English-book registrations and activity are excluded throughout the recap", () => {
  const input = source({
    records: Array.from({ length: 9 }, (_, index) =>
      record(`reading-${index}`, `2026-05-0${index + 1}`),
    ),
    declarations: [declaration()],
  });
  const data = buildAnnualRecap({
    ...input,
    periods: [...input.periods, period("june", "2026-06-01", "2026-06-30")],
    challenges: [...input.challenges, challenge("june")],
    registrations: [
      ...input.registrations,
      registration("may", "english_book"),
      registration("june", "english_book"),
    ],
    records: [
      ...input.records,
      record("excluded-first", "2026-05-01", "english_book", {
        note: "원서읽기 기록",
      }),
      record(
        "excluded-last",
        "2026-06-01",
        "english_book",
        { note: "원서읽기 기록" },
        { challenge_id: "june" },
      ),
    ],
    declarations: [
      ...input.declarations,
      declaration("english_book", { created_at: "2026-04-30T00:00:00Z" }),
    ],
    midReviews: [mid({ challenge_id: "june" })],
    finalReviews: [final({ challenge_id: "june" })],
  });
  assert.deepEqual(data, buildAnnualRecap(input));
  assert.deepEqual(data.activity.milestones, []);
});

test("members with only excluded or unregistered rituals have an empty recap", () => {
  const data = buildAnnualRecap(
    source({
      registrations: [registration("may", "english_book")],
      records: [
        record("english-book-post", "2026-05-04", "english_book"),
        record("unregistered-post", "2026-05-05", "finance"),
      ],
      declarations: [declaration("english_book"), declaration("finance")],
      midReviews: [mid()],
      finalReviews: [final()],
    }),
  );
  assert.deepEqual(data, buildAnnualRecap(source({ registrations: [] })));
});

test("second-language and finance history is retained when the latest cohort only contains reading", () => {
  const data = buildAnnualRecap(
    source({
      periods: [
        period("may", "2026-05-01", "2026-05-31"),
        period("november", "2026-11-01", "2026-11-30"),
      ],
      challenges: [challenge("may"), challenge("november")],
      registrations: [
        registration("may", "second_language"),
        registration("may", "finance"),
        registration("november", "reading", {
          registered_at: "2026-11-01T00:00:00Z",
        }),
      ],
      records: [
        record("language-post", "2026-05-04", "second_language", {
          expressions: [{ word: "bonjour", meaning: "안녕하세요" }],
        }),
        record("finance-post", "2026-05-05", "finance", {
          dailyExpenses: [
            {
              date: "2026-05-05",
              expenses: [
                { id: "expense-1", name: "책", amount: 12000, type: "value" },
              ],
            },
          ],
          studyContent: "소비 돌아보기",
        }),
        record(
          "reading-post",
          "2026-11-04",
          "reading",
          {},
          { challenge_id: "november" },
        ),
      ],
    }),
  );
  assert.deepEqual(data.participation.months, [5, 11]);
  assert.deepEqual(
    data.routines.map((routine) => routine.type),
    ["reading", "second_language", "finance"],
  );
  const language = data.routines.find(
    (routine) => routine.type === "second_language",
  );
  assert.equal(language.label, "제2외국어");
  assert.equal(language.recordDays, 1);
  assert.equal(
    language.metrics.find((metric) => metric.label === "쌓인 표현").value,
    "1개",
  );
  const finance = data.routines.find((routine) => routine.type === "finance");
  assert.equal(finance.label, "자산관리");
  assert.equal(finance.recordDays, 1);
  assert.equal(
    finance.metrics.find((metric) => metric.label === "기록된 소비").value,
    "12,000원",
  );
});

test("empty and registration-only users have honest zeroes and no fabricated keywords, milestones or perfect periods", () => {
  const empty = buildAnnualRecap(source({ registrations: [] }));
  assert.deepEqual(empty.participation.months, []);
  assert.equal(empty.activity.firstRecord, null);
  assert.equal(empty.achievement.perfectCount, 0);
  assert.deepEqual(empty.reflection.keywords, []);
  const registered = buildAnnualRecap(source());
  assert.equal(registered.routines[0].recordDays, 0);
  assert.deepEqual(registered.routines[0].metrics, []);
});

function database(tables, failureTable) {
  const calls = [];
  return {
    calls,
    from(table) {
      let rows = [...(tables[table] ?? [])];
      const filters = [];
      return {
        select() {
          return this;
        },
        eq(key, value) {
          filters.push([key, value]);
          rows = rows.filter((row) => row[key] === value);
          return this;
        },
        in(key, values) {
          rows = rows.filter((row) => values.includes(row[key]));
          return this;
        },
        lte(key, value) {
          rows = rows.filter((row) => row[key] <= value);
          return this;
        },
        gte(key, value) {
          rows = rows.filter((row) => row[key] >= value);
          return this;
        },
        order() {
          rows.sort((a, b) => a.id.localeCompare(b.id));
          return this;
        },
        range(from, to) {
          calls.push({ table, from, filters: [...filters] });
          rows = rows.slice(from, to + 1);
          return this;
        },
        maybeSingle() {
          return Promise.resolve({ data: rows[0] ?? null, error: null });
        },
        then(resolve) {
          return Promise.resolve({
            data: rows,
            error:
              table === failureTable
                ? { message: "private database error" }
                : null,
          }).then(resolve);
        },
      };
    },
  };
}

function api(db, user = { id: "me" }) {
  return loadTS("src/api/annual-recap.ts", {
    "@/lib/supabase/server": { getCurrentUser: async () => user },
    "@/lib/supabase/admin": { createAdminClient: () => db },
    "@/lib/korea-date": { formatKoreaDateKey: () => "2026-11-18" },
    "@/lib/annual-recap": { buildAnnualRecap },
  });
}

test("server loads more than one page and restricts every private table to the authenticated member", async () => {
  const input = source({
    records: Array.from({ length: 501 }, (_, i) => record(String(i))),
  });
  const db = database({
    profiles: [{ id: "me", name: "테스트" }],
    challenge_periods: input.periods,
    challenges: input.challenges,
    challenge_registrations: input.registrations,
    ritual_records: [
      ...input.records,
      record("foreign", "2026-05-04", "reading", {}, { user_id: "other" }),
    ],
  });
  const result = await api(db).getAnnualRecap();
  assert.equal(result.data.activity.recordCount, 501);
  assert.equal(result.data.activity.certificationCount, 1);
  assert.deepEqual(
    db.calls
      .filter((call) => call.table === "ritual_records")
      .map((call) => call.from),
    [0, 250, 500],
  );
  for (const call of db.calls.filter(
    (call) => call.table !== "challenge_periods",
  ))
    assert.ok(
      call.filters.some(([key, value]) => key === "user_id" && value === "me"),
    );
});

test("unauthenticated calls never read the database, and database failures do not look like zero activity", async () => {
  const unauthorized = database({});
  assert.ok((await api(unauthorized, null).getAnnualRecap()).error);
  assert.equal(unauthorized.calls.length, 0);
  const input = source();
  const db = database(
    { challenges: input.challenges, challenge_periods: input.periods },
    "ritual_records",
  );
  const result = await api(db).getAnnualRecap();
  assert.equal(result.data, undefined);
  assert.ok(result.error);
  assert.ok(!result.error.includes("private database error"));
});
