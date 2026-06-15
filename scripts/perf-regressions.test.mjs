import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("feed pagination does not refetch the same page from a client effect", () => {
  const source = read("src/components/Feed/FeedContainer.tsx");

  assert.equal(
    source.includes("@/api/ritual-records-display"),
    false,
    "FeedContainer should consume server-rendered page data instead of importing the server action",
  );
  assert.equal(
    source.includes("getAllRecordsForDisplay"),
    false,
    "FeedContainer should not call getAllRecordsForDisplay on route/search param changes",
  );
  assert.match(
    source,
    /useTransition/,
    "FeedContainer should show navigation pending state without a duplicate fetch",
  );
  assert.match(
    source,
    /const PAGE_NUMBER_WINDOW = 5/,
    "Feed pagination should show at most five numbered page buttons",
  );
  assert.match(
    source,
    /visiblePageNumbers\.map/,
    "Feed pagination should render the bounded page number window",
  );
});

test("home sends hydration data that used to be fetched again on mount", () => {
  const stats = read("src/api/ritual-stats.ts");
  const home = read("src/components/Home/HomeContainer.tsx");

  assert.match(stats, /profile\?:/, "getHomeStats should return the current profile");
  assert.match(stats, /challengers\?:/, "getHomeStats should return current challengers");
  assert.match(stats, /routines\?:/, "getHomeStats should return current routines");
  assert.match(home, /initialProfile=\{initialData\.profile/, "Profile should receive SSR profile data");
  assert.match(home, /initialMembers=\{initialData\.challengers/, "MemberProfile should receive SSR challenger data");
  assert.match(home, /initialRoutines=\{initialData\.routines/, "RoutineList should receive SSR routine data");
});

test("record writes normalize data-url images before DB persistence", () => {
  const recordApi = read("src/api/ritual-record.ts");
  const migration = read("scripts/migrate-record-data-images.mjs");

  assert.match(
    recordApi,
    /normalizeRecordDataImages/,
    "record writes should normalize data-url images before DB insert/update",
  );
  assert.match(
    migration,
    /dataUrlBytes/,
    "migration script should keep a safe dry-run summary for legacy payloads",
  );
});

test("progress and completion count mid and final review bonuses", () => {
  const progress = read("src/api/progress.ts");
  const ritualStats = read("src/api/ritual-stats.ts");

  assert.match(
    progress,
    /\.from\("mid_reviews"\)[\s\S]*\.from\("final_reviews"\)/,
    "progress should fetch both mid and final review rows",
  );
  assert.match(
    progress,
    /\(hasMidReview \? 1 : 0\)[\s\S]*\(hasFinalReview \? 1 : 0\)/,
    "progress totalAchieved should include both review bonuses",
  );
  assert.match(
    ritualStats,
    /\.from\("mid_reviews"\)[\s\S]*\.from\("final_reviews"\)/,
    "home and ritual completion stats should fetch both review rows",
  );
  assert.doesNotMatch(
    ritualStats,
    /hasFinalReview = false/,
    "completion stats should not hard-code final review as missing",
  );
});

test("progress pools same-week partial routine completions", () => {
  const progress = read("src/api/progress.ts");
  const ritualStats = read("src/api/ritual-stats.ts");
  const weeklyProgress = read("src/lib/weekly-routine-progress.ts");

  assert.match(
    progress,
    /const rangeEnd = getKoreaTodayWithinRange\(period\.end_date\)/,
    "progress should include today's completed certification",
  );
  assert.match(
    weeklyProgress,
    /Mon 1\/2\/3 \+[\s\S]*counts as two completed days/,
    "weekly progress should document the partial weekday pooling example",
  );
  assert.match(
    weeklyProgress,
    /const completedInWeek = Math\.min\(minRoutineCompletions, maxWeekdayTarget\)/,
    "weekly progress should count same-week pooled routine completions before weekend",
  );
  assert.doesNotMatch(
    weeklyProgress,
    /weekdayFullCompletions/,
    "weekly progress should no longer require same-day full completion before weekend",
  );
  assert.match(
    ritualStats,
    /calcCompletionAccounting\([\s\S]*dateMap[\s\S]*registeredTypes/,
    "home completion should use the shared routine progress accounting",
  );
});

test("progress applies happy chance and donation after weekly pooled accounting", () => {
  const progress = read("src/api/progress.ts");
  const accounting = read("src/lib/progress-accounting.ts");

  assert.match(
    progress,
    /같은 주의 부분 인증 합산을 반영한 뒤 남은 미완료만 계산/,
    "progress should calculate misses after same-week partial routine pooling",
  );
  assert.match(
    progress,
    /calculatePenaltyAccounting\(\s*weekdayMissed,\s*0,\s*\)/,
    "progress should calculate happy chance and donation after weekly makeups are already reflected",
  );
  assert.match(
    accounting,
    /const penaltyMisses = Math\.max\(0, missed - 1\)/,
    "the first missed weekday should be the happy chance bucket",
  );
  assert.match(
    accounting,
    /const remainingMakeupsAfterPenalty = Math\.max\(0, makeups - penaltyMisses\)/,
    "weekend makeups should clear donation buckets before the happy chance bucket",
  );
  assert.match(
    accounting,
    /happyChanceUsed: remainingMakeupsAfterPenalty === 0/,
    "happy chance should be cancelled only after donation buckets are cleared",
  );
});

test("progress denominator stays fixed to weekdays plus three bonus slots", () => {
  const progress = read("src/api/progress.ts");
  const ritualStats = read("src/api/ritual-stats.ts");
  const progressUi = read("src/components/Progress/ProgressContainer.tsx");

  assert.match(
    progress,
    /const periodTotalDaysWithBonus = periodTotalRoutineDays \+ BONUS_SLOTS/,
    "progress page should use period weekdays plus declaration/mid/final bonus slots as the fixed denominator",
  );
  assert.match(
    ritualStats,
    /const totalDays = totalRoutineDays \+ 3/,
    "completion stats should use period weekdays plus three bonus slots as the fixed denominator",
  );
  assert.doesNotMatch(
    progress,
    /totalAchieved \+ weekdayMissed/,
    "progress denominator should not include missed weekdays, happy chance, or penalty counts",
  );
  assert.doesNotMatch(
    ritualStats,
    /accountedTotalDays/,
    "completion denominator should not grow with missed weekdays",
  );
  assert.match(
    progressUi,
    /const totalDays = member\.totalDays/,
    "progress UI should display each member's fixed effective-start denominator",
  );
  assert.doesNotMatch(
    progressUi,
    /displayTotalDays/,
    "progress UI should not use ad-hoc display denominators",
  );
});

test("progress lists only challengers with at least one registered ritual", () => {
  const progress = read("src/api/progress.ts");
  const ritualStats = read("src/api/ritual-stats.ts");
  const userApi = read("src/api/user.ts");

  assert.match(
    progress,
    /registeredUserIds\.has\(c\.userId\)/,
    "progress challenger list should hide users without registered rituals",
  );
  assert.match(
    ritualStats,
    /registeredUserIds\.has\(r\.user_id\)/,
    "home challenger list should hide users without registered rituals",
  );
  assert.match(
    userApi,
    /registeredUserIds\.has\(r\.user_id\)/,
    "refetched challenger list should hide users without registered rituals",
  );
});

test("language flash cards reset outside the current ritual period", () => {
  const recordApi = read("src/api/ritual-record.ts");
  const language = read("src/components/Routines/Language/LanguageContainer.tsx");

  assert.match(
    recordApi,
    /currentPeriodOnly\?: boolean/,
    "record reads should support current-period filtering for period-scoped screens",
  );
  assert.match(
    recordApi,
    /isChallengePeriodEnded\(period\)\) return \{ data: \[\] \}/,
    "current-period record reads should reset to empty after the ritual period ends",
  );
  assert.match(
    recordApi,
    /getEffectiveStart\(period\.start_date, resetAt\)/,
    "current-period record reads should also respect challenge reset_at",
  );
  assert.match(
    language,
    /currentPeriodOnly: true/,
    "English and second-language flash cards should only use current-period records",
  );
});
