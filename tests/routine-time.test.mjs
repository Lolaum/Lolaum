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

function makeRoutine(overrides = {}) {
  return {
    id: 'registration-1',
    user_id: 'user-1',
    challenge_id: 'challenge-1',
    routine_type: 'exercise',
    routine_start_time: '21:30',
    routine_end_time: '22:30',
    registered_at: '2026-09-07T00:00:00.000Z',
    ...overrides,
  };
}

function createUpdateClient({ response, onUpdate, rows } = {}) {
  const calls = { from: [], update: [], eq: [], neq: [], select: 0, maybeSingle: 0 };
  const query = {
    update(values) {
      calls.update.push(values);
      onUpdate?.(values);
      return this;
    },
    eq(column, value) {
      calls.eq.push([column, value]);
      return this;
    },
    neq(column, value) {
      calls.neq.push([column, value]);
      return this;
    },
    select() {
      calls.select += 1;
      return this;
    },
    maybeSingle: async () => {
      calls.maybeSingle += 1;
      if (rows) {
        const row = rows.find(row => calls.eq.every(([key, value]) => row[key] === value) && calls.neq.every(([key, value]) => row[key] !== value));
        return { data: row ? { ...row, ...calls.update.at(-1) } : null, error: null };
      }
      return response ?? { data: makeRoutine(), error: null };
    },
  };
  return {
    calls,
    client: {
      from(table) {
        calls.from.push(table);
        return query;
      },
    },
  };
}

function loadRoutineApi({
  user = { id: 'user-1' },
  challenge = { challengeId: 'challenge-1' },
  client,
  revalidatePath = () => {},
} = {}) {
  let createClientCalls = 0;
  let adminClientCalls = 0;
  let getCurrentChallengeIdCalls = 0;
  const { updateRoutineTime } = loadTS('src/api/routine.ts', {
    '@/lib/supabase/server': {
      getCurrentUser: async () => user,
      createClient: async () => {
        createClientCalls += 1;
        throw new Error("User client cannot update registrations under RLS");
      },
    },
    '@/lib/supabase/admin': { createAdminClient: () => {
      adminClientCalls += 1;
      return client ?? createUpdateClient().client;
    } },
    '@/lib/current-challenge': {
      getActivePeriod: async () => ({ period: { id: 'period-1' } }),
      getCurrentChallengeId: async () => {
        getCurrentChallengeIdCalls += 1;
        return challenge;
      },
      isChallengePeriodEnded: () => false,
    },
    '@/api/admin': {
      deleteRegisteredRoutine: async () => ({ success: true }),
      isUserDeactivatedForRitual: async () => ({ deactivated: false }),
    },
    '@/constants/morning': { MORNING_START_TIME: '06:00', MORNING_END_TIME: '06:30' },
    'next/cache': { revalidatePath },
  });

  return {
    updateRoutineTime,
    getCreateClientCalls: () => createClientCalls,
    getAdminClientCalls: () => adminClientCalls,
    getCurrentChallengeIdCalls: () => getCurrentChallengeIdCalls,
  };
}

test('updateRoutineTime requires an authenticated user', async () => {
  const { updateRoutineTime, getCreateClientCalls, getCurrentChallengeIdCalls } = loadRoutineApi({ user: null });

  const result = await updateRoutineTime({
    registrationId: 'registration-1',
    routineStartTime: '21:00',
    routineEndTime: '22:00',
  });

  assert.deepEqual(result, { error: '인증이 필요합니다.' });
  assert.equal(getCreateClientCalls(), 0);
  assert.equal(getCurrentChallengeIdCalls(), 0);
});

test('updateRoutineTime rejects malformed times before updating', async () => {
  const db = createUpdateClient();
  const { updateRoutineTime, getCreateClientCalls, getCurrentChallengeIdCalls } = loadRoutineApi({ client: db.client });

  const result = await updateRoutineTime({
    registrationId: 'registration-1',
    routineStartTime: '24:00',
    routineEndTime: '22:00',
  });

  assert.deepEqual(result, { error: '시작 시간과 종료 시간을 올바르게 입력해주세요.' });
  assert.equal(getCreateClientCalls(), 0);
  assert.equal(getCurrentChallengeIdCalls(), 0);
  assert.deepEqual(db.calls.update, []);
});

test('updateRoutineTime rejects identical start and end times before updating', async () => {
  const db = createUpdateClient();
  const { updateRoutineTime, getCreateClientCalls, getCurrentChallengeIdCalls } = loadRoutineApi({ client: db.client });

  const result = await updateRoutineTime({
    registrationId: 'registration-1',
    routineStartTime: '21:00',
    routineEndTime: '21:00',
  });

  assert.deepEqual(result, { error: '시작 시간과 종료 시간을 다르게 설정해주세요.' });
  assert.equal(getCreateClientCalls(), 0);
  assert.equal(getCurrentChallengeIdCalls(), 0);
  assert.deepEqual(db.calls.update, []);
});

