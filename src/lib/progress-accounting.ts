export const PENALTY_AMOUNT_PER_MISSED_DAY = 1000;

export interface PenaltyAccountingResult {
  happyChanceUsed: boolean;
  penaltyAmount: number;
}

/**
 * Apply weekend makeup certifications to missed weekday accounting.
 *
 * Business rule:
 * - The first missed weekday is covered by a happy chance.
 * - Additional missed weekdays accrue donation/penalty.
 * - Weekend makeup certifications pay down donation/penalty first.
 * - Only after donation/penalty is fully cleared can weekend makeup cancel
 *   the happy chance.
 */
export function calculatePenaltyAccounting(
  missedWeekdays: number,
  weekendMakeups: number,
): PenaltyAccountingResult {
  const missed = Math.max(0, missedWeekdays);
  const makeups = Math.max(0, weekendMakeups);
  if (missed === 0) {
    return { happyChanceUsed: false, penaltyAmount: 0 };
  }

  const penaltyMisses = Math.max(0, missed - 1);
  const remainingMakeupsAfterPenalty = Math.max(0, makeups - penaltyMisses);
  const remainingPenaltyMisses = Math.max(0, penaltyMisses - makeups);

  return {
    happyChanceUsed: remainingMakeupsAfterPenalty === 0,
    penaltyAmount: remainingPenaltyMisses * PENALTY_AMOUNT_PER_MISSED_DAY,
  };
}
