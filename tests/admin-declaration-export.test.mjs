import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import test from 'node:test';
import * as jsx from 'react/jsx-runtime';
import ts from 'typescript';

function load(file, mocks, globals = {}) {
  const filename = resolve(file);
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  });
  const loadedModule = { exports: {} };
  new Function('require', 'module', 'exports', ...Object.keys(globals), outputText)(id => {
    if (id in mocks) return mocks[id];
    const target = id.startsWith('@/') ? resolve('src', id.slice(2)) : resolve(dirname(filename), id);
    return load(existsSync(`${target}.ts`) ? `${target}.ts` : `${target}.tsx`, mocks, globals);
  }, loadedModule, loadedModule.exports, ...Object.values(globals));
  return loadedModule.exports;
}

function fixtures() {
  return {
    challenge_periods: [
      { id: 'current', label: '11월', start_date: '2026-11-01', end_date: '2026-11-30', is_active: true },
      { id: 'past', label: '10월', start_date: '2026-10-01', end_date: '2026-10-31', is_active: false },
      { id: 'empty', label: '12월', start_date: '2026-12-01', end_date: '2026-12-31', is_active: false },
    ],
    profiles: [{ id: 'user', name: '테스트 챌린저', username: 'tester', email: 'user@example.test' }],
    challenges: ['current', 'past'].map(period => ({ id: `challenge-${period}`, user_id: 'user', period_id: period, reset_at: null })),
    challenge_registrations: [
      { id: 'morning', user_id: 'user', challenge_id: 'challenge-current', routine_type: 'morning', routine_start_time: '08:00:00', routine_end_time: '09:00:00' },
      { id: 'exercise', user_id: 'user', challenge_id: 'challenge-current', routine_type: 'exercise', routine_start_time: '18:00:00', routine_end_time: '19:00:00' },
      { id: 'old-morning', user_id: 'user', challenge_id: 'challenge-past', routine_type: 'morning', routine_start_time: '06:00:00', routine_end_time: '06:30:00' },
    ],
    declarations: [
      { id: 'morning', user_id: 'user', challenge_id: 'challenge-current', routine_type: 'morning', created_at: '2026-11-01T22:30:00Z', answers: [
        { questionId: 'expected_change', answer: '아침마다 "책", 물 & 스트레칭\n꾸준히 실천' },
        { questionId: 'timetable', answer: '08:00 독서, 08:30 스트레칭' },
        { questionId: 'sleep_goal', answer: '23:00 취침' },
        { questionId: 'cert_method', answer: '선언 당시 확인한 인증 방법' },
        { questionId: 'after_cert_method', answer: '인증 방법 이후 안내' },
      ] },
      { id: 'exercise', user_id: 'user', challenge_id: 'challenge-current', routine_type: 'exercise', created_at: '2026-11-01T00:00:00Z', answers: [
        { questionId: 'this_month_exercise', answer: '주 3회 러닝' },
        { questionId: 'legacy_question', answer: '이전 질문의 답변' },
      ] },
      { id: 'old-morning', user_id: 'user', challenge_id: 'challenge-past', routine_type: 'morning', created_at: '2026-10-01T00:00:00Z', answers: [{ questionId: 'expected_change', answer: '지난달 목표' }] },
    ],
    ritual_records: [], mid_reviews: [], final_reviews: [],
    admin_deactivated_users: [], admin_review_questions: [], admin_error_logs: [],
  };
}

function dashboard({ tables = fixtures(), user = { email: 'admin@example.test' }, queryError = () => null } = {}) {
  const calls = [];
  const errors = [];
  const { getAdminDashboardData } = load('src/api/admin.ts', {
    'next/cache': {}, '@/api/auth': {},
    '@/lib/admin-auth': { getAdminEmails: () => ['admin@example.test'], isAdminEmail: email => email === 'admin@example.test' },
    '@/lib/admin-error-log': { logAdminError: async (...args) => errors.push(args) },
    '@/lib/supabase/server': { getCurrentUser: async () => user },
    '@/lib/current-challenge': { getEffectiveStart: start => start },
    '@/lib/korea-date': { getKoreaTodayWithinRange: end => end },
    '@/lib/weekly-routine-progress': { calculateWeeklyRoutineProgress: () => ({ weekdayMissed: 0 }) },
    '@/lib/progress-accounting': { calculatePenaltyAccounting: () => ({ penaltyAmount: 0 }) },
    '@/lib/supabase/admin': { createAdminClient: () => ({ from(table) {
      assert.ok(table in tables, `Unexpected table: ${table}`);
      let range;
      const query = {
        select(...args) { calls.push({ table, method: 'select', args }); return query; },
        order() { return query; }, is() { return query; }, limit() { return query; },
        range(...args) { range = args; calls.push({ table, method: 'range', args }); return query; },
        then(onFulfilled, onRejected) {
          const error = queryError(table, range);
          const data = range ? tables[table].slice(range[0], range[1] + 1) : tables[table];
          return Promise.resolve({ data: error ? null : data, error }).then(onFulfilled, onRejected);
        },
      };
      return query;
    } }) },
  });
  return { getAdminDashboardData, calls, errors };
}

