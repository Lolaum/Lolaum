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

const { countRoutineDaysInDateKeyRange, isExcludedRoutineDate } = loadTS('src/lib/korea-date.ts');
const { calculateWeeklyRoutineProgress } = loadTS('src/lib/weekly-routine-progress.ts');

test('September challenge has 15 routine days and 18 total slots including bonuses', () => {
  assert.equal(countRoutineDaysInDateKeyRange('2026-09-06', '2026-09-29'), 15);
  assert.equal(countRoutineDaysInDateKeyRange('2026-09-06', '2026-09-29') + 3, 18);
  assert.equal(countRoutineDaysInDateKeyRange('2026-09-24', '2026-09-25'), 0);
  assert.equal(countRoutineDaysInDateKeyRange('2026-09-24', '2026-09-29') + 3, 5);
  assert.equal(countRoutineDaysInDateKeyRange('2026-08-03', '2026-08-07'), 5);
  assert.equal(countRoutineDaysInDateKeyRange('2027-09-20', '2027-09-24'), 5);
  assert.equal(isExcludedRoutineDate('2027-09-24'), false);
});

const progress = (dates) => calculateWeeklyRoutineProgress({
  dateMap: new Map(dates.map(date => [date, new Set(['exercise'])])),
  registeredTypes: new Set(['exercise']),
  rangeStart: '2026-09-21',
  rangeEnd: '2026-09-27',
  today: '2026-09-28',
});

test('Chuseok records do not count and missed holidays do not incur misses', () => {
  assert.deepEqual(progress(['2026-09-24', '2026-09-25']), { completedDays: 0, weekdayMissed: 3 });
  assert.deepEqual(progress(['2026-09-21', '2026-09-22', '2026-09-23']), { completedDays: 3, weekdayMissed: 0 });
});

test('weekend makeup still counts against the reduced weekly target', () => {
  assert.deepEqual(progress(['2026-09-21', '2026-09-26', '2026-09-27']), { completedDays: 3, weekdayMissed: 0 });
  assert.deepEqual(progress(['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-26', '2026-09-27']), { completedDays: 3, weekdayMissed: 0 });
});
