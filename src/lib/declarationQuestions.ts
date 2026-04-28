import { RoutineType } from "@/types/routines/declaration";

export interface DeclarationQuestion {
  id: string;
  label: string;
  description?: string;
  placeholder?: string;
  readOnly?: boolean;
  defaultValue?: string;
  isConfirmation?: boolean;
}

export const declarationQuestions: Record<RoutineType, DeclarationQuestion[]> =
  {
    모닝리추얼: [
      {
        id: "expected_change",
        label: "기대하는 변화",
        description:
          "모닝 리추얼을 통해 '어떤 사람'이 되고 싶은가를 작성해주세요.",
        placeholder:
          "내가 주도하는 아침 시간을 통해 긍정적인 자신감으로 하루를 시작할 수 있는 사람 ",
      },
      {
        id: "timetable",
        label: "타임테이블 (6:00-6:30 or 7:00-7:30)",
        placeholder:
          "5:50 - 6:00 물 마시기 -> 6:00 - 6:15 15분 스트레칭 -> 6:15-6:30 독서",
      },
      {
        id: "sleep_goal",
        label: "목표 취침 시간 & 전날 자기 전 준비할 것들",
        description:
          "아침을 수월하게 시작하기 위해 전날 밤 챙길 일과 취침 시간을 적어주세요.\n'최소 7시간 수면 시간 확보 필수",
        placeholder: "예) 11시 취침, 전날 옷 미리 꺼내두기",
      },
      {
        id: "cert_method",
        label: "리추얼 인증 방법을 확인해주세요",
        description: "*챌린저 모두 동일",
        readOnly: true,
        isConfirmation: true,
        defaultValue: `1. 시작인증: 리더가 정각에 한번에 사진촬영 (출석체크)
2. 종료인증: 오늘의 모닝리추얼 완료 사진 (내가 아침 시간을 계획한대로 보낼 수 있는 종료 인증 사진 생각해보기)`,
      },
    ],
    운동리추얼: [
      {
        id: "expected_change",
        label: "기대하는 변화",
        description:
          "운동리추얼을 통해 '어떤 사람'이 되고 싶은가를 작성해주세요.",
        placeholder:
          "운동을 즐기며, 목표한 것을 결과로 만들어내는 자신감 있는 사람",
      },
      {
        id: "ritual_time",
        label: "운동 리추얼 시간",
        placeholder: "예) 매일 오전 7시 30분, 30분간",
      },
      {
        id: "this_month_exercise",
        label: "이번 달의 운동",
        description:
          "이번 달 동안 반복할 운동 종류와 강도·세트를 구체적으로 적어주세요.",
        placeholder:
          "- 주 3회 헬스(유산소 30 근력 30)\n- 주 2회 러닝(50분 달리기 목표)",
      },
      {
        id: "cert_method",
        label: "리추얼 인증 방법을 확인해주세요",
        description: "*챌린저 모두 동일",
        readOnly: true,
        isConfirmation: true,
        defaultValue: `1. 시작인증: 운동 시작 인증샷
2. 종료인증: 운동 종료 인증샷 (내가 운동을 할 수밖에 없는 시작/종료 인증 사진 생각해보기)`,
      },
    ],
    독서리추얼: [
      {
        id: "expected_change",
        label: "기대하는 변화",
        description:
          "이번 달 독서를 통해 '어떤 사람'이 되고 싶은가를 작성해주세요.",
        placeholder:
          "독서를 통해 얻은 인사이트를 실제 일과 삶에 적용할 수 있는 사람",
      },
      {
        id: "ritual_time",
        label: "독서 리추얼 시간",
        placeholder: "오전 7:00-7:10",
      },
      {
        id: "this_month_book",
        label: "이번 달의 책 (권수/분량 자율)",
        description: "이번 달에 읽을 책을 구체적으로 정해주세요.",
        placeholder: "예) 아주 작은 습관의 힘 1권 완독",
      },
      {
        id: "cert_method",
        label: "리추얼 인증 방법을 확인해주세요",
        description: "*챌린저 모두 동일",
        readOnly: true,
        isConfirmation: true,
        defaultValue: `1. 시작인증: 독서 시작 첫 페이지 사진(쪽수 보이게)
2. 종료인증: 독서 종료 페이지 사진(쪽수 보이게)`,
      },
    ],
    영어리추얼: [
      {
        id: "expected_change",
        label: "기대하는 변화",
        description:
          "영어공부를 통해 '어떤 사람'이 되고 싶은가를 작성해주세요.",
        placeholder: "꾸준히 영어 회화를 연습하는 사람",
      },
      {
        id: "ritual_time",
        label: "영어 리추얼 시간",
        placeholder: "오후 8:10-8:20",
      },
      {
        id: "this_month_study",
        label: "이번 달의 영어공부 / 채널",
        description: "이번 달에 사용할 학습 자료나 강의·채널을 정해주세요.",
        placeholder: "예) 미드 프렌즈 셰도잉 (쿠팡플레이)",
      },
      {
        id: "cert_method",
        label: "리추얼 인증 방법을 확인해주세요",
        description: "*챌린저 모두 동일",
        readOnly: true,
        isConfirmation: true,
        defaultValue: `1. 시작인증: 영어 학습 시작 화면/노트/교재 등
2. 종료인증: 오늘 공부한 내용이 보이는 화면/노트/교재 사진`,
      },
    ],
    제2외국어리추얼: [
      {
        id: "target_language",
        label: "도전할 제2외국어",
        placeholder: "예) 스페인어",
      },
      {
        id: "expected_change",
        label: "기대하는 변화",
        description:
          "제2외국어 공부를 통해 '어떤 사람'이 되고 싶은가를 작성해주세요.",
        placeholder: "번역기 없이 스페인언어권을 여행할 수 있는 사람",
      },
      {
        id: "ritual_time",
        label: "제2외국어 리추얼 시간",
        placeholder: "오후 8:20-8:30",
      },
      {
        id: "this_month_study",
        label: "이번 달의 공부 / 채널",
        placeholder: "예) Duolingo 스페인어 매일 1레슨",
      },
      {
        id: "cert_method",
        label: "리추얼 인증 방법을 확인해주세요",
        description: "*챌린저 모두 동일",
        readOnly: true,
        isConfirmation: true,
        defaultValue: `1. 시작인증: 제2외국어 학습 시작 화면/노트/교재 등
2. 종료인증: 오늘 공부한 내용이 보이는 화면/노트/교재 사진`,
      },
    ],
    기록리추얼: [
      {
        id: "expected_change",
        label: "기대하는 변화",
        description:
          "꾸준한 기록을 통해 '어떤 사람'이 되고 싶은가를 작성해주세요.",
        placeholder:
          "문장으로 나와 타인의 삶에 긍정적인 영향을 줄 수 있는 사람",
      },
      {
        id: "ritual_time",
        label: "기록 리추얼 시간",
        placeholder: "오전 9:00-9:30",
      },
      {
        id: "this_month_goal",
        label: "이번 달 기록 목표",
        description:
          "*미리 목차 리스트업을 해두면 3주간 글쓰기에 대한 부담이 훨씬 줄어듭니다.\n*추후 주제가 변경되어도 괜찮습니다.\n*일기 형식으로 쓰시는 분들은 주제를 모두 작성해두지 않으셔도 됩니다.",
        placeholder: "예) 매일 일기 쓰기, 주 2회 블로그 포스팅",
      },
      {
        id: "topic_list",
        label: "3주치 목차 / 주제 리스트업 (최소 9개)",
        description:
          "3주 동안 매일 작성할 주제를 최소 9개 이상 미리 준비해주세요.",
        placeholder: "1. 나의 아침 리추얼\n2. 독서 후기\n3. ...",
      },
      {
        id: "cert_method",
        label: "리추얼 인증 방법을 확인해주세요",
        description: "*챌린저 모두 동일",
        readOnly: true,
        isConfirmation: true,
        defaultValue: `1. 시작인증 없음
2. 종료인증: 작성한 글 링크 첨부`,
      },
    ],
    자산관리리추얼: [
      {
        id: "expected_change",
        label: "기대하는 변화",
        description:
          "꾸준한 자산관리를 통해 '어떤 사람'이 되고 싶은가를 작성해주세요.",
        placeholder:
          "돈을 제대로 모으고 다룰 줄 알게 되어 필요한 곳에 나누고 베푸는 것에 충분한 자유가 있는 사람",
      },
      {
        id: "ritual_time",
        label: "자산관리 리추얼 시간",
        placeholder: "예) 오전 7:10-7:20",
      },
      {
        id: "ritual_method",
        label: "자산 관리 공부 방법",
        description: "소비 항목 작성+자산관리 공부",
        placeholder: "예) 전날 소비 항목 작성 5분\n유튜브 김짠부 영상 5분",
      },
      {
        id: "this_month_goal",
        label: "이번 달 자산관리 목표",
        description:
          "*투자 수익률 00%과 같은 목표가 아닌,내 의지로 할 수있는 목표로 작성해주세요.",
        placeholder:
          "예) 내 주요 고정비 & 생활비 구조와 주로 후회가 남는 소비 파악하기",
      },
      {
        id: "cert_method",
        label: "리추얼 인증 방법을 확인해주세요",
        description: "*챌린저 모두 동일",
        readOnly: true,
        isConfirmation: true,
        defaultValue: `1. 시작인증: 오늘의 자산관리 공부 시작 화면/노트/책 등 사진
2. 종료인증: 오늘의 자산관리 공부 완료 사진`,
      },
    ],
    원서읽기리추얼: [
      {
        id: "expected_change",
        label: "기대하는 변화",
        description:
          "꾸준한 원서읽기를 통해 '어떤 사람'이 되고 싶은가를 작성해주세요.",
        placeholder:
          "원서를 꾸준히 읽으며, 영어 독해력과 어휘력이 향상되어 영어로 된 다양한 자료를 부담 없이 즐길 수 있는 사람",
      },
      {
        id: "ritual_time",
        label: "원서읽기 리추얼 시간",
        placeholder: "예) 오전 6:30-7:00",
      },
      {
        id: "this_month_goal",
        label: "이번 달 원서읽기 목표",
        description:
          "이번 원서읽기 리추얼을 통해 어떤 경험을 만들고 싶은지를 구체적으로 작성해주세요.",
        placeholder: "예) 원서 한 권을 깊게 완독하는 경험",
      },
      {
        id: "cert_method",
        label: "리추얼 인증 방법을 확인해주세요",
        description: "*챌린저 모두 동일",
        readOnly: true,
        isConfirmation: true,
        defaultValue: `1. 시작인증 없음
2. 종료인증: 구글 클래스룸 오늘의 질문에 답변 후 '제출 완료' 화면 캡쳐`,
      },
    ],
  };
