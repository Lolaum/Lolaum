import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import * as jsx from 'react/jsx-runtime';
import ts from 'typescript';

function load(file, mocks) {
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  });
  const loadedModule = { exports: {} };
  new Function('require', 'module', 'exports', outputText)(id => {
    assert.ok(id in mocks, `Missing mock: ${id}`);
    return mocks[id];
  }, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}
const shared = load('src/components/Routines/TimePickerField.tsx', { 'react/jsx-runtime': jsx, 'lucide-react': { Clock3: 'clock' } });
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.props?.children)];
}
function button(tree, text) {
  return nodes(tree).find(node => node.type === 'button' && node.props.children === text);
}
function setup(start = '15:15', end = '15:20') {
  const state = [];
  let cursor = 0;
  const changes = [];
  const { default: Fields } = load('src/components/Routines/RoutineTimeFields.tsx', {
    'react/jsx-runtime': jsx,
    './TimePickerField': shared,
    react: { useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], update => { state[index] = typeof update === 'function' ? update(state[index]) : update; }];
    } },
  });
  const fields = () => {
    cursor = 0;
    return nodes(Fields({ startTime: start, endTime: end, onStartChange: value => changes.push(['start', value]), onEndChange: value => changes.push(['end', value]) })).filter(node => node.type === shared.default);
  };
  return { fields, changes };
}

test('opening a field renders the creation picker with AM/PM, hours, minutes and confirm', () => {
  const app = setup();
  assert.ok(app.fields().every(field => !field.props.isOpen));
  app.fields()[0].props.onToggle();
  let tree = shared.default(app.fields()[0].props);
  for (const label of ['오전', '오후', '01', '12', '00', '55', '확인']) assert.ok(button(tree, label), label);
  button(tree, '오전').props.onClick();
  assert.deepEqual(app.changes.at(-1), ['start', '03:15']);
  tree = shared.default(app.fields()[0].props);
  button(tree, '확인').props.onClick();
  assert.ok(app.fields().every(field => !field.props.isOpen));
});

test('switching fields closes the previous picker and only edits the selected time', () => {
  const app = setup();
  app.fields()[0].props.onToggle();
  app.fields()[1].props.onToggle();
  assert.deepEqual(app.fields().map(field => field.props.isOpen), [false, true]);
  button(shared.default(app.fields()[1].props), '30').props.onClick();
  assert.deepEqual(app.changes, [['end', '15:30']]);
});

test('existing minute precision, noon and midnight survive conversion without rounding', () => {
  for (const value of ['00:00', '12:00', '15:17', '23:59']) assert.equal(shared.toTimeValue(shared.fromTimeValue(value)), value);
  const app = setup('15:17');
  app.fields()[0].props.onToggle();
  assert.ok(button(shared.default(app.fields()[0].props), '17'));
  assert.deepEqual(app.changes, []);
});

test('incomplete times need all three selections before confirmation', () => {
  const app = setup('');
  app.fields()[0].props.onToggle();
  assert.equal(button(shared.default(app.fields()[0].props), '확인').props.disabled, true);
  for (const patch of [{ period: 'PM' }, { hour: '12' }, { minute: '00' }]) app.fields()[0].props.onChange(patch);
  assert.equal(button(shared.default(app.fields()[0].props), '확인').props.disabled, false);
  assert.deepEqual(app.changes.at(-1), ['start', '12:00']);
});