test('declarations retain each period, routine time and saved answer with readable question labels', async () => {
  const { data } = await dashboard().getAdminDashboardData();
  const [morning, exercise, past] = data.declarationExportRows;
  assert.equal(data.declarationExportRows.length, 3);
  assert.equal(morning.periodId, 'current');
  assert.equal(morning.name, '테스트 챌린저');
  assert.equal(morning.routineLabel, '모닝리추얼');
  assert.equal(morning.routineStartTime, '08:00');
  assert.equal(morning.routineEndTime, '09:00');
  assert.equal(morning.contents, '기대하는 변화\n아침마다 "책", 물 & 스트레칭\n꾸준히 실천\n\n타임테이블 (선언한 리추얼 시간)\n08:00 독서, 08:30 스트레칭\n\n목표 취침 시간 & 전날 자기 전 준비할 것들\n23:00 취침');
  assert.equal(exercise.routineStartTime, '18:00');
  assert.equal(exercise.contents, '이번 달의 운동\n주 3회 러닝\n\nlegacy_question\n이전 질문의 답변');
  assert.equal(past.periodId, 'past');
  assert.equal(past.routineStartTime, '06:00');
});

test('all routine exports stop before certification instructions, including any following answers', async () => {
  const tables = fixtures();
  const { ROUTINE_TYPE_LABEL } = load('src/types/supabase.ts', {});
  tables.declarations = Object.keys(ROUTINE_TYPE_LABEL).map(routineType => ({
    ...tables.declarations[0],
    id: routineType,
    routine_type: routineType,
    answers: [
      { questionId: 'expected_change', answer: '남길 선언 내용' },
      { questionId: 'cert_method', answer: '제외할 인증 방법' },
      { questionId: 'after_cert_method', answer: '제외할 이후 내용' },
    ],
  }));
  const { data } = await dashboard({ tables }).getAdminDashboardData();
  assert.equal(data.declarationExportRows.length, tables.declarations.length);
  for (const row of data.declarationExportRows) {
    assert.equal(row.contents, '기대하는 변화\n남길 선언 내용', row.routineLabel);
  }
});

test('missing registrations or profiles do not drop declarations or borrow another user time', async () => {
  const tables = fixtures();
  tables.declarations[0].user_id = 'missing-user';
  tables.declarations[0].answers = [null, 'invalid', [], { questionId: 'expected_change', answer: '보존할 답변' }];
  tables.declarations[1].answers = null;
  tables.declarations.push({ ...tables.declarations[0], challenge_id: 'missing-challenge' });
  const { data } = await dashboard({ tables }).getAdminDashboardData();
  assert.equal(data.declarationExportRows.length, 3);
  assert.equal(data.declarationExportRows[0].name, '');
  assert.equal(data.declarationExportRows[0].routineStartTime, '');
  assert.equal(data.declarationExportRows[0].routineEndTime, '');
  assert.equal(data.declarationExportRows[0].contents, '기대하는 변화\n보존할 답변');
  assert.equal(data.declarationExportRows[1].contents, '');
});

test('declarations beyond the database page limit are exported', async () => {
  const tables = fixtures();
  tables.declarations = Array.from({ length: 1001 }, (_, id) => ({ ...tables.declarations[0], id: String(id) }));
  const app = dashboard({ tables });
  const { data } = await app.getAdminDashboardData();
  assert.equal(data.declarationExportRows.length, 1001);
  assert.deepEqual(app.calls.filter(call => call.method === 'range').map(call => call.args), [[0, 999], [1000, 1999]]);
});

test('failed declaration pages report an error instead of exporting partial results', async () => {
  const tables = fixtures();
  tables.declarations = Array.from({ length: 1000 }, (_, id) => ({ ...tables.declarations[0], id: String(id) }));
  const app = dashboard({ tables, queryError: (table, range) => table === 'declarations' && range[0] === 1000 ? { message: '조회 실패' } : null });
  assert.deepEqual(await app.getAdminDashboardData(), { error: '조회 실패' });
  assert.deepEqual(app.errors, [['admin.declarations.fetch', '조회 실패']]);
});

test('unauthenticated and non-admin users cannot query declaration exports', async () => {
  for (const user of [null, { email: 'user@example.test' }]) {
    const app = dashboard({ user });
    assert.ok((await app.getAdminDashboardData()).error);
    assert.equal(app.calls.length, 0);
  }
});

function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.props?.children)];
}

