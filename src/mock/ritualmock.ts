import { FeedItem } from "@/types/feed";

// 나의 전체 리추얼 통계
export const myRitualStats = {
  totalRecords: 47,
  currentStreak: 12,
  longestStreak: 23,
  completionRate: 78,
  startDate: "2025-10-01",
};

// 루틴별 개요 통계
export const myRoutineStats = [
  {
    id: "reading",
    name: "독서",
    color: "#6366f1",
    bgColor: "#eef2ff",
    totalDays: 31,
    streak: 12,
    weekActivity: [true, true, true, true, true, true, false],
  },
  {
    id: "exercise",
    name: "운동",
    color: "#ff8900",
    bgColor: "#fff4e5",
    totalDays: 23,
    streak: 5,
    weekActivity: [true, false, true, true, true, false, true],
  },
  {
    id: "morning",
    name: "모닝",
    color: "#eab32e",
    bgColor: "#fefce8",
    totalDays: 20,
    streak: 7,
    weekActivity: [true, true, true, true, true, true, true],
  },
  {
    id: "english",
    name: "영어",
    color: "#0ea5e9",
    bgColor: "#f0f9ff",
    totalDays: 18,
    streak: 3,
    weekActivity: [true, true, false, false, true, false, false],
  },
  {
    id: "finance",
    name: "자산관리",
    color: "#10b981",
    bgColor: "#ecfdf5",
    totalDays: 15,
    streak: 4,
    weekActivity: [true, false, true, true, false, false, false],
  },
];

// 독서 인사이트 - 90일 히트맵 (결정론적 패턴)
const _readingDays = [
  1,1,0,1,1,1,0,
  1,1,1,0,1,1,0,
  1,0,1,1,1,1,0,
  1,1,0,0,1,1,0,
  0,1,1,1,0,1,0,
  1,1,0,1,1,0,0,
  1,1,1,1,0,1,0,
  0,1,1,0,1,1,0,
  1,0,1,1,1,0,0,
  1,1,1,0,1,1,0,
  1,1,0,1,1,1,0,
  1,0,0,1,1,0,0,
  1,1,1,1,0,1,0,
];
const _pageValues = [
  28,32,0,19,35,22,0,
  30,25,40,0,26,33,0,
  22,0,28,32,38,24,0,
  28,32,0,21,30,0,0,
  0,25,34,33,0,28,0,
  35,25,0,29,22,0,0,
  31,28,38,26,0,32,0,
  0,21,37,0,29,25,0,
  26,0,33,28,19,0,0,
  19,25,0,34,33,20,0,
  28,35,0,24,38,22,0,
  20,0,33,28,25,0,0,
  30,37,24,19,0,35,0,
];

export const readingHeatmapData = (() => {
  const data: { date: string; pages: number }[] = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const idx = 89 - i;
    data.push({ date: dateStr, pages: _readingDays[idx] ? (_pageValues[idx] || 25) : 0 });
  }
  return data;
})();

export const readingInsightData = {
  heatmap: readingHeatmapData,
  currentBooks: [
    { title: "원씽", author: "게리 켈러", currentPage: 126, totalPages: 280, color: "#6366f1" },
    { title: "아토믹 해빗", author: "제임스 클리어", currentPage: 89, totalPages: 320, color: "#8b5cf6" },
  ],
  totalSentences: 45,
  totalPages: 2340,
  completedBooks: 3,
};

// 자산관리 인사이트
export const financeInsightData = {
  currentMonth: {
    total: 342000,
    necessary: 198000,
    emotional: 144000,
    categories: [
      { name: "식비", amount: 120000, color: "#f97316", percent: 35 },
      { name: "교통", amount: 45000, color: "#6366f1", percent: 13 },
      { name: "문화생활", amount: 78000, color: "#ec4899", percent: 23 },
      { name: "기타", amount: 99000, color: "#94a3b8", percent: 29 },
    ],
  },
  weeklySpending: [
    { week: "1주", amount: 95000, max: 112000 },
    { week: "2주", amount: 78000, max: 112000 },
    { week: "3주", amount: 112000, max: 112000 },
    { week: "4주", amount: 57000, max: 112000 },
  ],
};

