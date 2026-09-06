import {
  MORNING_END_TIME,
  MORNING_START_LIMIT_SECONDS,
  MORNING_START_TIME,
} from "../constants/morning";

// Morning Ritual follows the shared schedule, including older registrations.
export function withMorningSchedule<T extends {
  routine_type: string;
  routine_start_time: string | null;
  routine_end_time: string | null;
}>(routine: T): T {
  return routine.routine_type === "morning"
    ? { ...routine, routine_start_time: MORNING_START_TIME, routine_end_time: MORNING_END_TIME }
    : routine;
}

export function isAfterMorningStartLimit(takenAtTimes: number[]) {
  if (takenAtTimes.length === 0) return false;

  const startTime = new Date(Math.min(...takenAtTimes));
  const seconds =
    startTime.getHours() * 60 * 60 +
    startTime.getMinutes() * 60 +
    startTime.getSeconds();

  return seconds > MORNING_START_LIMIT_SECONDS;
}