function adminPage(data) {
  const state = [];
  const downloads = [];
  let cursor = 0;
  let blob;
  const { default: Page } = load('src/components/Admin/AdminPageClient.tsx', {
    react: {
      useState(initial) {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [state[index], value => { state[index] = value; }];
      },
      useTransition: () => [false, task => task()],
    },
    'react/jsx-runtime': jsx,
    '@mui/material': new Proxy({}, { get: (_, name) => name === 'createTheme' ? theme => theme : name }),
    '@/api/admin': {},
  }, {
    URL: { createObjectURL(value) { blob = value; return 'blob:test'; }, revokeObjectURL() {} },
    document: { createElement: () => ({ click() { downloads.push({ filename: this.download, blob }); } }) },
  });
  const render = () => { cursor = 0; return Page({ initial: { data } }); };
  nodes(render()).find(node => node.type === 'Tabs').props.onChange(null, 6);
  const select = (label, value) => nodes(render()).find(node => node.props?.label === label && node.type === 'TextField').props.onChange({ target: { value } });
  const button = label => nodes(render()).find(node => node.type === 'Button' && node.props.children === label);
  return { render, select, button, downloads };
}

function worksheet(buffer) {
  for (let offset = 0; buffer.readUInt32LE(offset) === 0x04034b50;) {
    const size = buffer.readUInt32LE(offset + 18);
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const name = buffer.subarray(offset + 30, offset + 30 + nameLength).toString();
    const start = offset + 30 + nameLength + extraLength;
    if (name === 'xl/worksheets/sheet1.xml') return buffer.subarray(start, start + size).toString();
    offset = start + size;
  }
  assert.fail('Missing worksheet in XLSX');
}

test('admin downloads the selected period declarations as CSV and Excel with complete multiline answers', async () => {
  const { data } = await dashboard().getAdminDashboardData();
  const app = adminPage(data);
  assert.ok(nodes(app.render()).some(node => node.type === 'MenuItem' && node.props.value === 'declaration'));
  app.select('다운로드 종류', 'declaration');
  app.button('CSV 다운로드').props.onClick();
  app.button('Excel 다운로드').props.onClick();
  const [csv, excel] = app.downloads;
  assert.equal(csv.filename, 'lolaum-리추얼 선언-11월.csv');
  const csvText = await csv.blob.text();
  assert.ok(csvText.startsWith('닉네임,리추얼,시작 시간,종료 시간,선언 내용,작성일 (한국 시간)\n'));
  assert.ok(csvText.includes('"08:00","09:00"'));
  assert.ok(csvText.includes('아침마다 ""책"", 물 & 스트레칭\n꾸준히 실천'));
  assert.ok(csvText.includes('이번 달의 운동\n주 3회 러닝'));
  assert.ok(csvText.includes('2026. 11. 2. 오전 7:30:00'));
  assert.ok(!csvText.includes('지난달 목표'));
  assert.ok(!csvText.includes('리추얼 인증 방법을 확인해주세요'));
  assert.ok(!csvText.includes('선언 당시 확인한 인증 방법'));
  assert.ok(!csvText.includes('인증 방법 이후 안내'));
  assert.equal(excel.filename, 'lolaum-리추얼 선언-11월.xlsx');
  assert.equal(excel.blob.type, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  const xml = worksheet(Buffer.from(await excel.blob.arrayBuffer()));
  assert.equal((xml.match(/<row /g) ?? []).length, 3);
  assert.ok(xml.includes('아침마다 &quot;책&quot;, 물 &amp; 스트레칭\n꾸준히 실천'));
  assert.ok(xml.includes('legacy_question\n이전 질문의 답변'));
  assert.ok(!xml.includes('지난달 목표'));
  assert.ok(!xml.includes('리추얼 인증 방법을 확인해주세요'));
  assert.ok(!xml.includes('선언 당시 확인한 인증 방법'));
  assert.ok(!xml.includes('인증 방법 이후 안내'));

  app.select('리추얼 기간', 'past');
  app.button('CSV 다운로드').props.onClick();
  assert.equal(app.downloads[2].filename, 'lolaum-리추얼 선언-10월.csv');
  const past = await app.downloads[2].blob.text();
  assert.ok(past.includes('지난달 목표'));
  assert.ok(!past.includes('이번 달의 운동'));
});

test('empty declaration periods disable both downloads and existing donation exports still work', async () => {
  const { data } = await dashboard().getAdminDashboardData();
  const app = adminPage(data);
  app.select('다운로드 종류', 'declaration');
  app.select('리추얼 기간', 'empty');
  assert.equal(app.button('CSV 다운로드').props.disabled, true);
  assert.equal(app.button('Excel 다운로드').props.disabled, true);
  app.select('리추얼 기간', 'current');
  app.select('다운로드 종류', 'donation');
  assert.equal(app.button('CSV 다운로드').props.disabled, false);
  app.button('CSV 다운로드').props.onClick();
  assert.equal(await app.downloads[0].blob.text(), '닉네임,기부금\n"테스트 챌린저","0"');
});
