// 샘플 투두 데이터 (날짜별)
const mock_todo: Record<
  string,
  { id: number; title: string; completed: boolean }[]
> = {
  "2026-01-19": [
    { id: 1, title: "주간 회의 참석", completed: true },
    { id: 2, title: "이메일 정리", completed: false },
  ],
  "2026-01-20": [
    { id: 3, title: "프로젝트 기획서 작성", completed: false },
    { id: 4, title: "디자인 시안 검토", completed: true },
  ],
  "2026-01-21": [
    { id: 5, title: "API 연동 테스트", completed: false },
    { id: 6, title: "코드 리뷰", completed: false },
    { id: 7, title: "문서화 작업", completed: true },
  ],
  "2026-01-22": [{ id: 8, title: "배포 준비", completed: false }],
  "2026-01-23": [
    { id: 9, title: "QA 테스트", completed: false },
    { id: 10, title: "버그 수정", completed: false },
  ],
};

export default mock_todo;
