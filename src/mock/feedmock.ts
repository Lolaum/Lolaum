import { FeedItem } from "@/types/feed";

// 현재 시간을 기준으로 과거 시간 계산 함수
const getDateBefore = (minutes: number): string => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
  return date.toISOString();
};

// 샘플 피드 데이터
export const feed_mock: FeedItem[] = [
  {
    id: 1,
    userId: 1,
    userName: "김민준",
    date: getDateBefore(30), // 30분 전
    routineCategory: "독서",
    routineId: 4,
    recordId: 101,
  },
  {
    id: 2,
    userId: 2,
    userName: "이서연",
    date: getDateBefore(120), // 2시간 전
    routineCategory: "운동",
    routineId: 1,
    recordId: 102,
  },
  {
    id: 3,
    userId: 3,
    userName: "박지훈",
    date: getDateBefore(300), // 5시간 전
    routineCategory: "영어",
    routineId: 3,
    recordId: 103,
  },
  {
    id: 4,
    userId: 1,
    userName: "김민준",
    date: getDateBefore(1440), // 1일 전
    routineCategory: "운동",
    routineId: 1,
    recordId: 104,
  },
  {
    id: 5,
    userId: 4,
    userName: "최수진",
    date: getDateBefore(2880), // 2일 전
    routineCategory: "영어",
    routineId: 3,
    recordId: 105,
  },
  {
    id: 6,
    userId: 2,
    userName: "이서연",
    date: getDateBefore(4320), // 3일 전
    routineCategory: "모닝",
    routineId: 5,
    recordId: 106,
  },
  {
    id: 7,
    userId: 3,
    userName: "박지훈",
    date: getDateBefore(5760), // 4일 전
    routineCategory: "언어",
    routineId: 6,
    recordId: 107,
  },
  {
    id: 8,
    userId: 4,
    userName: "최수진",
    date: getDateBefore(7200), // 5일 전
    routineCategory: "자산관리",
    routineId: 8,
    recordId: 108,
  },
];

export default feed_mock;
