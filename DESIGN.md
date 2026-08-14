# Design

## Source of truth

- Status: Active
- Last refreshed: 2026-08-14
- Primary product surfaces: 홈, 리추얼 기록, 인증 게시글, 리추얼 진행표
- Evidence reviewed: `src/components/Progress/ProgressContainer.tsx`, `src/components/Feed/ReactionBar.tsx`, `src/api/feed-reaction.ts`, `src/components/Layout/LayoutShell.tsx`, `src/app/globals.css`

## Brand

- Personality: 따뜻하고 응원하는 리추얼 커뮤니티
- Trust signals: 실제 기록 기반 수치, 명확한 날짜와 상태, 과장 없는 안내
- Avoid: 경쟁을 과도하게 자극하는 순위 표현, 실패를 비난하는 문구, 새로운 시각 체계의 무분별한 추가

## Product goals

- Goals: 참여자가 자신의 누적 현황과 날짜별 멤버 인증 여부를 빠르게 확인한다.
- Non-goals: 관리자용 상세 감사 로그, 멤버 간 순위 경쟁, 인증 기록 내용의 중복 노출
- Success signals: 진행표에서 두 번 이내의 조작으로 특정 날짜의 완료 멤버를 확인한다.

## Personas and jobs

- Primary personas: 리추얼 챌린지 참여자와 운영자
- User jobs: 누적 기부금 확인, 오늘 인증한 멤버 확인, 이전 날짜의 인증 현황 확인
- Key contexts of use: 모바일에서 매일 짧게 확인하며 데스크톱에서도 동일 기능 사용

## Information architecture

- Primary navigation: 기존 `리추얼 진행표` 메뉴 유지
- Core routes/screens: `/progress` 안에서 `기부금 현황`과 `일일 인증` 탭 제공
- Content hierarchy: 페이지 제목 → 탭 → 날짜/요약 → 완료/미완료 멤버 목록

## Design principles

- 한 화면에는 한 판단만 요구한다: 누적 현황과 일일 현황을 탭으로 분리한다.
- 상태는 색상과 텍스트를 함께 사용한다: 완료/미완료를 아이콘·배지·문구로 중복 표현한다.
- Tradeoffs: 별도 라우트보다 같은 페이지 탭을 사용해 탐색 비용을 줄인다.

## Visual language

- Color: 기존 골드 진행도, 완료는 초록, 미완료는 중립 회색 사용
- Typography: 기존 Tailwind 크기와 굵기 체계 유지
- Spacing/layout rhythm: `max-w-2xl`, 4 단위 패딩, 2xl 카드 반경 유지
- Shape/radius/elevation: 기존 흰색 카드와 얕은 그림자 재사용
- Motion: 탭과 상태 전환에 짧은 색상 전환만 사용
- Imagery/iconography: `lucide-react` 아이콘과 기존 프로필 아바타 재사용

## Components

- Existing components to reuse: `Avatar`, `ReactionBar`, 진행표 카드, 공통 페이지 레이아웃
- New/changed components: 진행표 탭, 날짜 탐색기, 일일 완료 요약, 상태별 멤버 목록, 좋아요 사용자 인라인 패널
- Variants and states: 완료, 미완료, 데이터 없음, 기간 전/후 날짜 제한, 좋아요 목록 닫힘·로딩·열림·오류
- Token/component ownership: 기존 Tailwind 클래스와 CSS 변수 사용

## Accessibility

- Target standard: WCAG 2.1 AA 수준의 기본 키보드 및 명도 대비
- Keyboard/focus behavior: 탭은 `role=tablist`, 날짜 버튼과 입력은 키보드 접근 가능, 좋아요 수 버튼은 `aria-expanded`와 연결 패널 ID 제공
- Contrast/readability: 상태를 색상만으로 구분하지 않고 텍스트와 아이콘 병행
- Screen-reader semantics: 선택 탭, 날짜 이동 버튼, 완료 상태에 명시적 레이블 제공
- Reduced motion and sensory considerations: 필수 애니메이션 없음

## Responsive behavior

- Supported breakpoints/devices: 모바일 우선, 기존 `max-w-2xl` 데스크톱 중앙 정렬
- Layout adaptations: 좁은 화면에서는 상태 요약과 멤버 정보를 줄바꿈
- Touch/hover differences: 터치 목표 최소 40px, hover는 보조 피드백으로만 사용

## Interaction states

- Loading: 기존 `/progress/loading.tsx` 스켈레톤 유지, 좋아요 사용자 조회 중에는 작은 인라인 스켈레톤 표시
- Empty: 참여 멤버 또는 해당 날짜 데이터가 없음을 안내
- Error: 기존 데이터 조회 실패 안내 유지
- Success: 완료 인원과 전체 인원을 요약하고 완료 멤버를 먼저 표시
- Disabled: 기간 밖 날짜 이동 버튼 비활성화
- Offline/slow network, if applicable: 서버 렌더 데이터로 첫 화면을 제공

## Content voice

- Tone: 간결하고 판단하기 쉬우며 비난하지 않는 표현
- Terminology: 누적 화면은 `기부금 현황`, 날짜별 화면은 `일일 인증`
- Microcopy rules: `인증 완료`, `아직 미완료`처럼 행동 상태를 직접 표현

## Implementation constraints

- Framework/styling system: Next.js App Router, React, Tailwind CSS
- Design-token constraints: 기존 색상과 반경을 우선 사용
- Performance constraints: 활성 리추얼 기간 데이터만 한 번에 조회하고 클라이언트에서 날짜 전환
- Compatibility constraints: 현재 진행표 API와 화면의 기존 기능 보존
- Test/screenshot expectations: TypeScript, ESLint, 프로덕션 빌드 검증

## Open questions

- [ ] 주말에도 일일 인증 미완료 상태를 표시할지 운영 정책 확인 / 제품 담당 / 상태 문구에 영향
- [ ] 인증 마감 시각 이후 미완료 알림 기능이 필요한지 확인 / 제품 담당 / 후속 기능 범위