// 운동 인사이트
export const exerciseInsightData = {
  totalMinutes: 1150,
  totalSessions: 23,
  avgMinutes: 50,
  exercises: [
    { name: "필라테스", count: 10, totalMinutes: 500 },
    { name: "달리기", count: 8, totalMinutes: 240 },
    { name: "요가", count: 5, totalMinutes: 410 },
  ],
  last4Weeks: [
    { week: "4주 전", days: 3, max: 5 },
    { week: "3주 전", days: 4, max: 5 },
    { week: "2주 전", days: 5, max: 5 },
    { week: "이번 주", days: 5, max: 5 },
  ],
};

// 모닝 인사이트
export const morningInsightData = {
  avgCondition: 78,
  streak: 7,
  totalDays: 20,
  conditionTrend: [65, 70, 82, 75, 88, 72, 85, 78, 90, 68, 72, 80, 85, 76, 82],
  avgWakeTime: "06:12",
};

// 언어 인사이트
export const languageInsightData = {
  totalExpressions: 156,
  streak: 3,
  totalDays: 18,
  recentExpressions: [
    { word: "pull through", meaning: "어려움을 극복하다" },
    { word: "hit the ground running", meaning: "출발부터 전속력으로" },
    { word: "on the same page", meaning: "같은 의견을 공유하다" },
    { word: "circle back", meaning: "나중에 다시 돌아오다" },
    { word: "take the initiative", meaning: "주도적으로 행동하다" },
    { word: "よろしく お願いします", meaning: "잘 부탁드립니다" },
  ],
};

