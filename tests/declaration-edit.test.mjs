import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import * as jsx from 'react/jsx-runtime';
import ts from 'typescript';

function editor({ timeError, declarationError } = {}) {
  const state = [];
  let cursor = 0;
  const calls = [];
  const routine = { id: 'registration', routine_type: 'exercise', routine_start_time: '15:15', routine_end_time: '15:20' };
  const mocks = {
    react: { useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
    } },
    'react/jsx-runtime': jsx,
    'next/navigation': { useRouter: () => ({ refresh() { calls.push('refresh'); } }) },
    'lucide-react': {},
    '@/lib/declarationQuestions': { declarationQuestions: { 운동리추얼: [{ id: 'goal', label: '목표' }] } },
    '@/lib/routineConfig': { ROUTINE_CONFIG: { 운동리추얼: { color: 'orange', icon: () => null } } },
    '@/components/common/UserAvatar': { default: 'avatar' },
    '@/components/common/ExampleTooltip': { default: 'tooltip' },
    '@/components/Routines/RoutineTimeFields': { default: 'time-fields' },
    '@/api/routine': { updateRoutineTime: async input => {
      calls.push(['time', input]);
      return timeError ? { error: timeError } : { data: { ...routine, routine_start_time: input.routineStartTime, routine_end_time: input.routineEndTime } };
    } },
    '@/api/declaration': { updateDeclaration: async (id, answers) => {
      calls.push(['declaration', id, answers]);
      return declarationError ? { error: declarationError } : {};
    } },
  };
  const { outputText } = ts.transpileModule(readFileSync('src/components/Declaration/DeclarationDetail.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  });
  const loadedModule = { exports: {} };
  new Function('require', 'module', 'exports', outputText)(id => {
    assert.ok(id in mocks, `Missing mock: ${id}`);
    return mocks[id];
  }, loadedModule, loadedModule.exports);
  const render = () => {
    cursor = 0;
    return loadedModule.exports.default({ decl: { id: 'decl', routineType: '운동리추얼', answers: [{ questionId: 'goal', answer: '기존 목표' }], createdAt: '2026-09-07' }, isMine: true, initialRoutine: routine, canEditRoutineTime: true });
  };
  return { render, calls };
}
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.props?.children)];
}
function button(tree, label) {
  return nodes(tree).find(node => node.type === 'button' && [node.props.children].flat().includes(label));
}
function fields(tree) { return nodes(tree).find(node => node.type === 'time-fields'); }

test('one declaration edit/save flow updates time and content without a separate time button', async () => {
  const app = editor();
  assert.equal(fields(app.render()), undefined);
  button(app.render(), '수정').props.onClick();
  let tree = app.render();
  assert.ok(fields(tree));
  assert.equal(button(tree, '시간 수정'), undefined);
  fields(tree).props.onStartChange('16:00');
  fields(tree).props.onEndChange('16:30');
  nodes(tree).find(node => node.type === 'textarea').props.onChange({ target: { value: '새 목표' } });
  await button(app.render(), '저장').props.onClick();
  assert.deepEqual(app.calls, [
    ['time', { registrationId: 'registration', routineStartTime: '16:00', routineEndTime: '16:30' }],
    ['declaration', 'decl', [{ questionId: 'goal', answer: '새 목표' }]],
    'refresh',
  ]);
  assert.equal(fields(app.render()), undefined);
});

test('cancel restores the saved times and does not write anything', () => {
  const app = editor();
  button(app.render(), '수정').props.onClick();
  fields(app.render()).props.onStartChange('20:00');
  button(app.render(), '취소').props.onClick();
  button(app.render(), '수정').props.onClick();
  assert.equal(fields(app.render()).props.startTime, '15:15');
  assert.deepEqual(app.calls, []);
});

test('time save failure retains editing and prevents declaration content from being saved', async () => {
  const app = editor({ timeError: '시간 저장 실패' });
  button(app.render(), '수정').props.onClick();
  fields(app.render()).props.onStartChange('20:00');
  await button(app.render(), '저장').props.onClick();
  assert.equal(app.calls.length, 1);
  assert.equal(fields(app.render()).props.startTime, '20:00');
  assert.equal(nodes(app.render()).find(node => node.props?.role === 'alert').props.children, '시간 저장 실패');
});

test('partial save is reported and retry does not save the time again', async () => {
  const app = editor({ declarationError: '내용 저장 실패' });
  button(app.render(), '수정').props.onClick();
  fields(app.render()).props.onStartChange('20:00');
  await button(app.render(), '저장').props.onClick();
  assert.match(nodes(app.render()).find(node => node.props?.role === 'alert').props.children, /시간은 저장됐지만/);
  await button(app.render(), '저장').props.onClick();
  assert.equal(app.calls.filter(call => call[0] === 'time').length, 1);
  assert.equal(app.calls.filter(call => call[0] === 'declaration').length, 2);
});
