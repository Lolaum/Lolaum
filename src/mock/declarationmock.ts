import { Declaration } from "@/types/routines/declaration";

export const myDeclarations: Declaration[] = [
  {
    id: "my-morning",
    userId: "me",
    userName: "나",
    userEmoji: "🌟",
    routineType: "모닝리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "아침을 활기차게 시작하고 하루 생산성을 높이고 싶어요.",
      },
      {
        questionId: "timetable",
        answer:
          "6:00 기상 → 6:05 물 한 잔 → 6:10 스트레칭 5분 → 6:15 오늘 할 일 3가지 메모 → 6:25 샤워 준비",
      },
      {
        questionId: "sleep_goal",
        answer:
          "목표 취침 11시. 전날 밤에 옷 미리 꺼내두기, 내일 할 일 노트에 적기",
      },
      { questionId: "cert_method", answer: "기상 직후 시계와 함께 셀카 인증" },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "my-reading",
    userId: "me",
    userName: "나",
    userEmoji: "🌟",
    routineType: "독서리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "한 달에 책 한 권 완독하는 독서 습관을 만들고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 밤 10시 30분, 20분간" },
      {
        questionId: "this_month_book",
        answer: "아주 작은 습관의 힘 (제임스 클리어) 완독",
      },
      { questionId: "cert_method", answer: "읽은 페이지와 오늘의 문장 인증" },
    ],
    createdAt: "2026-03-01",
  },
];

