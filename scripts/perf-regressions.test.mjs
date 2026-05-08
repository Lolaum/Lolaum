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
