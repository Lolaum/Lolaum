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
    date: getDateBefore(30),
    routineCategory: "독서",
    routineId: 4,
    recordId: 101,
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
    comments: [
      {
        id: 1,
        userId: 2,
        userName: "이서연",
        text: "저도 그 책 읽었어요! 정말 인상 깊은 책이죠 😊",
        date: getDateBefore(20),
      },
      {
        id: 2,
        userId: 3,
        userName: "박지훈",
        text: "매일 꾸준히 읽으시네요 👏",
        date: getDateBefore(10),
      },
    ],
  },
  {
    id: 2,
    userId: 2,
    userName: "이서연",
    date: getDateBefore(120),
    routineCategory: "운동",
    routineId: 1,
    recordId: 102,
    routineData: {
      images: [],
      exerciseName: "필라테스",
      duration: 50,
      achievement: "코어 근육이 많이 강해진 것 같다. 처음보다 자세가 훨씬 안정적으로 잡혀서 뿌듯하다!",
    },
    comments: [
      {
        id: 3,
        userId: 1,
        userName: "김민준",
        text: "50분 필라테스 대단해요!",
        date: getDateBefore(100),
      },
    ],
  },
  {
    id: 3,
    userId: 3,
    userName: "박지훈",
    date: getDateBefore(300),
    routineCategory: "영어",
    routineId: 3,
    recordId: 103,
    routineData: {
      images: [],
      achievement: "20문장, 5개 표현 학습",
      expressions: [
        {
          word: "pull through",
          meaning: "어려움을 극복하다",
          example: "Don't worry, we'll pull through this together.",
        },
        {
          word: "keep up with",
          meaning: "~를 따라가다, 뒤처지지 않다",
          example: "It's hard to keep up with all the new technology.",
        },
        {
          word: "hit the ground running",
          meaning: "출발부터 전속력으로 달리다",
          example: "She hit the ground running on her first day at work.",
        },
      ],
    },
    comments: [
      {
        id: 4,
        userId: 4,
        userName: "최수진",
        text: "pull through는 저도 오늘 처음 배웠어요!",
        date: getDateBefore(280),
      },
      {
        id: 5,
        userId: 1,
        userName: "김민준",
        text: "표현들 정리 너무 깔끔하네요 ✏️",
        date: getDateBefore(250),
      },
    ],
  },
  {
    id: 4,
    userId: 1,
    userName: "김민준",
    date: getDateBefore(1440),
    routineCategory: "운동",
    routineId: 1,
    recordId: 104,
    routineData: {
      images: [],
      exerciseName: "달리기",
      duration: 30,
      achievement: "5km 완주! 처음으로 쉬지 않고 끝까지 뛰었다. 다음엔 6km 도전해볼 것.",
    },
    comments: [],
  },
  {
    id: 5,
    userId: 4,
    userName: "최수진",
    date: getDateBefore(2880),
    routineCategory: "제2외국어",
    routineId: 3,
    recordId: 105,
    routineData: {
      images: [],
      achievement: "일본어 히라가나 복습, 10개 단어 암기",
      expressions: [
        {
          word: "よろしくお願いします",
          meaning: "잘 부탁드립니다",
          example: "はじめまして、よろしくお願いします。",
        },
        {
          word: "頑張ります (がんばります)",
          meaning: "열심히 하겠습니다",
          example: "明日のテストに向けて頑張ります。",
        },
      ],
    },
    comments: [
      {
        id: 6,
        userId: 3,
        userName: "박지훈",
        text: "일본어도 공부하시는군요! 멋있어요 🎌",
        date: getDateBefore(2800),
      },
    ],
  },
  {
    id: 6,
    userId: 2,
    userName: "이서연",
    date: getDateBefore(4320),
    routineCategory: "모닝",
    routineId: 5,
    recordId: 106,
    routineData: {
      condition: 82,
      successAndReflection:
        "오늘 아침 5시 30분에 일어났다. 미루지 않고 바로 일어난 것이 오늘의 작은 성공. 아침 루틴을 지키면 하루가 훨씬 활기차다.",
      gift: "좋아하는 카페에서 아메리카노 한 잔 ☕",
    },
    comments: [
      {
        id: 7,
        userId: 1,
        userName: "김민준",
        text: "5시 30분이요?! 정말 대단해요 🌅",
        date: getDateBefore(4300),
      },
      {
        id: 8,
        userId: 4,
        userName: "최수진",
        text: "저도 아침형 인간이 되고 싶은데.. 자극받아요!",
        date: getDateBefore(4200),
      },
    ],
  },
  {
    id: 7,
    userId: 3,
    userName: "박지훈",
    date: getDateBefore(5760),
    routineCategory: "제2외국어",
    routineId: 6,
    recordId: 107,
    routineData: {
      images: [],
      achievement: "스페인어 기초 회화 15문장 연습",
      expressions: [
        {
          word: "¿Cómo estás?",
          meaning: "잘 지내나요?",
          example: "¡Hola! ¿Cómo estás hoy?",
        },
        {
          word: "Mucho gusto",
          meaning: "만나서 반갑습니다",
          example: "Mucho gusto, me llamo Jihun.",
        },
      ],
    },
    comments: [],
  },
  {
    id: 8,
    userId: 4,
    userName: "최수진",
    date: getDateBefore(7200),
    routineCategory: "자산관리",
    routineId: 8,
    recordId: 108,
    routineData: {
      dailyExpenses: [
        {
          date: new Date(Date.now() - 7200 * 60000).toISOString().split("T")[0],
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
    comments: [
      {
        id: 9,
        userId: 2,
        userName: "이서연",
        text: "ETF 공부 저도 해봐야겠어요! 어디서 공부하셨어요?",
        date: getDateBefore(7100),
      },
    ],
  },
];

export default feed_mock;
