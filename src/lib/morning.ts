import { KOREA_TIME_ZONE } from "./korea-date";

function timeInSeconds(time: string | null | undefined): number | null {
  if (!time || !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(time))
    return null;
  const [hour, minute, second = 0] = time.split(":").map(Number);
  return hour * 3600 + minute * 60 + second;
}

export function isValidMorningTimeRange(
  start: string | null | undefined,
  end: string | null | undefined,
): boolean {
  const startSeconds = timeInSeconds(start);
  const endSeconds = timeInSeconds(end);
  return (
    startSeconds !== null && endSeconds !== null && endSeconds > startSeconds
  );
}

export function morningStartTimeMessage(startTime: string): string {
  return `시작 사진은 선언한 시작 시간 ${startTime.slice(0, 5)}:59(한국 시간)까지 촬영한 사진만 인증할 수 있습니다.`;
}

/** 업로드 시각이 아닌 가장 먼저 촬영한 사진을 선언한 시작 시각과 비교한다. */
export function isAfterMorningStartLimit(
  takenAtTimes: number[],
  declaredStartTime: string | null | undefined,
): boolean {
  const limit = timeInSeconds(declaredStartTime);
  if (
    limit === null ||
    takenAtTimes.length === 0 ||
    takenAtTimes.some(
      (time) =>
        !Number.isFinite(time) || Number.isNaN(new Date(time).getTime()),
    )
  )
    return true;

  const startTime = new Date(Math.min(...takenAtTimes));
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: KOREA_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(startTime);
  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  const seconds = value("hour") * 3600 + value("minute") * 60 + value("second");
  // 선언한 시작 분의 마지막 초까지 허용하고, 다음 분부터 거절한다.
  return seconds > Math.floor(limit / 60) * 60 + 59;
}

export function validateMorningPhotos(
  photos: unknown,
  takenAtTimes: unknown,
  declaredStartTime: string | null | undefined,
): string | null {
  if (!declaredStartTime || timeInSeconds(declaredStartTime) === null) {
    return "모닝 리추얼 선언에서 시작 시간을 먼저 설정해주세요.";
  }
  if (
    !Array.isArray(photos) ||
    photos.length !== 2 ||
    photos.some((photo) => typeof photo !== "string" || !photo.trim()) ||
    !Array.isArray(takenAtTimes) ||
    takenAtTimes.length !== 2 ||
    takenAtTimes.some(
      (time) =>
        typeof time !== "number" ||
        !Number.isFinite(time) ||
        Number.isNaN(new Date(time).getTime()),
    )
  ) {
    return "촬영 시간을 확인할 수 있는 시작 사진과 종료 사진을 다시 업로드해주세요.";
  }
  if (isAfterMorningStartLimit(takenAtTimes, declaredStartTime)) {
    return morningStartTimeMessage(declaredStartTime);
  }
  if (Math.abs(takenAtTimes[1] - takenAtTimes[0]) < 30 * 60 * 1000) {
    return "시작 사진과 종료 사진의 촬영 시간은 30분 이상 차이 나야 합니다.";
  }
  return null;
}
