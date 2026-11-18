import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';
import ts from 'typescript';

const input = {
  reviewType: 'mid',
  questionKey: 'condition_habit',
  label: '어떤 습관이 리추얼을 유지하기 쉽게 만들었나요?',
  helperText: '구체적으로 적어주세요',
  isActive: true,
};

function savedQuestion(overrides = {}) {
  return {
    id: 'saved-question',
    review_type: 'mid',
    question_key: 'condition_habit',
    label: '기존 질문',
    helper_text: '기존 안내',
    is_active: true,
    sort_order: 4,
    created_at: '2026-11-01T00:00:00.000Z',
    updated_at: '2026-11-01T00:00:00.000Z',
    ...overrides,
  };
}

function adminApi({ rows = [], user = { email: 'admin@example.test' }, databaseError } = {}) {
  const requests = [];
  const errors = [];
  const revalidated = [];
  const client = createClient('https://database.example.test', 'test-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (url, options) => {
      const requestUrl = new URL(url);
      assert.equal(requestUrl.pathname, '/rest/v1/admin_review_questions');
      assert.equal(options.method, 'POST');
      const payload = JSON.parse(options.body);
      const prefer = new Headers(options.headers).get('Prefer') ?? '';
      const conflict = requestUrl.searchParams.get('on_conflict');
      requests.push({ payload, prefer, conflict });
      if (databaseError) {
        return Response.json(databaseError, { status: 400 });
      }
      const existing = rows.find(row => row.review_type === payload.review_type && row.question_key === payload.question_key);
      if (existing) {
        if (conflict !== 'review_type,question_key' || !prefer.includes('resolution=merge-duplicates')) {
          return Response.json({ code: '23505', message: 'duplicate key value violates unique constraint "admin_review_questions_review_type_question_key_key"' }, { status: 409 });
        }
        Object.assign(existing, payload);
      } else {
        rows.push({ id: `new-question-${rows.length}`, sort_order: 0, created_at: new Date().toISOString(), ...payload });
      }
      return new Response(null, { status: 201 });
    } },
  });
  const mocks = {
    'next/cache': { revalidatePath: path => revalidated.push(path) },
    '@/api/auth': {},
    '@/lib/admin-auth': { getAdminEmails: () => ['admin@example.test'], isAdminEmail: email => email === 'admin@example.test' },
    '@/lib/admin-error-log': { logAdminError: async (...args) => errors.push(args) },
    '@/lib/supabase/admin': { createAdminClient: () => client },
    '@/lib/supabase/server': { getCurrentUser: async () => user },
    '@/lib/current-challenge': {},
    '@/lib/declarationQuestions': {},
    '@/lib/korea-date': {},
    '@/lib/progress-accounting': {},
    '@/lib/weekly-routine-progress': {},
    '@/types/supabase': {},
  };
  const { outputText } = ts.transpileModule(readFileSync('src/api/admin.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const loadedModule = { exports: {} };
  new Function('require', 'module', 'exports', outputText)(id => {
    assert.ok(id in mocks, `Missing mock: ${id}`);
    return mocks[id];
  }, loadedModule, loadedModule.exports);
  return { save: loadedModule.exports.upsertReviewQuestion, rows, requests, errors, revalidated };
}

test('editing an existing question without a row ID updates it and preserves its identity and order', async () => {
  const original = savedQuestion();
  const app = adminApi({ rows: [{ ...original }] });
  assert.deepEqual(await app.save(input), { success: true });
  assert.equal(app.rows.length, 1);
  assert.deepEqual(app.rows[0], {
    ...original,
    label: input.label,
    helper_text: input.helperText,
    updated_at: app.requests[0].payload.updated_at,
  });
  assert.ok(Date.parse(app.rows[0].updated_at) > Date.parse(original.updated_at));
  assert.deepEqual(app.revalidated, ['/admin']);
  assert.deepEqual(app.errors, []);
});

test('first save and repeated edits keep exactly one question for both review types', async () => {
  for (const reviewType of ['mid', 'final']) {
    const app = adminApi();
    assert.deepEqual(await app.save({ ...input, reviewType }), { success: true });
    const id = app.rows[0].id;
    assert.deepEqual(await app.save({ ...input, reviewType, label: '수정된 질문', helperText: '   ', isActive: false }), { success: true });
    assert.equal(app.rows.length, 1);
    assert.equal(app.rows[0].id, id);
    assert.equal(app.rows[0].review_type, reviewType);
    assert.equal(app.rows[0].label, '수정된 질문');
    assert.equal(app.rows[0].helper_text, null);
    assert.equal(app.rows[0].is_active, false);
  }
});

test('matching uses the trimmed question key and review type without changing other questions', async () => {
  const otherType = savedQuestion({ id: 'final-question', review_type: 'final' });
  const otherKey = savedQuestion({ id: 'other-question', question_key: 'condition_place' });
  const app = adminApi({ rows: [savedQuestion(), { ...otherType }, { ...otherKey }] });
  assert.deepEqual(await app.save({ ...input, questionKey: ' condition_habit ', label: ' 수정 문구 ', helperText: ' 안내문 ' }), { success: true });
  assert.equal(app.rows.length, 3);
  assert.equal(app.rows[0].label, '수정 문구');
  assert.equal(app.rows[0].helper_text, '안내문');
  assert.deepEqual(app.rows.slice(1), [otherType, otherKey]);
});

test('unauthorized users and empty keys or labels cannot write questions', async () => {
  for (const user of [null, { email: 'user@example.test' }]) {
    const app = adminApi({ user });
    assert.ok((await app.save(input)).error);
    assert.deepEqual(app.requests, []);
  }
  const app = adminApi();
  for (const invalid of [{ ...input, questionKey: ' ' }, { ...input, label: ' ' }]) {
    assert.ok((await app.save(invalid)).error);
  }
  assert.deepEqual(app.requests, []);
});

test('database failures are reported and logged without revalidating the page', async () => {
  const app = adminApi({ databaseError: { message: '저장 실패', code: '42501' } });
  assert.deepEqual(await app.save(input), { error: '저장 실패' });
  assert.deepEqual(app.errors, [['admin.review-question.upsert', '저장 실패', app.requests[0].payload]]);
  assert.deepEqual(app.revalidated, []);
  assert.deepEqual(app.rows, []);
});
