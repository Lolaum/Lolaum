import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import test from 'node:test';
import ts from 'typescript';

function loadTS(file, mocks = {}) {
  const filename = resolve(file);
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const loadedModule = { exports: {} };
  const require = (name) => {
    if (name in mocks) return mocks[name];
    const target = name.startsWith('@/')
      ? resolve('src', name.slice(2))
      : resolve(dirname(filename), name);
    return loadTS(`${target}.ts`, mocks);
  };
  new Function('require', 'module', 'exports', outputText)(require, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

const { getEngagementBasePoints, COMMENT_ONLY_POINTS_STARTED_AT } = loadTS('src/lib/points.ts');
const { getEngagementPointSummariesByUser } = loadTS('src/lib/engagement-points.ts');
const cutoff = Date.parse(COMMENT_ONLY_POINTS_STARTED_AT);
const at = (offset) => new Date(cutoff + offset).toISOString();
const event = (id, offset, feed_id = 'other-feed') => ({ id, user_id: 'user', feed_id, created_at: at(offset) });

function client(reactions, comments) {
  const tables = {
    feed_reactions: reactions,
    feed_comments: comments,
    challenges: [{ id: 'challenge', period_id: 'period' }],
    feeds: [
      { id: 'other-feed', user_id: 'other', challenge_id: 'challenge', ritual_record_id: 'record' },
      { id: 'self-feed', user_id: 'user', challenge_id: 'challenge', ritual_record_id: null },
    ],
    profiles: [{ id: 'other', name: 'Other' }, { id: 'user', name: 'User' }],
  };
  return { from(table) {
    let rows = tables[table];
    return {
      select() { return this; },
      in(key, values) { rows = rows.filter(row => values.includes(row[key])); return this; },
      eq(key, value) { rows = rows.filter(row => row[key] === value); return this; },
      gte(key, value) { rows = rows.filter(row => Date.parse(row[key]) >= Date.parse(value)); return this; },
      then(resolve) { return Promise.resolve({ data: rows }).then(resolve); },
    };
  } };
}

async function summary(reactions = [], comments = [], startDate = '2026-09-01') {
  const results = await getEngagementPointSummariesByUser(client(reactions, comments), ['user'], 'period', startDate);
  return results.get('user');
}

test('policy preserves old values and switches exactly at the cutoff', () => {
  assert.equal(getEngagementBasePoints('like', at(-1)), 1);
  assert.equal(getEngagementBasePoints('comment', at(-1)), 2);
  assert.equal(getEngagementBasePoints('like', at(0)), 0);
  assert.equal(getEngagementBasePoints('comment', at(0)), 1);
});

test('existing totals and history remain unchanged with old daily cap clipping', async () => {
  const result = await summary([event('l1', -4000), event('l2', -3000)], [event('c1', -2000), event('c2', -1000)]);
  assert.equal(result.points, 5);
  assert.deepEqual(result.history.map(e => e.awardedPoints), [1, 2, 1, 1]);
});

test('new comments add one to existing points; new likes do not earn points or consume the cap', async () => {
  const oldLike = event('old-like', -2000);
  const oldComment = event('old-comment', -1000);
  const before = await summary([oldLike], [oldComment]);
  const after = await summary([oldLike, event('new-like', 0)], [oldComment, event('new-comment', 1)]);
  assert.equal(before.points, 3);
  assert.equal(after.points, 4);
  assert.deepEqual(after.history.slice(1), before.history);
  assert.equal(after.history[0].awardedPoints, 1);
});

test('new comments retain the daily five point cap, self exclusions, and Korea midnight reset', async () => {
  const midnight = Date.parse('2026-09-07T15:00:00Z') - cutoff;
  const comments = Array.from({ length: 6 }, (_, i) => event(`c${i}`, i));
  comments.push(event('self', 10, 'self-feed'), event('tomorrow', midnight));
  const result = await summary([event('like', 0)], comments);
  assert.equal(result.points, 6);
  assert.equal(result.history.length, 7);
  assert.equal(result.history.find(e => e.id === 'comment:c5').awardedPoints, 0);
  assert.equal(result.history[0].date, '2026-09-08');
  assert.equal(result.history[0].awardedPoints, 1);
});

test('existing period start filtering remains in effect', async () => {
  const result = await summary([event('old-like', -1000)], [event('old-comment', 0)], '2026-09-08');
  assert.equal(result.points, 0);
  assert.deepEqual(result.history, []);
});