export const challengerDeclarations: Declaration[] = [
  // 모닝리추얼 (6명)
  {
    id: "c1",
    userId: "1",
    userName: "민수",
    userEmoji: "🧑",
    routineType: "모닝리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "아침 시간을 활용해 자기계발을 시작하고 싶어요.",
      },
      {
        questionId: "timetable",
        answer: "6:00 기상 → 6:10 명상 5분 → 6:15 일기 쓰기 → 6:25 준비",
      },
      { questionId: "sleep_goal", answer: "10시 30분 취침, 전날 책상 정리" },
      { questionId: "cert_method", answer: "아침 일기 사진 인증" },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c2",
    userId: "2",
    userName: "지은",
    userEmoji: "🧑",
    routineType: "모닝리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "여유 있는 아침으로 하루를 긍정적으로 시작하고 싶어요.",
      },
      {
        questionId: "timetable",
        answer:
          "6:00 기상 → 6:05 레몬 물 → 6:10 요가 10분 → 6:20 오늘 감사 3가지 기록",
      },
      { questionId: "sleep_goal", answer: "11시 취침, 핸드폰 멀리 두고 자기" },
      { questionId: "cert_method", answer: "아침 요가 매트 사진 인증" },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c3",
    userId: "3",
    userName: "현우",
    userEmoji: "🧑",
    routineType: "모닝리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "집중력 향상과 하루 계획을 명확히 세우고 싶어요.",
      },
      {
        questionId: "timetable",
        answer: "6:00 기상 → 6:10 독서 15분 → 6:25 하루 계획 노트 작성",
      },
      {
        questionId: "sleep_goal",
        answer: "11시 30분 취침, 자기 전 다음날 할 일 3가지 적기",
      },
      { questionId: "cert_method", answer: "하루 계획 노트 캡처 인증" },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c4",
    userId: "4",
    userName: "서연",
    userEmoji: "🧑",
    routineType: "모닝리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "아침 리추얼으로 멘탈을 강화하고 싶어요.",
      },
      {
        questionId: "timetable",
        answer: "6:00 기상 → 6:05 따뜻한 물 → 6:10 저널링 10분 → 6:20 샤워",
      },
      { questionId: "sleep_goal", answer: "10시 취침, 자기 전 내일 옷 준비" },
      { questionId: "cert_method", answer: "저널 페이지 사진 인증" },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c5",
    userId: "5",
    userName: "태희",
    userEmoji: "🧑",
    routineType: "모닝리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "아침형 인간으로 변화해 하루를 길게 쓰고 싶어요.",
      },
      {
        questionId: "timetable",
        answer: "6:00 기상 → 6:10 스트레칭 → 6:15 영어 팟캐스트 15분",
      },
      {
        questionId: "sleep_goal",
        answer: "11시 취침, 블루라이트 차단 안경 착용",
      },
      { questionId: "cert_method", answer: "기상 시각 알람 화면 캡처" },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c6",
    userId: "6",
    userName: "준호",
    userEmoji: "🧑",
    routineType: "모닝리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "아침마다 목표를 상기하며 동기부여를 받고 싶어요.",
      },
      {
        questionId: "timetable",
        answer: "6:00 기상 → 6:05 비전보드 보기 → 6:10 간단 운동 → 6:20 준비",
      },
      { questionId: "sleep_goal", answer: "10시 30분 취침, 수면 앱으로 기록" },
      { questionId: "cert_method", answer: "기상 후 비전보드 사진 인증" },
    ],
    createdAt: "2026-03-01",
  },
  // 운동리추얼 (5명)
  {
    id: "c7",
    userId: "3",
    userName: "현우",
    userEmoji: "🧑",
    routineType: "운동리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "체력을 키우고 꾸준한 운동 습관을 만들고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 오전 7시, 30분간" },
      {
        questionId: "this_month_exercise",
        answer: "스쿼트 50개 + 팔굽혀펴기 30개 + 런닝 3km",
      },
      { questionId: "cert_method", answer: "운동 후 러닝 앱 기록 캡처" },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c8",
    userId: "7",
    userName: "수빈",
    userEmoji: "🧑",
    routineType: "운동리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "다이어트보다 건강한 몸을 만드는 게 목표예요.",
      },
      { questionId: "ritual_time", answer: "매일 저녁 7시, 40분간" },
      {
        questionId: "this_month_exercise",
        answer: "홈트 유튜브 따라하기 + 플랭크 1분",
      },
      { questionId: "cert_method", answer: "운동 완료 후 땀 사진 인증" },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c9",
    userId: "1",
    userName: "민수",
    userEmoji: "🧑",
    routineType: "운동리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "꾸준히 운동해서 체력과 자신감을 높이고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 오전 6시 30분, 20분간" },
      {
        questionId: "this_month_exercise",
        answer: "점핑잭 100개 + 버피 20개 + 코어 운동",
      },
      { questionId: "cert_method", answer: "운동 앱 완료 화면 캡처" },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c10",
    userId: "8",
    userName: "동현",
    userEmoji: "🧑",
    routineType: "운동리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "앉아있는 시간이 많아서 허리와 체력을 개선하고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 점심 12시, 15분간" },
      {
        questionId: "this_month_exercise",
        answer: "스트레칭 리추얼 + 걷기 30분",
      },
      { questionId: "cert_method", answer: "만보기 앱 걸음 수 캡처" },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c11",
    userId: "5",
    userName: "태희",
    userEmoji: "🧑",
    routineType: "운동리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "근력을 키워 체형을 바꾸고 싶어요.",
      },
      { questionId: "ritual_time", answer: "주 5회 오후 6시, 45분간" },
      {
        questionId: "this_month_exercise",
        answer: "헬스장 상체/하체 분할 운동",
      },
      {
        questionId: "cert_method",
        answer: "헬스장 체크인 또는 운동 기록 캡처",
      },
    ],
    createdAt: "2026-03-01",
  },
  // 독서리추얼 (6명)
  {
    id: "c12",
    userId: "4",
    userName: "서연",
    userEmoji: "🧑",
    routineType: "독서리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "다양한 분야의 지식을 쌓고 사고를 넓히고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 점심 12시 30분, 15분간" },
      { questionId: "this_month_book", answer: "돈의 심리학 완독" },
      { questionId: "cert_method", answer: "읽은 분량과 인상 깊은 구절 공유" },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c13",
    userId: "2",
    userName: "지은",
    userEmoji: "🧑",
    routineType: "독서리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "독서를 통해 내면의 성장과 감수성을 키우고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 밤 11시, 20분간" },
      { questionId: "this_month_book", answer: "채식주의자 (한강) 완독" },
      { questionId: "cert_method", answer: "책 페이지 사진 + 한 줄 소감 인증" },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c14",
    userId: "6",
    userName: "준호",
    userEmoji: "🧑",
    routineType: "독서리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "경제/투자 지식을 쌓아 재테크에 활용하고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 출퇴근 지하철, 각 10분씩" },
      { questionId: "this_month_book", answer: "부의 추월차선 완독" },
      { questionId: "cert_method", answer: "독서 앱 기록 스크린샷 인증" },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c15",
    userId: "8",
    userName: "동현",
    userEmoji: "🧑",
    routineType: "독서리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "집중력을 키우고 책 읽는 즐거움을 되찾고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 저녁 9시, 30분간" },
      { questionId: "this_month_book", answer: "사피엔스 절반 읽기" },
      { questionId: "cert_method", answer: "오늘의 인상 깊은 문장 캡처 공유" },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c16",
    userId: "7",
    userName: "수빈",
    userEmoji: "🧑",
    routineType: "독서리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "삶의 통찰을 얻고 글쓰기 실력도 키우고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 아침 7시, 10분간" },
      {
        questionId: "this_month_book",
        answer: "어떻게 살 것인가 (유시민) 완독",
      },
      {
        questionId: "cert_method",
        answer: "책 귀퉁이 표시한 페이지 사진 인증",
      },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c17",
    userId: "3",
    userName: "현우",
    userEmoji: "🧑",
    routineType: "독서리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "기술 서적을 꾸준히 읽어 실무 역량을 높이고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 저녁 10시, 20분간" },
      {
        questionId: "this_month_book",
        answer: "클린 코드 (로버트 마틴) 3장까지",
      },
      { questionId: "cert_method", answer: "읽은 챕터 + 배운 점 한 줄 공유" },
    ],
    createdAt: "2026-03-01",
  },
  // 영어리추얼 (5명)
  {
    id: "c18",
    userId: "5",
    userName: "태희",
    userEmoji: "🧑",
    routineType: "영어리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "영어로 자유롭게 소통할 수 있는 기반을 만들고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 출근 전 7시 30분, 15분간" },
      {
        questionId: "this_month_study",
        answer: "팟캐스트 'All Ears English' 매일 1에피소드 듣기",
      },
      { questionId: "cert_method", answer: "오늘 배운 표현 3개 스크린샷 공유" },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c19",
    userId: "1",
    userName: "민수",
    userEmoji: "🧑",
    routineType: "영어리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "영어 이메일을 막힘 없이 쓸 수 있게 되고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 점심 1시, 10분간" },
      {
        questionId: "this_month_study",
        answer: "ChatGPT와 영어 일기 주고받기",
      },
      { questionId: "cert_method", answer: "영어 일기 캡처 인증" },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c20",
    userId: "4",
    userName: "서연",
    userEmoji: "🧑",
    routineType: "영어리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "영어 뉴스를 읽으며 시사 상식도 함께 키우고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 아침 7시, 15분간" },
      {
        questionId: "this_month_study",
        answer: "BBC Learning English 매일 1아티클 읽기",
      },
      {
        questionId: "cert_method",
        answer: "오늘 읽은 기사 제목 + 단어 3개 공유",
      },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c21",
    userId: "2",
    userName: "지은",
    userEmoji: "🧑",
    routineType: "영어리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "해외 여행 때 영어로 당당하게 말하고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 밤 9시, 15분간" },
      {
        questionId: "this_month_study",
        answer: "유튜브 'English with Lucy' 매일 1강 섀도잉",
      },
      { questionId: "cert_method", answer: "섀도잉 완료 체크리스트 캡처" },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c22",
    userId: "8",
    userName: "동현",
    userEmoji: "🧑",
    routineType: "영어리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "영어 원서를 사전 없이 읽을 수 있는 수준을 목표로 해요.",
      },
      { questionId: "ritual_time", answer: "매일 저녁 8시, 20분간" },
      {
        questionId: "this_month_study",
        answer: "단어장 앱으로 매일 단어 20개 암기",
      },
      { questionId: "cert_method", answer: "단어 암기 앱 완료 화면 캡처" },
    ],
    createdAt: "2026-03-01",
  },
  // 제2외국어리추얼 (4명)
  {
    id: "c23",
    userId: "7",
    userName: "수빈",
    userEmoji: "🧑",
    routineType: "제2외국어리추얼",
    answers: [
      { questionId: "target_language", answer: "일본어" },
      {
        questionId: "expected_change",
        answer: "일본 여행 시 기본 회화가 가능한 수준이 되고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 점심 1시, 10분간" },
      {
        questionId: "this_month_study",
        answer: "Duolingo 일본어 매일 1레슨 완료",
      },
      { questionId: "cert_method", answer: "Duolingo 완료 화면 캡처" },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c24",
    userId: "6",
    userName: "준호",
    userEmoji: "🧑",
    routineType: "제2외국어리추얼",
    answers: [
      { questionId: "target_language", answer: "스페인어" },
      {
        questionId: "expected_change",
        answer: "남미 여행을 대비해 기초 스페인어를 익히고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 저녁 8시 30분, 10분간" },
      {
        questionId: "this_month_study",
        answer: "Duolingo 스페인어 + 유튜브 기초 강의 주 3회",
      },
      { questionId: "cert_method", answer: "Duolingo 스트릭 화면 캡처" },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c25",
    userId: "3",
    userName: "현우",
    userEmoji: "🧑",
    routineType: "제2외국어리추얼",
    answers: [
      { questionId: "target_language", answer: "중국어" },
      {
        questionId: "expected_change",
        answer: "비즈니스 중국어 기초를 익혀 업무에 활용하고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 오전 7시 30분, 15분간" },
      { questionId: "this_month_study", answer: "HSK 2급 단어 매일 10개 암기" },
      { questionId: "cert_method", answer: "단어 암기 완료 노트 사진 인증" },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c26",
    userId: "5",
    userName: "태희",
    userEmoji: "🧑",
    routineType: "제2외국어리추얼",
    answers: [
      { questionId: "target_language", answer: "프랑스어" },
      {
        questionId: "expected_change",
        answer: "프랑스 문화와 언어를 배우며 시야를 넓히고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 저녁 9시, 10분간" },
      {
        questionId: "this_month_study",
        answer: "Duolingo 프랑스어 + 발음 연습 유튜브",
      },
      {
        questionId: "cert_method",
        answer: "Duolingo 오늘의 레슨 완료 화면 캡처",
      },
    ],
    createdAt: "2026-03-01",
  },
  // 기록리추얼 (5명)
  {
    id: "c27",
    userId: "2",
    userName: "지은",
    userEmoji: "🧑",
    routineType: "기록리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "글쓰기를 통해 생각을 정리하고 나만의 콘텐츠를 만들고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 밤 11시, 20분간" },
      {
        questionId: "this_month_goal",
        answer: "매일 일기 + 주 2회 브런치 포스팅",
      },
      {
        questionId: "topic_list",
        answer:
          "1. 나의 모닝리추얼\n2. 독서 후기: 채식주의자\n3. 영어 공부법\n4. 여행 에세이\n5. 좋아하는 카페 소개\n6. 이달의 목표 회고\n7. 친구에게 쓰는 편지\n8. 요즘 듣는 음악\n9. 내가 좋아하는 계절",
      },
      { questionId: "cert_method", answer: "작성한 글 링크 또는 캡처 공유" },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c28",
    userId: "4",
    userName: "서연",
    userEmoji: "🧑",
    routineType: "기록리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "하루를 돌아보며 감사함을 찾는 습관을 들이고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 저녁 10시 30분, 15분간" },
      { questionId: "this_month_goal", answer: "감사 일기 매일 3가지 기록" },
      {
        questionId: "topic_list",
        answer:
          "1. 오늘의 감사한 일\n2. 이번 주 잘한 일\n3. 한 달 회고\n4. 좋아하는 사람 이야기\n5. 꿈꾸는 미래\n6. 오늘 배운 것\n7. 힘들었던 순간과 극복\n8. 나에게 쓰는 편지\n9. 버킷리스트",
      },
      { questionId: "cert_method", answer: "감사 일기 노트 페이지 사진 인증" },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c29",
    userId: "1",
    userName: "민수",
    userEmoji: "🧑",
    routineType: "기록리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "개발 공부 내용을 정리하며 블로그를 성장시키고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 밤 10시, 25분간" },
      { questionId: "this_month_goal", answer: "기술 블로그 주 2회 포스팅" },
      {
        questionId: "topic_list",
        answer:
          "1. React 훅 정리\n2. TypeScript 타입 가이드\n3. Next.js 라우팅\n4. Git 협업 방법\n5. 코드 리뷰 문화\n6. 알고리즘 풀이\n7. 사이드 프로젝트 회고\n8. 개발자 독서 후기\n9. 커리어 고민",
      },
      { questionId: "cert_method", answer: "블로그 포스트 링크 공유" },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c30",
    userId: "8",
    userName: "동현",
    userEmoji: "🧑",
    routineType: "기록리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "생각을 글로 표현하는 능력을 키우고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 아침 6시 30분, 15분간" },
      { questionId: "this_month_goal", answer: "모닝 페이지 매일 작성" },
      {
        questionId: "topic_list",
        answer:
          "1. 오늘 하고 싶은 것\n2. 지금 느끼는 감정\n3. 이번 달 목표\n4. 어제 잘한 것\n5. 걱정되는 것\n6. 감사한 사람\n7. 꿈꾸는 장면\n8. 오늘의 다짐\n9. 지금 이 순간",
      },
      { questionId: "cert_method", answer: "모닝 페이지 노트 사진 인증" },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c31",
    userId: "6",
    userName: "준호",
    userEmoji: "🧑",
    routineType: "기록리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "투자 일지를 써서 재테크 실력을 높이고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 저녁 9시 30분, 15분간" },
      {
        questionId: "this_month_goal",
        answer: "투자 일지 + 경제 뉴스 요약 매일 기록",
      },
      {
        questionId: "topic_list",
        answer:
          "1. 오늘 본 경제 뉴스\n2. 보유 종목 현황\n3. 이번 달 지출 분석\n4. 관심 기업 조사\n5. 투자 실수와 배움\n6. 재테크 책 요약\n7. 이달의 저축 목표\n8. 시장 흐름 분석\n9. 내년 재무 계획",
      },
      { questionId: "cert_method", answer: "투자 일지 노트 캡처 공유" },
    ],
    createdAt: "2026-03-01",
  },
  // 자산관리리추얼 (5명)
  {
    id: "c32",
    userId: "6",
    userName: "준호",
    userEmoji: "🧑",
    routineType: "자산관리리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "불필요한 지출을 줄이고 저축 습관을 만들고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 저녁 9시, 15분간" },
      {
        questionId: "ritual_method",
        answer: "뱅크샐러드 앱으로 오늘 지출 기록 + 유튜브 경제 채널 1편",
      },
      {
        questionId: "this_month_goal",
        answer: "월 식비 30만원 이내 유지, 구독 서비스 2개 해지",
      },
      { questionId: "cert_method", answer: "가계부 앱 오늘 기록 캡처" },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c33",
    userId: "1",
    userName: "민수",
    userEmoji: "🧑",
    routineType: "자산관리리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "월급의 30% 이상을 저축하는 습관을 만들고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 밤 10시, 10분간" },
      {
        questionId: "ritual_method",
        answer: "가계부 앱 기록 + 주식 시황 확인",
      },
      {
        questionId: "this_month_goal",
        answer: "비상금 100만원 모으기, 커피 지출 주 3회 이하",
      },
      {
        questionId: "cert_method",
        answer: "저축 계좌 잔액 캡처 (금액 가리고)",
      },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c34",
    userId: "4",
    userName: "서연",
    userEmoji: "🧑",
    routineType: "자산관리리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "소비 패턴을 파악해 알뜰한 소비 습관을 만들고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 저녁 8시, 10분간" },
      {
        questionId: "ritual_method",
        answer: "영수증 정리 + 카카오뱅크 소비 통계 확인",
      },
      {
        questionId: "this_month_goal",
        answer: "충동구매 0건, 외식비 20만원 이하",
      },
      {
        questionId: "cert_method",
        answer: "카카오뱅크 이번 달 소비 그래프 캡처",
      },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c35",
    userId: "7",
    userName: "수빈",
    userEmoji: "🧑",
    routineType: "자산관리리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "재테크에 관심을 갖고 첫 투자를 시작하고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 점심 12시 30분, 10분간" },
      { questionId: "ritual_method", answer: "경제 뉴스 1건 읽기 + 소비 기록" },
      {
        questionId: "this_month_goal",
        answer: "ETF 소액 투자 시작, 경제 용어 30개 익히기",
      },
      {
        questionId: "cert_method",
        answer: "경제 뉴스 읽은 후 한 줄 요약 공유",
      },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c36",
    userId: "3",
    userName: "현우",
    userEmoji: "🧑",
    routineType: "자산관리리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "변동성 장세에서도 흔들리지 않는 투자 원칙을 세우고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 오전 8시, 15분간" },
      {
        questionId: "ritual_method",
        answer: "포트폴리오 점검 + 경제 유튜브 요약 노트",
      },
      {
        questionId: "this_month_goal",
        answer: "장기 투자 종목 3개 리서치, 월 저축률 35% 달성",
      },
      {
        questionId: "cert_method",
        answer: "포트폴리오 현황 캡처 (수익률 가리고)",
      },
    ],
    createdAt: "2026-03-01",
  },
  // 원서읽기리추얼 (5명)
  {
    id: "c37",
    userId: "8",
    userName: "동현",
    userEmoji: "🧑",
    routineType: "원서읽기리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "영어 독해 실력을 높이고 원서 읽기에 자신감을 갖고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 오전 8시, 20분간" },
      { questionId: "this_month_goal", answer: "Atomic Habits 챕터 1~5 읽기" },
      {
        questionId: "cert_method",
        answer: "읽은 페이지 + 오늘의 문장 한 줄 공유",
      },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c38",
    userId: "5",
    userName: "태희",
    userEmoji: "🧑",
    routineType: "원서읽기리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "영어 표현력을 원서를 통해 자연스럽게 늘리고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 점심 12시, 15분간" },
      { questionId: "this_month_goal", answer: "The Alchemist 절반 읽기" },
      {
        questionId: "cert_method",
        answer: "읽은 챕터 + 좋았던 문장 영어로 공유",
      },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c39",
    userId: "2",
    userName: "지은",
    userEmoji: "🧑",
    routineType: "원서읽기리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "영어권 문학의 감성을 원문으로 느끼고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 저녁 10시, 20분간" },
      { questionId: "this_month_goal", answer: "The Little Prince 완독" },
      {
        questionId: "cert_method",
        answer: "오늘 읽은 페이지 사진 + 인상 깊은 문장 공유",
      },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c40",
    userId: "1",
    userName: "민수",
    userEmoji: "🧑",
    routineType: "원서읽기리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "기술 서적을 영어 원서로 읽는 능력을 키우고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 밤 9시 30분, 20분간" },
      {
        questionId: "this_month_goal",
        answer: "Clean Code (영문판) 1~3장 읽기",
      },
      { questionId: "cert_method", answer: "읽은 내용 요약 한 단락 공유" },
    ],
    createdAt: "2026-03-01",
  },
  {
    id: "c41",
    userId: "7",
    userName: "수빈",
    userEmoji: "🧑",
    routineType: "원서읽기리추얼",
    answers: [
      {
        questionId: "expected_change",
        answer: "영어 독서를 습관화해서 IELTS 점수를 높이고 싶어요.",
      },
      { questionId: "ritual_time", answer: "매일 오전 7시 30분, 25분간" },
      {
        questionId: "this_month_goal",
        answer: "Sapiens (영문판) 챕터 1~3 읽기",
      },
      { questionId: "cert_method", answer: "오늘 새로 알게 된 단어 3개 공유" },
    ],
    createdAt: "2026-03-01",
  },
];
