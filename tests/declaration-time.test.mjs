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

function makeDeclaration(overrides = {}) {
  return {
    id: 'declaration-1',
    user_id: 'user-1',
    challenge_id: 'challenge-current',
    routine_type: 'exercise',
    answers: [{ questionId: 'goal', answer: '매일 운동' }],
    created_at: '2026-09-07T00:00:00.000Z',
    profiles: { name: '사용자', emoji: '🙂', avatar_url: null },
    ...overrides,
  };
}

function makeRegistration(overrides = {}) {
  return {
    id: 'registration-1',
    user_id: 'user-1',
    challenge_id: 'challenge-current',
    routine_type: 'exercise',
    routine_start_time: '21:00',
    routine_end_time: '22:00',
    registered_at: '2026-09-07T00:00:00.000Z',
    ...overrides,
  };
}

function createAdminClientMock({
  declaration = makeDeclaration(),
  declarationError = null,
  registration = makeRegistration(),
  registrationError = null,
  activeChallenge = { id: 'challenge-current' },
  activeChallengeError = null,
} = {}) {
  const calls = [];
  const tableCounts = {};

  function record(table, method, args) {
    calls.push({ table, method, args });
  }

  function responseFor(table, terminal) {
    if (table === 'declarations') {
      return { data: declaration, error: declarationError };
    }
    if (table === 'challenge_registrations') {
      return { data: registration, error: registrationError };
    }
    if (table === 'challenges') {
      return { data: activeChallenge, error: activeChallengeError };
    }
    throw new Error(`Unexpected ${terminal} query for ${table}`);
  }

  const client = {
    from(table) {
      tableCounts[table] = (tableCounts[table] ?? 0) + 1;
      record(table, 'from', [table]);
      return {
        select(...args) {
          record(table, 'select', args);
          return this;
        },
        eq(...args) {
          record(table, 'eq', args);
          return this;
        },
        order(...args) {
          record(table, 'order', args);
          return this;
        },
        limit(...args) {
          record(table, 'limit', args);
          return this;
        },
        single: async () => {
          record(table, 'single', []);
          return responseFor(table, 'single');
        },
        maybeSingle: async () => {
          record(table, 'maybeSingle', []);
          return responseFor(table, 'maybeSingle');
        },
      };
    },
  };

  return {
    client,
    calls,
    callsFor: (table, method) => calls.filter((call) => call.table === table && (!method || call.method === method)),
    tableCount: (table) => tableCounts[table] ?? 0,
  };
}

function loadDeclarationApi({
  user = { id: 'user-1' },
  admin = createAdminClientMock(),
  period = {
    id: 'period-active',
    start_date: '2026-09-01',
    end_date: '2026-09-30',
  },
  isChallengePeriodEnded = () => false,
} = {}) {
  let getActivePeriodCalls = 0;
  const { getDeclarationById } = loadTS('src/api/declaration.ts', {
    '@/lib/supabase/server': {
      getCurrentUser: async () => user,
      createClient: async () => {
        throw new Error('getDeclarationById should use the admin client for declaration detail lookups');
      },
    },
    '@/lib/supabase/admin': { createAdminClient: () => admin.client },
    '@/lib/current-challenge': {
      getCurrentChallengeId: async () => ({ challengeId: 'challenge-current' }),
      getActivePeriod: async () => {
        getActivePeriodCalls += 1;
        return period ? { period } : { period: null, error: '활성 챌린지 기간이 없습니다.' };
      },
      isChallengePeriodEnded,
    },
    '@/lib/morning': {
      withMorningSchedule: (routine) =>
        routine?.routine_type === 'morning'
          ? { ...routine, routine_start_time: '06:00', routine_end_time: '06:30' }
          : routine,
    },
    '@/types/supabase': {
      ROUTINE_TYPE_LABEL: {
        morning: '모닝리추얼',
        exercise: '운동리추얼',
        reading: '독서리추얼',
        english: '영어리추얼',
        second_language: '제2외국어리추얼',
        recording: '기록리추얼',
        cleanup: '정돈리추얼',
        finance: '자산관리리추얼',
        english_book: '원서읽기리추얼',
      },
    },
  });

  return {
    getDeclarationById,
    getActivePeriodCalls: () => getActivePeriodCalls,
  };
}

