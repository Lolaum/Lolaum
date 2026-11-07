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


const { isAfterMorningStartLimit, validateMorningPhotos, isValidMorningTimeRange } = loadTS('src/lib/morning.ts');
const photoAt = (time) => Date.parse(`2026-11-07T${time}+09:00`);
const photos = ['https://example.test/start.jpg', 'https://example.test/end.jpg'];
const validData = () => ({ recordType: 'weekend', certPhotos: photos, certPhotoTakenAtTimes: [photoAt('08:00:00'), photoAt('08:30:00')], reflection: '아침 시작' });

test('declared 08:00 start accepts through 08:00:59 and rejects 08:01:00 onward', () => {
  for (const time of ['00:00:00', '06:00:00', '07:59:59', '08:00:00', '08:00:01', '08:00:59', '08:00:59.999']) {
    assert.equal(isAfterMorningStartLimit([photoAt(time)], '08:00'), false, time);
  }
  for (const time of ['08:01:00', '08:01:00.001', '08:30:00', '09:00:00']) {
    assert.equal(isAfterMorningStartLimit([photoAt(time)], '08:00:00'), true, time);
  }
  assert.equal(isAfterMorningStartLimit([photoAt('08:00:00')], '07:00'), true);
  assert.equal(isAfterMorningStartLimit([photoAt('07:15:59')], '07:15'), false);
  assert.equal(isAfterMorningStartLimit([photoAt('07:16:00')], '07:15'), true);
});