// 나의 기록 갤러리 (내가 작성한 모든 글)
export const myGalleryRecords: FeedItem[] = [
  {
    id: 201,
    userId: 1,
    userName: "나",
    date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    routineCategory: "독서",
    routineId: 4,
    recordId: 201,
    routineData: {
      bookTitle: "원씽",
      author: "게리 켈러",
      trackingType: "page",
      pagesRead: 126,
      totalPages: 280,
      progressAmount: 24,
      noteType: "sentence",
      note: "한 가지에 집중하는 것이 얼마나 강력한지, 그것이 모든 위대한 성취의 비밀이다.",
      thoughts: "집중이 가져오는 힘에 대한 내용이 인상 깊었다. 나도 매일 하나의 가장 중요한 일에 집중해봐야겠다.",
    },
    comments: [],
  },
  {
    id: 202,
    userId: 1,
    userName: "나",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    routineCategory: "운동",
    routineId: 1,
    recordId: 202,
    routineData: {
      images: [],
      exerciseName: "달리기",
      duration: 30,
      achievement: "5km 완주! 처음으로 쉬지 않고 끝까지 뛰었다. 다음엔 6km 도전해볼 것.",
    },
    comments: [],
  },
  {
    id: 203,
    userId: 1,
    userName: "나",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    routineCategory: "모닝",
    routineId: 5,
    recordId: 203,
    routineData: {
      condition: 82,
      successAndReflection:
        "오늘 아침 5시 30분에 일어났다. 미루지 않고 바로 일어난 것이 오늘의 작은 성공. 아침 루틴을 지키면 하루가 훨씬 활기차다.",
      gift: "좋아하는 카페에서 아메리카노 한 잔 ☕",
    },
    comments: [],
  },
  {
    id: 204,
    userId: 1,
    userName: "나",
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    routineCategory: "영어",
    routineId: 3,
    recordId: 204,
    routineData: {
      images: [],
      achievement: "비즈니스 영어 20문장, 5개 표현 학습",
      expressions: [
        { word: "pull through", meaning: "어려움을 극복하다", example: "We'll pull through this together." },
        { word: "hit the ground running", meaning: "출발부터 전속력으로", example: "She hit the ground running on her first day." },
        { word: "on the same page", meaning: "같은 의견을 공유하다", example: "Let's make sure we're all on the same page." },
      ],
    },
    comments: [],
  },
  {
    id: 205,
    userId: 1,
    userName: "나",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    routineCategory: "독서",
    routineId: 4,
    recordId: 205,
    routineData: {
      bookTitle: "아토믹 해빗",
      author: "제임스 클리어",
      trackingType: "page",
      pagesRead: 89,
      totalPages: 320,
      progressAmount: 32,
      noteType: "sentence",
      note: "매일 1%씩 나아진다면, 일 년이 지나면 37배 더 나은 자신이 되어 있을 것이다.",
      thoughts: "작은 습관이 쌓여서 큰 변화를 만든다는 것을 다시 깨달았다. 오늘도 작은 한 걸음.",
    },
    comments: [],
  },
  {
    id: 206,
    userId: 1,
    userName: "나",
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    routineCategory: "자산관리",
    routineId: 8,
    recordId: 206,
    routineData: {
      dailyExpenses: [
        {
          date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          expenses: [
            { id: "e1", name: "점심 식비", amount: 9000, type: "necessary" },
            { id: "e2", name: "커피", amount: 5500, type: "necessary" },
            { id: "e3", name: "편의점 간식", amount: 3200, type: "emotional" },
          ],
        },
      ],
      studyContent:
        "ETF 투자의 기본 개념을 공부했다. 인덱스 펀드와의 차이점, 수수료 구조에 대해 학습.",
      practice: "오늘부터 커피 1잔으로 줄이기. 불필요한 충동 구매 전 10분 생각하기.",
    },
    comments: [],
  },
  {
    id: 207,
    userId: 1,
    userName: "나",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    routineCategory: "운동",
    routineId: 1,
    recordId: 207,
    routineData: {
      images: [],
      exerciseName: "필라테스",
      duration: 50,
      achievement: "코어 근육이 많이 강해진 것 같다. 처음보다 자세가 훨씬 안정적으로 잡혀서 뿌듯하다!",
    },
    comments: [],
  },
  {
    id: 208,
    userId: 1,
    userName: "나",
    date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    routineCategory: "모닝",
    routineId: 5,
    recordId: 208,
    routineData: {
      condition: 65,
      successAndReflection:
        "어제 늦게 잠들었지만 알람에 바로 일어났다. 의지력이 조금씩 강해지고 있다는 걸 느낀다.",
      gift: "좋아하는 팟캐스트 30분 듣기 🎧",
    },
    comments: [],
  },
  {
    id: 209,
    userId: 1,
    userName: "나",
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    routineCategory: "영어",
    routineId: 3,
    recordId: 209,
    routineData: {
      images: [],
      achievement: "비즈니스 영어 표현 8개 학습, 쉐도잉 15분",
      expressions: [
        { word: "take the initiative", meaning: "주도적으로 행동하다", example: "Don't wait to be asked—take the initiative." },
        { word: "circle back", meaning: "나중에 다시 돌아오다", example: "Let's circle back to this topic later." },
      ],
    },
    comments: [],
  },
  {
    id: 210,
    userId: 1,
    userName: "나",
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    routineCategory: "독서",
    routineId: 4,
    recordId: 210,
    routineData: {
      bookTitle: "원씽",
      author: "게리 켈러",
      trackingType: "page",
      pagesRead: 102,
      totalPages: 280,
      progressAmount: 18,
      noteType: "summary",
      note: "성공한 사람들은 한 가지 일에 집중하는 공통점이 있다. 멀티태스킹은 신화다.",
      thoughts: "오늘은 집중력에 대한 챕터를 읽었다. 딴 생각 없이 하나에만 몰입하는 연습이 필요하다.",
    },
    comments: [],
  },
  {
    id: 211,
    userId: 1,
    userName: "나",
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    routineCategory: "운동",
    routineId: 1,
    recordId: 211,
    routineData: {
      images: [],
      exerciseName: "요가",
      duration: 60,
      achievement: "오늘은 몸이 평소보다 훨씬 유연하게 느껴졌다. 꾸준히 하니까 분명히 달라지고 있다.",
    },
    comments: [],
  },
  {
    id: 212,
    userId: 1,
    userName: "나",
    date: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    routineCategory: "모닝",
    routineId: 5,
    recordId: 212,
    routineData: {
      condition: 90,
      successAndReflection:
        "오늘은 정말 상쾌한 아침이었다. 알람보다 5분 먼저 깼고, 스트레칭까지 했다. 이런 날이 계속됐으면.",
      gift: "산책 30분 + 좋아하는 노래 듣기 🎵",
    },
    comments: [],
  },
];
