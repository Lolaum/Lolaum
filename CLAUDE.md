# Lolaum - 리추얼 챌린지 트래킹 앱

## 기술 스택
- **프론트엔드**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **백엔드**: Supabase (PostgreSQL + Auth + Storage)
- **벡터 검색**: Pinecone (시맨틱 검색용)

## 프로젝트 구조
- `src/app/` — Next.js App Router 페이지
- `src/components/` — React 컴포넌트
- `src/types/` — TypeScript 타입 정의
- `src/types/supabase.ts` — DB 테이블 타입 + record_data JSONB 타입 + 한영 매핑
- `src/mock/` — 모크 데이터 (Supabase 연동 후 점진적 제거 예정)
- `src/lib/supabase/` — Supabase 클라이언트 (client.ts, server.ts, middleware.ts)
- `supabase/migrations/00001_initial_schema.sql` — DB 스키마 (13개 테이블, 인덱스, RLS, Storage 버킷)
- `docs/page-map.html` — 페이지별 기능 & 비즈니스 규칙 정리

## DB 구조 요약
- `profiles` — 유저 (auth.users 확장)
- `teams` / `team_members` — 팀 & 멤버
- `challenges` — 월별 챌린지 (3주 x 주5회)
- `challenge_registrations` — 유저별 리추얼 등록
- `ritual_records` — 리추얼 기록 (JSONB로 8종 리추얼 데이터 저장)
- `books` — 독서/원서 책 관리
- `feeds` / `feed_comments` — 인증 게시글 (사진 포함) & 댓글
- `declarations` — 리추얼 선언
- `mid_reviews` — 중간 회고
- `daily_completions` — 일일 달성 현황 (진행도/스트릭 계산용)
- `todos` — 할 일

## 핵심 비즈니스 규칙
- 하루에 등록한 리추얼을 **모두 완료**해야 1일 달성 인정
- 행복찬스: 최초 1회 미달성 면제
- 인증 게시글(feeds)에만 사진 포함, 나의 기록(ritual_records)은 텍스트만
- 데이터는 매월 리셋 (challenge_id 기반 분리, 실제 삭제 아님)
- 중간 회고는 매월 10~13일에만 작성 가능

## 개발 명령어
- `npm run dev` — 개발 서버
- `npm run build` — 빌드
- `npx tsc --noEmit` — 타입 체크