test('Korea cutoff is independent of browser/server time zone', () => {
  const original = process.env.TZ;
  try {
    for (const zone of ['UTC', 'America/Los_Angeles', 'Asia/Seoul']) {
      process.env.TZ = zone;
      assert.equal(isAfterMorningStartLimit([photoAt('08:00:59')], '08:00'), false, zone);
      assert.equal(isAfterMorningStartLimit([photoAt('08:01:00')], '08:00'), true, zone);
      assert.equal(isAfterMorningStartLimit([photoAt('00:00:59.999')], '00:00'), false, zone);
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});

test('earliest photo is the start regardless of order; end may be after the cutoff', () => {
  for (const times of [[photoAt('08:00:00'), photoAt('08:30:00')], [photoAt('08:30:00'), photoAt('08:00:00')]]) {
    assert.equal(validateMorningPhotos(photos, times, '08:00'), null);
  }
});

test('missing/invalid schedule, missing metadata, incomplete photos and short intervals fail closed', () => {
  for (const start of [null, undefined, '', '25:00', '8:00', '08:60']) {
    assert.ok(validateMorningPhotos(photos, validData().certPhotoTakenAtTimes, start));
  }
  for (const times of [undefined, [], [photoAt('08:00:00')], [NaN, photoAt('08:30:00')], [Infinity, 0], ['08:00', '08:30'], [1e20, 1e20], [photoAt('08:00:00'), photoAt('08:29:59')]]) {
    assert.ok(validateMorningPhotos(photos, times, '08:00'));
  }
  for (const images of [undefined, [], [photos[0]], ['', photos[1]]]) {
    assert.ok(validateMorningPhotos(images, validData().certPhotoTakenAtTimes, '08:00'));
  }
});

test('morning declaration requires a valid start and later end on the same day', () => {
  assert.equal(isValidMorningTimeRange('08:00', '08:30'), true);
  for (const times of [[null, null], ['', '08:30'], ['08:00', ''], ['25:00', '25:30'], ['08:00', '08:00'], ['08:30', '08:00']]) {
    assert.equal(isValidMorningTimeRange(...times), false);
  }
});

function routineApi() {
  const inserted = [];
  const client = {
    from: () => ({
      select() { return this; }, eq() { return this; },
      maybeSingle: async () => ({ data: null }),
      insert(data) { inserted.push(data); return this; },
      single: async () => ({ data: inserted.at(-1) }),
    }),
  };
  return { inserted, ...loadTS('src/api/routine.ts', {
    '@/lib/supabase/server': { getCurrentUser: async () => ({ id: 'user' }), createClient: async () => client },
    '@/lib/supabase/admin': {}, 'next/cache': { revalidatePath() {} }, '@/lib/current-challenge': {},
    '@/api/admin': { isUserDeactivatedForRitual: async () => ({ deactivated: false }) },
  }) };
}

test('registration stores the chosen morning range without overwriting it with shared live hours', async () => {
  const app = routineApi();
  for (const [start, end] of [['08:00', '08:30'], ['08:00', '09:00'], ['07:00', '07:30'], ['06:30', '07:00']]) {
    const { data } = await app.createRoutine({ challengeId: 'challenge', routineType: 'morning', routineStartTime: start, routineEndTime: end });
    assert.equal(data.routine_start_time, start);
    assert.equal(data.routine_end_time, end);
  }
  await app.createRoutine({ challengeId: 'challenge', routineType: 'exercise', routineStartTime: '23:00', routineEndTime: '00:00' });
  assert.equal(app.inserted.at(-1).routine_end_time, '00:00');
});

test('missing or invalid morning declaration time is rejected before inserting', async () => {
  const app = routineApi();
  for (const times of [[undefined, undefined], ['', '08:30'], ['08:00', '08:00'], ['08:30', '08:00']]) {
    const result = await app.createRoutine({ challengeId: 'challenge', routineType: 'morning', routineStartTime: times[0], routineEndTime: times[1] });
    assert.ok(result.error);
  }
  assert.equal(app.inserted.length, 0);
});

function recordApi({ start = '08:00:00', registrationError = null, target = null, user = { id: 'user' } } = {}) {
  const queries = [], writes = [], normalized = [], notifications = [];
  const client = {
    from(table) {
      const call = { table, filters: [] };
      queries.push(call);
      const response = () => {
        if (call.mutation) return { data: { id: 'record', ...call.values }, error: null };
        if (table === 'challenge_registrations') return { data: call.columns === 'routine_start_time' ? (start === null ? null : { routine_start_time: start }) : [{ routine_type: 'morning' }], error: registrationError };
        if (table === 'ritual_records') return { data: call.columns === 'routine_type' ? [{ routine_type: 'morning' }] : target, error: null };
        throw new Error(`Unexpected query: ${table}`);
      };
      return {
        select(columns) { call.columns = columns; return this; },
        eq(...args) { call.filters.push(args); return this; },
        order() { return this; }, limit() { return this; },
        insert(values) { call.mutation = 'insert'; call.values = values; writes.push(call); return this; },
        update(values) { call.mutation = 'update'; call.values = values; writes.push(call); return this; },
        upsert(values) { call.mutation = 'upsert'; call.values = values; writes.push(call); return this; },
        maybeSingle: async () => response(), single: async () => response(),
        then(resolve, reject) { return Promise.resolve(response()).then(resolve, reject); },
      };
    },
  };
  return { queries, writes, normalized, notifications, ...loadTS('src/api/ritual-record.ts', {
    '@/lib/supabase/server': { getCurrentUser: async () => user, createClient: async () => client },
    '@/lib/supabase/admin': {}, 'next/cache': { revalidatePath() {} },
    '@/lib/current-challenge': { getCurrentChallengeId: async () => ({ challengeId: 'challenge' }) },
    '@/lib/record-data-images': { normalizeRecordDataImages: async data => { normalized.push(data); return data; } },
    '@/lib/notifications/insert': { insertRitualCompletionNotifications: async data => notifications.push(data) },
  }) };
}
const createInput = (recordData = validData()) => ({ challengeId: 'challenge', routineType: 'morning', recordDate: '2026-11-07', recordData });

test('server checks saved user/challenge start time before uploads, insert, completion or notifications', async () => {
  const app = recordApi({ start: '07:00:00' });
  const result = await app.createRitualRecord(createInput({ ...validData(), routineStartTime: '09:00' }));
  assert.match(result.error, /07:00/);
  assert.deepEqual(app.queries[0].filters, [['user_id', 'user'], ['challenge_id', 'challenge'], ['routine_type', 'morning']]);
  assert.equal(app.writes.length, 0);
  assert.equal(app.normalized.length, 0);
  assert.equal(app.notifications.length, 0);
});

test('server saves exact-start certification metadata and updates completion', async () => {
  const app = recordApi();
  const result = await app.createRitualRecordAuto(createInput());
  assert.equal(result.error, undefined);
  assert.deepEqual(result.data.record_data.certPhotoTakenAtTimes, validData().certPhotoTakenAtTimes);
  assert.deepEqual(app.writes.map(call => call.table), ['ritual_records', 'daily_completions']);
  assert.equal(app.notifications.length, 1);
});

test('server rejects late start, missing metadata, too-short interval and missing/failed schedule', async () => {
  const cases = [
    [{}, { ...validData(), certPhotoTakenAtTimes: [photoAt('08:01:00'), photoAt('08:31:00')] }],
    [{}, { ...validData(), certPhotoTakenAtTimes: undefined }],
    [{}, { ...validData(), certPhotoTakenAtTimes: [photoAt('08:00:00'), photoAt('08:29:59')] }],
    [{ start: null }, validData()],
    [{ registrationError: { message: 'unavailable' } }, validData()],
    [{ user: null }, validData()],
  ];
  for (const [options, data] of cases) {
    const app = recordApi(options);
    assert.ok((await app.createRitualRecord(createInput(data))).error);
    assert.equal(app.writes.length, 0);
    assert.equal(app.normalized.length, 0);
  }
});

test('weekday live reflection still saves without photo certification', async () => {
  const app = recordApi({ start: null });
  assert.equal((await app.createRitualRecord(createInput({ recordType: 'weekday', certPhotos: [] }))).error, undefined);
  assert.equal(app.queries.some(call => call.columns === 'routine_start_time'), false);
});

const targetRecord = recordData => ({ challenge_id: 'original-challenge', routine_type: 'morning', record_date: '2026-11-07', record_data: recordData });

test('editing reflection preserves stored photo times omitted by existing feed clients', async () => {
  const app = recordApi({ target: targetRecord(validData()) });
  const { certPhotoTakenAtTimes, ...oldClientData } = validData();
  assert.equal((await app.updateRitualRecord('record', { ...oldClientData, reflection: '수정' })).error, undefined);
  assert.deepEqual(app.writes[0].values.record_data.certPhotoTakenAtTimes, certPhotoTakenAtTimes);
});

test('past certifications without photo metadata remain editable when photos are unchanged', async () => {
  const legacy = { recordType: 'weekend', certPhotos: photos };
  const app = recordApi({ target: targetRecord(legacy) });
  assert.equal((await app.updateRitualRecord('record', { ...legacy, reflection: '수정' })).error, undefined);
});

test('editing certification photos revalidates against the original challenge and rejects late photos', async () => {
  const app = recordApi({ target: targetRecord(validData()) });
  const result = await app.updateRitualRecord('record', { ...validData(), certPhotos: ['new-start', 'new-end'], certPhotoTakenAtTimes: [photoAt('08:01:00'), photoAt('08:31:00')] });
  assert.match(result.error, /08:00/);
  assert.equal(app.writes.length, 0);
  assert.equal(app.normalized.length, 0);
  assert.ok(app.queries.find(call => call.table === 'challenge_registrations').filters.some(([key, value]) => key === 'challenge_id' && value === 'original-challenge'));
});


test('start minute grace and intervals longer than 30 minutes are accepted on the server', async () => {
  for (const end of ['08:30:59', '09:00:00', '09:30:00']) {
    const app = recordApi();
    const data = { ...validData(), certPhotoTakenAtTimes: [photoAt('08:00:59'), photoAt(end)] };
    const result = await app.createRitualRecord(createInput(data));
    assert.equal(result.error, undefined, end);
    assert.deepEqual(result.data.record_data.certPhotoTakenAtTimes, data.certPhotoTakenAtTimes);
  }
});
