import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import * as jsx from 'react/jsx-runtime';
import ts from 'typescript';

function load(file, mocks) {
  const filename = resolve(file);
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputText)(id => {
    if (id in mocks) return mocks[id];
    const target = id.startsWith('@/') ? resolve('src', id.slice(2)) : resolve(dirname(filename), id);
    return load(existsSync(`${target}.ts`) ? `${target}.ts` : `${target}.tsx`, mocks);
  }, module, module.exports);
  return module.exports;
}
function hookState() {
  const state = [];
  let cursor = 0;
  function useState(initial) {
    const index = cursor++;
    if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
    return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
  }
  return { reset: () => { cursor = 0; }, react: { useState, useRef: initial => useState({ current: initial })[0], useEffect() {} } };
}
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.props?.children)];
}
function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join('');
  if (tree && typeof tree === 'object') return text(tree.props?.children);
  return typeof tree === 'string' || typeof tree === 'number' ? String(tree) : '';
}
const button = (tree, label) => nodes(tree).find(node => node.type === 'button' && text(node).includes(label));
const photo = time => ({ name: `${time}.jpg`, takenAt: Date.parse(`2026-11-07T${time}+09:00`) });

function morningForm(start = '08:00:00', onSubmit) {
  const hooks = hookState();
  const saved = [];
  const { default: Form } = load('src/components/Routines/Morning/AddNewMorning.tsx', {
    react: hooks.react, 'react/jsx-runtime': jsx, 'lucide-react': {},
    '@/components/common/CertificationPhotoIntervalModal': { default: 'validation-modal' },
    '@/components/common/RitualDraftButtons': { default: 'draft-buttons' },
    '@/hooks/useRitualDraft': { useRitualDraft: () => ({ hasDraft: false }) },
    '@/lib/utils': {
      normalizeImageFiles: async files => files,
      getPhotoTakenAt: async file => new Date(file.takenAt),
      applyTimestamp: async file => file.name,
      hasMinimumPhotoInterval: times => Math.max(...times) - Math.min(...times) >= 30 * 60 * 1000,
    },
    '@/lib/upload-image': { uploadImages: async images => images.map(image => `https://example.test/${image}`) },
  });
  const render = () => {
    hooks.reset();
    return Form({ morningStartTime: start, onCancel() {}, onSubmit: onSubmit ?? (data => saved.push(data)) });
  };
  const upload = async files => {
    const input = nodes(render()).find(node => node.type === 'input' && node.props.type === 'file');
    await input.props.onChange({ target: { files, value: 'selected' } });
  };
  const fill = () => {
    nodes(render()).find(node => node.type === 'input' && node.props.type === 'number').props.onChange({ target: { value: '8' } });
    nodes(render()).find(node => node.type === 'select').props.onChange({ target: { value: '상' } });
    for (const node of nodes(render()).filter(node => node.type === 'textarea')) node.props.onChange({ target: { value: '기록' } });
  };
  button(render(), '보충 인증').props.onClick();
  return { render, upload, fill, saved };
}

test('photo form rejects a late start and displays the declared cutoff', async () => {
  const app = morningForm();
  app.fill();
  await app.upload([photo('08:01:00'), photo('08:31:00')]);
  const modal = nodes(app.render()).find(node => node.type === 'validation-modal' && node.props.open);
  assert.match(modal.props.message, /08:00:59/);
  assert.equal(button(app.render(), '오늘의 리추얼 성공').props.disabled, true);
  assert.equal(nodes(app.render()).filter(node => node.type === 'img').length, 0);
});

test('end-first uploads accept start-minute grace and a longer interval, and removal blocks submission', async () => {
  const app = morningForm();
  app.fill();
  await app.upload([photo('09:00:00')]);
  await app.upload([photo('08:00:59')]);
  assert.equal(button(app.render(), '오늘의 리추얼 성공').props.disabled, false);
  await button(app.render(), '오늘의 리추얼 성공').props.onClick();
  assert.equal(app.saved.length, 1);
  assert.deepEqual(app.saved[0].certPhotoTakenAtTimes, [photo('09:00:00').takenAt, photo('08:00:59').takenAt]);
  nodes(app.render()).find(node => node.type === 'button' && node.props.className?.includes('absolute top-2')).props.onClick();
  assert.equal(button(app.render(), '오늘의 리추얼 성공').props.disabled, true);
});

