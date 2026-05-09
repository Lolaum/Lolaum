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

test("progress counts same-day and weekend certifications as completed", () => {
  const progress = read("src/api/progress.ts");
  const ritualStats = read("src/api/ritual-stats.ts");

  assert.match(
    progress,
    /const rangeEnd = today < periodEnd \? today : periodEnd/,
    "progress should include today's completed certification",
  );
  assert.match(
    progress,
    /const completedDays = fullyCompleteCount/,
    "progress should count completed certification dates, including weekends",
  );
  assert.match(
    ritualStats,
    /const completedDays = Array\.from\(dateMap\.keys\(\)\)\.filter/,
    "home completion should count completed certification dates, including weekends",
  );
});

test("progress denominator stays fixed to weekdays plus three bonus slots", () => {
  const progress = read("src/api/progress.ts");
  const ritualStats = read("src/api/ritual-stats.ts");
  const progressUi = read("src/components/Progress/ProgressContainer.tsx");

  assert.match(
    progress,
    /const totalDaysWithBonus = totalRoutineDays \+ BONUS_SLOTS/,
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
    /\{member\.totalAchieved\}\/\{totalDays\}/,
    "progress UI should display the shared fixed totalDays denominator",
  );
  assert.doesNotMatch(
    progressUi,
    /displayTotalDays|member\.totalDays/,
    "progress UI should not use per-member variable denominators",
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