test('getDeclarationById fetches the routine from the declaration challenge', async () => {
  const admin = createAdminClientMock({
    declaration: makeDeclaration({ challenge_id: 'challenge-new' }),
    registration: makeRegistration({
      id: 'new-registration',
      challenge_id: 'challenge-new',
      routine_start_time: '20:00',
      routine_end_time: '21:00',
    }),
  });
  const { getDeclarationById } = loadDeclarationApi({ admin });

  const result = await getDeclarationById('declaration-1');

  assert.equal(result.routine.id, 'new-registration');
  assert.deepEqual(admin.callsFor('challenge_registrations', 'eq').map((call) => call.args), [
    ['user_id', 'user-1'],
    ['challenge_id', 'challenge-new'],
    ['routine_type', 'exercise'],
  ]);
});

test('getDeclarationById selects declaration challenge_id for routine scoping', async () => {
  const admin = createAdminClientMock();
  const { getDeclarationById } = loadDeclarationApi({ admin });

  await getDeclarationById('declaration-1');

  const declarationSelect = admin.callsFor('declarations', 'select')[0].args[0];
  assert.match(declarationSelect, /challenge_id/);
});

test('getDeclarationById returns editable routine time for the current user active non-morning routine', async () => {
  const admin = createAdminClientMock();
  const { getDeclarationById } = loadDeclarationApi({ admin });

  const result = await getDeclarationById('declaration-1');

  assert.equal(result.currentUserId, 'user-1');
  assert.equal(result.canEditRoutineTime, true);
  assert.deepEqual(result.routine, makeRegistration());
  assert.deepEqual(admin.callsFor('challenges', 'eq').map((call) => call.args), [
    ['id', 'challenge-current'],
    ['period_id', 'period-active'],
  ]);
});

test('getDeclarationById keeps another user declaration time readonly without active period lookup', async () => {
  const admin = createAdminClientMock({
    declaration: makeDeclaration({ user_id: 'other-user' }),
    registration: makeRegistration({ user_id: 'other-user' }),
  });
  const { getDeclarationById, getActivePeriodCalls } = loadDeclarationApi({ admin });

  const result = await getDeclarationById('declaration-1');

  assert.equal(result.canEditRoutineTime, false);
  assert.equal(getActivePeriodCalls(), 0);
  assert.equal(admin.tableCount('challenges'), 0);
});

test('getDeclarationById keeps old challenge declaration time readonly', async () => {
  const admin = createAdminClientMock({
    declaration: makeDeclaration({ challenge_id: 'challenge-old' }),
    registration: makeRegistration({ challenge_id: 'challenge-old' }),
    activeChallenge: null,
  });
  const { getDeclarationById } = loadDeclarationApi({ admin });

  const result = await getDeclarationById('declaration-1');

  assert.equal(result.canEditRoutineTime, false);
});

test('getDeclarationById keeps morning declaration time readonly with the shared morning schedule', async () => {
  const admin = createAdminClientMock({
    declaration: makeDeclaration({ routine_type: 'morning' }),
    registration: makeRegistration({
      routine_type: 'morning',
      routine_start_time: '06:30:00',
      routine_end_time: '07:00:00',
    }),
  });
  const { getDeclarationById, getActivePeriodCalls } = loadDeclarationApi({ admin });

  const result = await getDeclarationById('declaration-1');

  assert.equal(result.canEditRoutineTime, false);
  assert.equal(result.routine.routine_start_time, '06:00');
  assert.equal(result.routine.routine_end_time, '06:30');
  assert.equal(getActivePeriodCalls(), 0);
});

test('getDeclarationById returns null routine when no registration matches the declaration', async () => {
  const admin = createAdminClientMock({ registration: null });
  const { getDeclarationById } = loadDeclarationApi({ admin });

  const result = await getDeclarationById('declaration-1');

  assert.equal(result.routine, null);
  assert.equal(result.canEditRoutineTime, false);
});

test('getDeclarationById returns an error when the declaration query fails', async () => {
  const admin = createAdminClientMock({
    declaration: null,
    declarationError: { message: 'declaration unavailable' },
  });
  const { getDeclarationById } = loadDeclarationApi({ admin });

  const result = await getDeclarationById('declaration-1');

  assert.deepEqual(result, { error: 'declaration unavailable' });
});

test('getDeclarationById returns an error when the registration query fails', async () => {
  const admin = createAdminClientMock({
    registration: null,
    registrationError: { message: 'registration unavailable' },
  });
  const { getDeclarationById } = loadDeclarationApi({ admin });

  const result = await getDeclarationById('declaration-1');

  assert.deepEqual(result, { error: 'registration unavailable' });
});
