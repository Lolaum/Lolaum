import { RoutineType } from "@/types/routines/declaration";

export interface DeclarationQuestion {
  id: string;
  label: string;
  placeholder: string;
}

export const declarationQuestions: Record<RoutineType, DeclarationQuestion[]> = {
  모닝리추얼: [
    {
      id: "expected_change",
      label: "기대하는 변화",
      placeholder: "모닝리추얼을 통해 기대하는 변화를 작성해주세요",
    },
    {
      id: "timetable",
      label: "타임테이블 (6:00–6:30)",
      placeholder: "6:00 기상, 6:05 물 한 잔, 6:10 스트레칭...",
    },
    {
      id: "sleep_goal",
      label: "목표 취침 시간 & 전날 준비할 것",
      placeholder: "예) 11시 취침, 전날 옷 미리 꺼내두기",
    },
    {
      id: "cert_method",
      label: "인증 방법",
      placeholder: "예) 기상 직후 셀카, 타임테이블 체크리스트 캡처",
    },
  ],
  운동리추얼: [
    {
      id: "expected_change",
      label: "기대하는 변화",
      placeholder: "운동리추얼을 통해 기대하는 변화를 작성해주세요",
    },
    {
      id: "ritual_time",
      label: "운동 리추얼 시간",
      placeholder: "예) 매일 오전 7시 30분, 30분간",
    },
    {
      id: "this_month_exercise",
      label: "이번 달의 운동",
      placeholder: "예) 스쿼트 30개 + 플랭크 1분 + 런닝 2km",
    },
    {
      id: "cert_method",
      label: "인증 방법",
      placeholder: "예) 운동 후 땀 사진, 운동 앱 기록 캡처",
    },
  ],
  독서리추얼: [
    {
      id: "expected_change",
      label: "기대하는 변화",
      placeholder: "독서리추얼을 통해 기대하는 변화를 작성해주세요",
    },
    {
      id: "ritual_time",
      label: "독서 리추얼 시간",
      placeholder: "예) 매일 밤 10시, 20분간",
    },
    {
      id: "this_month_book",
      label: "이번 달의 책 (권수/분량 자율)",
      placeholder: "예) 아주 작은 습관의 힘 1권 완독",
    },
    {
      id: "cert_method",
      label: "인증 방법",
      placeholder: "예) 읽은 페이지와 함께 책 사진 인증",
    },
  ],
  영어리추얼: [
    {
      id: "expected_change",
      label: "기대하는 변화",
      placeholder: "영어리추얼을 통해 기대하는 변화를 작성해주세요",
    },
    {
      id: "ritual_time",
      label: "영어 리추얼 시간",
      placeholder: "예) 매일 출근 전 7시, 15분간",
    },
    {
      id: "this_month_study",
      label: "이번 달의 영어공부 / 채널",
      placeholder: "예) 유튜브 영어공부 채널 'English with Lucy' 매일 1강",
    },
    {
      id: "cert_method",
      label: "인증 방법",
      placeholder: "예) 오늘 배운 표현 3개 캡처 인증",
    },
  ],
  제2외국어리추얼: [
    {
      id: "target_language",
      label: "도전할 제2외국어",
      placeholder: "예) 일본어, 스페인어, 중국어",
    },
    {
      id: "expected_change",
      label: "기대하는 변화",
      placeholder: "제2외국어 리추얼을 통해 기대하는 변화를 작성해주세요",
    },
    {
      id: "ritual_time",
      label: "제2외국어 리추얼 시간",
      placeholder: "예) 매일 점심 12시, 10분간",
    },
    {
      id: "this_month_study",
      label: "이번 달의 공부 / 채널",
      placeholder: "예) Duolingo 일본어 매일 1레슨",
    },
    {
      id: "cert_method",
      label: "인증 방법",
      placeholder: "예) Duolingo 완료 화면 캡처",
    },
  ],
  기록리추얼: [
    {
      id: "expected_change",
      label: "기대하는 변화",
      placeholder: "기록리추얼을 통해 기대하는 변화를 작성해주세요",
    },
    {
      id: "ritual_time",
      label: "기록 리추얼 시간",
      placeholder: "예) 매일 밤 11시, 20분간",
    },
    {
      id: "this_month_goal",
      label: "이번 달 기록 목표",
      placeholder: "예) 매일 일기 쓰기, 주 2회 블로그 포스팅",
    },
    {
      id: "topic_list",
      label: "3주치 목차 / 주제 리스트업 (최소 9개)",
      placeholder: "1. 나의 아침 루틴\n2. 독서 후기\n3. ...",
    },
    {
      id: "cert_method",
      label: "인증 방법",
      placeholder: "예) 작성한 글의 링크 또는 캡처 공유",
    },
  ],
  자산관리리추얼: [
    {
      id: "expected_change",
      label: "기대하는 변화",
      placeholder: "자산관리리추얼을 통해 기대하는 변화를 작성해주세요",
    },
    {
      id: "ritual_time",
      label: "자산관리 리추얼 시간",
      placeholder: "예) 매일 저녁 9시, 10분간",
    },
    {
      id: "ritual_method",
      label: "리추얼 방법 (소비 항목 작성 + 자산관리 공부)",
      placeholder: "예) 가계부 앱으로 지출 기록 후 유튜브 경제 채널 1편 시청",
    },
    {
      id: "this_month_goal",
      label: "이번 달 자산관리 목표 (내 의지로 할 수 있는 목표)",
      placeholder: "예) 불필요한 구독 서비스 해지, 커피 지출 주 3회 이하",
    },
    {
      id: "cert_method",
      label: "인증 방법",
      placeholder: "예) 가계부 앱 오늘 기록 캡처",
    },
  ],
  원서읽기리추얼: [
    {
      id: "expected_change",
      label: "기대하는 변화",
      placeholder: "원서읽기리추얼을 통해 기대하는 변화를 작성해주세요",
    },
    {
      id: "ritual_time",
      label: "원서읽기 리추얼 시간",
      placeholder: "예) 매일 오전 8시, 20분간",
    },
    {
      id: "this_month_goal",
      label: "이번 달 원서읽기 목표",
      placeholder: "예) Atomic Habits 50페이지 읽기",
    },
    {
      id: "cert_method",
      label: "인증 방법",
      placeholder: "예) 읽은 페이지와 오늘의 인상 깊은 문장 공유",
    },
  ],
};