test('photo form blocks certification when declaration time is unavailable', () => {
  const app = morningForm(null);
  app.fill();
  assert.equal(button(app.render(), '오늘의 리추얼 성공').props.disabled, true);
  assert.equal(nodes(app.render()).some(node => node.type === 'input' && node.props.type === 'file'), false);
  assert.match(text(nodes(app.render()).find(node => node.props?.role === 'alert')), /시작 시간/);
});

test('photo form surfaces server validation failures and keeps the entered photos', async () => {
  const app = morningForm('08:00', async () => { throw new Error('시작 사진은 07:00:59까지 촬영해야 합니다.'); });
  app.fill();
  await app.upload([photo('08:00:00'), photo('08:30:00')]);
  const alerts = [], originalAlert = globalThis.alert;
  globalThis.alert = message => alerts.push(message);
  try { await button(app.render(), '오늘의 리추얼 성공').props.onClick(); }
  finally {
    if (originalAlert === undefined) delete globalThis.alert;
    else globalThis.alert = originalAlert;
  }
  assert.match(alerts[0], /07:00:59/);
  assert.equal(nodes(app.render()).filter(node => node.type === 'img').length, 2);
  assert.equal(button(app.render(), '오늘의 리추얼 성공').props.disabled, false);
});

test('declaration defaults to 06:00–06:30, permits longer custom ranges, and preserves edits on reselection', async () => {
  const picker = load('src/components/Routines/TimePickerField.tsx', { 'react/jsx-runtime': jsx, 'lucide-react': {} });
  for (const custom of [false, true]) {
    const hooks = hookState(), registrations = [];
    const { default: Form } = load('src/components/Home/Todo/GenerateRoutine.tsx', {
      react: hooks.react, 'react/jsx-runtime': jsx, 'lucide-react': {},
      'next/navigation': { useRouter: () => ({ refresh() {} }) },
      '@/components/common/ExampleTooltip': { default: 'tooltip' },
      '@/components/Routines/TimePickerField': { ...picker, default: 'time-picker' },
      '@/api/challenge': {},
      '@/api/routine': { createRoutineAuto: async (...args) => { registrations.push(args); return {}; } },
      '@/api/declaration': { createDeclaration: async () => ({}) },
    });
    const render = () => { hooks.reset(); return Form({ onClose() {} }); };
    button(render(), '모닝').props.onClick();
    button(render(), '다음').props.onClick();
    const fields = () => nodes(render()).filter(node => node.type === 'time-picker');
    assert.deepEqual(fields()[0].props.parts, { period: 'AM', hour: '06', minute: '00' });
    assert.deepEqual(fields()[1].props.parts, { period: 'AM', hour: '06', minute: '30' });
    assert.equal(button(render(), '리추얼 추가').props.disabled, true);
    for (const node of nodes(render()).filter(node => node.type === 'textarea' && !node.props.disabled)) node.props.onChange({ target: { value: '선언' } });
    for (const node of nodes(render()).filter(node => node.type === 'input' && node.props.type === 'checkbox')) node.props.onChange({ target: { checked: true } });
    if (custom) {
      fields()[0].props.onChange({ period: 'AM', hour: '08', minute: '00' });
      fields()[1].props.onChange({ period: 'AM', hour: '09', minute: '00' });
      button(render(), '이전').props.onClick();
      button(render(), '모닝').props.onClick();
      button(render(), '모닝').props.onClick();
      button(render(), '다음').props.onClick();
      assert.equal(fields()[0].props.parts.hour, '08');
      assert.equal(fields()[1].props.parts.hour, '09');
    }
    const submit = button(render(), '리추얼 추가');
    assert.equal(submit.props.disabled, false);
    await submit.props.onClick();
    assert.deepEqual(registrations, [['morning', {
      routineStartTime: custom ? '08:00' : '06:00',
      routineEndTime: custom ? '09:00' : '06:30',
    }]]);
  }
});