test('updateRoutineTime updates the current user active non-morning registration', async () => {
  const saved = makeRoutine({ routine_start_time: '20:30', routine_end_time: '21:30' });
  const db = createUpdateClient({ response: { data: saved, error: null } });
  const revalidated = [];
  const { updateRoutineTime } = loadRoutineApi({
    client: db.client,
    revalidatePath: (path) => revalidated.push(path),
  });

  const result = await updateRoutineTime({
    registrationId: 'registration-1',
    routineStartTime: '20:30',
    routineEndTime: '21:30',
  });

  assert.equal(result.data, saved);
  assert.deepEqual(db.calls.from, ['challenge_registrations']);
  assert.deepEqual(db.calls.update, [{ routine_start_time: '20:30', routine_end_time: '21:30' }]);
  assert.deepEqual(db.calls.eq, [
    ['id', 'registration-1'],
    ['user_id', 'user-1'],
    ['challenge_id', 'challenge-1'],
  ]);
  assert.deepEqual(db.calls.neq, [['routine_type', 'morning']]);
  assert.equal(db.calls.select, 1);
  assert.equal(db.calls.maybeSingle, 1);
  assert.deepEqual(revalidated, ['/home', '/declaration/[id]']);
});

test('updateRoutineTime reports when no editable routine is found', async () => {
  const db = createUpdateClient({ response: { data: null, error: null } });
  const { updateRoutineTime } = loadRoutineApi({ client: db.client });

  const result = await updateRoutineTime({
    registrationId: 'missing-registration',
    routineStartTime: '20:30',
    routineEndTime: '21:30',
  });

  assert.deepEqual(result, { error: '시간을 수정할 수 있는 리추얼을 찾을 수 없습니다.' });
});

test('updateRoutineTime reports a save failure when the update errors', async () => {
  const db = createUpdateClient({ response: { data: null, error: { message: 'database unavailable' } } });
  const { updateRoutineTime } = loadRoutineApi({ client: db.client });

  const result = await updateRoutineTime({
    registrationId: 'registration-1',
    routineStartTime: '20:30',
    routineEndTime: '21:30',
  });

  assert.deepEqual(result, { error: '시간을 저장하지 못했습니다. 다시 시도해주세요.' });
});

test('updateRoutineTime accepts overnight time ranges', async () => {
  const saved = makeRoutine({ routine_start_time: '23:30', routine_end_time: '00:30' });
  const db = createUpdateClient({ response: { data: saved, error: null } });
  const { updateRoutineTime } = loadRoutineApi({ client: db.client });

  const result = await updateRoutineTime({
    registrationId: 'registration-1',
    routineStartTime: '23:30',
    routineEndTime: '00:30',
  });

  assert.equal(result.data, saved);
  assert.deepEqual(db.calls.update, [{ routine_start_time: '23:30', routine_end_time: '00:30' }]);
});


test('server time update works without user UPDATE permission while scoping the privileged query', async () => {
  const db = createUpdateClient({ rows: [makeRoutine()] });
  const app = loadRoutineApi({ client: db.client });
  const result = await app.updateRoutineTime({ registrationId: 'registration-1', routineStartTime: '14:00', routineEndTime: '14:20' });
  assert.equal(result.data.routine_start_time, '14:00');
  assert.equal(app.getCreateClientCalls(), 0);
  assert.equal(app.getAdminClientCalls(), 1);
});

test('privileged time update cannot change another user, another challenge, or morning registration', async () => {
  for (const row of [makeRoutine({ user_id: 'other' }), makeRoutine({ challenge_id: 'old-challenge' }), makeRoutine({ routine_type: 'morning' })]) {
    const db = createUpdateClient({ rows: [row] });
    const app = loadRoutineApi({ client: db.client });
    const result = await app.updateRoutineTime({ registrationId: row.id, routineStartTime: '14:00', routineEndTime: '14:20' });
    assert.equal(result.data, undefined);
    assert.ok(result.error);
    assert.equal(row.routine_start_time, '21:30');
  }
});

test('missing authentication or active challenge never creates a privileged client', async () => {
  for (const options of [{ user: null }, { challenge: { challengeId: null, error: '종료된 챌린지입니다.' } }]) {
    const app = loadRoutineApi(options);
    const result = await app.updateRoutineTime({ registrationId: 'registration-1', routineStartTime: '14:00', routineEndTime: '14:20' });
    assert.ok(result.error);
    assert.equal(app.getAdminClientCalls(), 0);
  }
});
