import { MidReview } from "@/types/routines/midReview";

export const myMidReview: MidReview | null = null; // 미작성 상태 (테스트 시 아래 객체로 교체)

// 내가 작성 완료한 상태 예시:
// export const myMidReview: MidReview = {
//   id: "my-mid-1",
//   userId: "1",
//   userName: "나",
//   userEmoji: "🌟",
//   routineType: "모닝리추얼",
//   createdAt: "2025-01-12",
//   goodConditions: ["시간대", "컨디션"],
//   goodConditionDetails: {
//     시간대: "오전 6시 기상, 알람 없이 자연스럽게 일어났을 때",
//     컨디션: "전날 11시 전에 잠들어서 몸이 가벼울 때",
//   },
//   hardConditions: ["전날 행동"],
//   hardConditionDetails: {
//     "전날 행동": "전날 술자리나 늦은 야식이 있었을 때 다음 날 무기력",
//   },
//   whyStarted: "하루를 내가 주도적으로 시작하고 싶었어요. 항상 알람에 끌려다니는 게 싫었거든요.",
//   keepDoing: "기상 직후 물 한 잔 마시는 리추얼",
//   willChange: "스트레칭 시간을 5분에서 10분으로 늘리기",
// };

export const challengerMidReviews: MidReview[] = [
  {
    id: "mid-1",
    userId: "2",
    userName: "김지수",
    userEmoji: "🔥",
    routineType: "운동리추얼",
    createdAt: "2025-01-11",
    goodConditions: ["시간대", "습관"],
    goodConditionDetails: {
      시간대: "퇴근 후 바로 헬스장으로 직행할 때, 집에 들르지 않는 게 핵심",
      습관: "운동 전 단백질 바 먹는 리추얼이 신호 역할을 함",
    },
    hardConditions: ["컨디션"],
    hardConditionDetails: {
      컨디션: "수면 부족이나 두통이 있는 날은 동기 자체가 사라짐",
    },
    whyStarted: "작년에 체력이 너무 떨어진 게 느껴졌고, 더 이상 미루면 안 될 것 같았어요.",
    keepDoing: "퇴근 직행 리추얼",
    willChange: "주 5일 → 주 4일로 조정해서 과부하 방지",
  },
  {
    id: "mid-2",
    userId: "3",
    userName: "이민준",
    userEmoji: "📚",
    routineType: "독서리추얼",
    createdAt: "2025-01-10",
    goodConditions: ["장소", "감정"],
    goodConditionDetails: {
      장소: "카페보다 도서관이 훨씬 집중이 잘 됨. 소음의 종류가 다름",
      감정: "마음이 차분하고 특별한 걱정이 없는 날 독서에 깊이 빠짐",
    },
    hardConditions: ["전날 행동"],
    hardConditionDetails: {
      "전날 행동": "전날 유튜브를 2시간 이상 봤으면 다음 날 책이 안 읽힘",
    },
    whyStarted: "매년 독서 목표를 세우고 매년 실패했어요. 이번엔 꼭 습관으로 만들고 싶었습니다.",
    keepDoing: "도서관 정기 방문 (주 3회)",
    willChange: "자기 전 유튜브 시간 30분 제한",
  },
  {
    id: "mid-3",
    userId: "4",
    userName: "박서연",
    userEmoji: "🇺🇸",
    routineType: "영어리추얼",
    createdAt: "2025-01-12",
    goodConditions: ["시간대", "장소"],
    goodConditionDetails: {
      시간대: "점심시간 30분이 의외로 가장 집중이 잘 됨",
      장소: "회사 회의실 예약해서 혼자 있을 때 스피킹 연습이 부끄럽지 않음",
    },
    hardConditions: ["감정"],
    hardConditionDetails: {
      감정: "업무 스트레스가 클 때는 영어 공부가 사치처럼 느껴짐",
    },
    whyStarted: "이직 준비 때문에 영어 면접이 필요해서 시작했어요.",
    keepDoing: "점심 영어 리추얼",
    willChange: "단어 암기 앱 → 실제 문장 만들기 연습으로 전환",
  },
  {
    id: "mid-4",
    userId: "5",
    userName: "최도윤",
    userEmoji: "💰",
    routineType: "자산관리리추얼",
    createdAt: "2025-01-11",
    goodConditions: ["습관", "컨디션"],
    goodConditionDetails: {
      습관: "취침 전 5분 가계부 작성이 자연스럽게 자리잡힘",
      컨디션: "몸 컨디션보다 정서적으로 안정된 날 기록이 더 풍성해짐",
    },
    hardConditions: ["시간대"],
    hardConditionDetails: {
      시간대: "야근이 있는 날은 귀가 시간이 늦어서 기록을 건너뜀",
    },
    whyStarted: "30대가 되면서 노후 준비를 미루면 안 된다는 생각이 강해졌어요.",
    keepDoing: "매일 지출 기록",
    willChange: "월별 리포트 직접 분석하는 시간 추가",
  },
  {
    id: "mid-5",
    userId: "6",
    userName: "한예린",
    userEmoji: "🌍",
    routineType: "제2외국어리추얼",
    createdAt: "2025-01-10",
    goodConditions: ["감정", "전날 행동"],
    goodConditionDetails: {
      감정: "스페인어로 뭔가 표현됐을 때의 쾌감이 동기를 유지시킴",
      "전날 행동": "전날 스페인 드라마 보고 자면 다음 날 공부가 자연스럽게 이어짐",
    },
    hardConditions: ["컨디션"],
    hardConditionDetails: {
      컨디션: "감기나 생리통이 있는 날은 완전히 스킵",
    },
    whyStarted: "내년에 스페인 여행을 혼자 가고 싶어서 시작했어요.",
    keepDoing: "드라마로 청취 연습",
    willChange: "단어장 앱 알림 설정해서 잊지 않기",
  },
  {
    id: "mid-6",
    userId: "7",
    userName: "정현우",
    userEmoji: "✍️",
    routineType: "기록리추얼",
    createdAt: "2025-01-12",
    goodConditions: ["장소", "시간대"],
    goodConditionDetails: {
      장소: "집 책상에서 조명을 따뜻하게 켜고 쓸 때 가장 잘 씀",
      시간대: "밤 10시 이후, 하루 마무리 타이밍",
    },
    hardConditions: ["습관"],
    hardConditionDetails: {
      습관: "다른 앱 먼저 열면 기록 앱까지 못 오는 경우가 많음",
    },
    whyStarted: "기억이 너무 빨리 흐릿해지는 게 아쉬웠고, 나만의 아카이브를 갖고 싶었어요.",
    keepDoing: "취침 전 10분 기록 타임",
    willChange: "스마트폰 먼저 충전기에 꽂고 노트 먼저 열기",
  },
  {
    id: "mid-7",
    userId: "8",
    userName: "오지은",
    userEmoji: "📖",
    routineType: "원서읽기리추얼",
    createdAt: "2025-01-11",
    goodConditions: ["컨디션", "감정"],
    goodConditionDetails: {
      컨디션: "뇌가 맑은 오전에 원서가 훨씬 잘 읽힘",
      감정: "성취감이 쌓일수록 더 읽고 싶어짐. 복리 효과 같음",
    },
    hardConditions: ["장소"],
    hardConditionDetails: {
      장소: "지하철에서 읽으려 했는데 흔들려서 집중이 안 됨",
    },
    whyStarted: "번역본으로는 뉘앙스가 사라지는 느낌이 싫었고, 원작을 즐기고 싶었어요.",
    keepDoing: "오전 독서 리추얼",
    willChange: "지하철 대신 팟캐스트 전환, 원서는 집에서만",
  },
];
