/**
 * 신청한 모든 리추얼(registeredTypes)에 대해 항목(rows)이 작성되었는지 검사.
 * 선언/중간회고/최종회고가 "신청한 리추얼 수만큼 채워졌을 때"만 달성으로 인정한다.
 *
 * "use server" 파일에서는 비동기 함수만 export 가능하므로
 * 동기 헬퍼는 이 별도 모듈에 위치한다.
 */
export function isAllRoutinesCovered(
  registeredTypes: Set<string>,
  rows: { routine_type: string }[] | null | undefined,
): boolean {
  if (registeredTypes.size === 0) return false;
  const written = new Set((rows ?? []).map((r) => r.routine_type));
  for (const rt of registeredTypes) {
    if (!written.has(rt)) return false;
  }
  return true;
}
