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

const { isAfterMorningStartLimit, withMorningSchedule } = loadTS('src/lib/morning.ts');
const photoAt = (hour, minute, second = 0) => new Date(2026, 8, 7, hour, minute, second).getTime();

test('start photos accept 06:00:59 and reject 06:01:00 and the old 06:30 cutoff', () => {
  assert.equal(isAfterMorningStartLimit([photoAt(5, 59, 59)]), false);
  assert.equal(isAfterMorningStartLimit([photoAt(6, 0)]), false);
  assert.equal(isAfterMorningStartLimit([photoAt(6, 0, 59)]), false);
  assert.equal(isAfterMorningStartLimit([photoAt(6, 1)]), true);
  assert.equal(isAfterMorningStartLimit([photoAt(6, 30)]), true);
});

test('earliest photo determines start time regardless of upload order', () => {
  assert.equal(isAfterMorningStartLimit([photoAt(6, 30), photoAt(6, 0)]), false);
  assert.equal(isAfterMorningStartLimit([photoAt(6, 30), photoAt(6, 1)]), true);
  assert.equal(isAfterMorningStartLimit([]), false);
});

test('home uses the current morning schedule for old or missing saved times without mutating data', () => {
  for (const times of [['06:30:00', '07:00:00'], [null, null]]) {
    const saved = { id: 'existing', routine_type: 'morning', routine_start_time: times[0], routine_end_time: times[1] };
    assert.deepEqual(withMorningSchedule(saved), {
      ...saved, routine_start_time: '06:00', routine_end_time: '06:30',
    });
    assert.equal(saved.routine_start_time, times[0]);
  }
  const exercise = { routine_type: 'exercise', routine_start_time: '07:00', routine_end_time: '08:00' };
  assert.equal(withMorningSchedule(exercise), exercise);
});

test('morning declaration uses the updated schedule and certification instructions', () => {
  const { declarationQuestions } = loadTS('src/lib/declarationQuestions.ts');
  const questions = declarationQuestions['모닝리추얼'];
  assert.equal(questions.find(q => q.id === 'timetable').label, '타임테이블 (06:00 - 06:30)');
  assert.match(questions.find(q => q.id === 'cert_method').defaultValue, /정각 6시에/);
});

test('server fixes morning registration times even when a stale client sends old times', async () => {
  let inserted;
  const client = {
    from: () => ({
      select() { return this; },
      eq() { return this; },
      maybeSingle: async () => ({ data: null }),
      insert(data) { inserted = data; return this; },
      single: async () => ({ data: inserted }),
    }),
  };
  const { createRoutine } = loadTS('src/api/routine.ts', {
    '@/lib/supabase/server': { getCurrentUser: async () => ({ id: 'user' }), createClient: async () => client },
    '@/lib/supabase/admin': {},
    '@/lib/current-challenge': {},
    '@/api/admin': { isUserDeactivatedForRitual: async () => ({ deactivated: false }) },
  });
  const result = await createRoutine({ challengeId: 'challenge', routineType: 'morning', routineStartTime: '06:30', routineEndTime: '07:00' });
  assert.equal(result.data.routine_start_time, '06:00');
  assert.equal(result.data.routine_end_time, '06:30');
  await createRoutine({ challengeId: 'challenge', routineType: 'exercise', routineStartTime: '07:00', routineEndTime: '08:00' });
  assert.equal(inserted.routine_start_time, '07:00');
  assert.equal(inserted.routine_end_time, '08:00');
});


test('weekend photos still require at least 30 minutes between start and end', () => {
  const { hasMinimumPhotoInterval } = loadTS('src/lib/utils.ts', { clsx: {}, 'tailwind-merge': {} });
  assert.equal(hasMinimumPhotoInterval([photoAt(6, 0), photoAt(6, 30)], 30), true);
  assert.equal(hasMinimumPhotoInterval([photoAt(6, 0), photoAt(6, 29, 59)], 30), false);
});
