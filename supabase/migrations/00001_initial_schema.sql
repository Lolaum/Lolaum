-- ============================================================
-- Lolaum DB Schema - Initial Migration
-- Supabase (PostgreSQL) 기반 리추얼 챌린지 트래킹 앱
-- ============================================================

-- ============================================================
-- 1. profiles (유저 프로필 - auth.users 확장)
-- ============================================================
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  avatar_url  TEXT,
  emoji       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 신규 유저 가입 시 자동으로 profiles 레코드 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 2. teams (팀)
-- ============================================================
CREATE TABLE public.teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  max_members SMALLINT NOT NULL DEFAULT 8,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. team_members (팀 멤버)
-- ============================================================
CREATE TABLE public.team_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id   UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

-- ============================================================
-- 4. challenges (챌린지 - 월별 사이클)
-- ============================================================
CREATE TABLE public.challenges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  year            SMALLINT NOT NULL,
  month           SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  weekly_target   SMALLINT NOT NULL DEFAULT 5,
  total_weeks     SMALLINT NOT NULL DEFAULT 3,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, year, month)
);

-- ============================================================
-- 5. challenge_registrations (챌린지 리추얼 등록)
-- ============================================================
CREATE TABLE public.challenge_registrations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id  UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  routine_type  TEXT NOT NULL CHECK (routine_type IN (
    'morning', 'exercise', 'reading', 'english',
    'second_language', 'recording', 'finance', 'english_book'
  )),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, user_id, routine_type)
);

-- ============================================================
-- 6. ritual_records (리추얼 기록 - 핵심 테이블)
-- ============================================================
CREATE TABLE public.ritual_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id    UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  routine_type    TEXT NOT NULL CHECK (routine_type IN (
    'morning', 'exercise', 'reading', 'english',
    'second_language', 'recording', 'finance', 'english_book'
  )),
  record_date     DATE NOT NULL,
  record_data     JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, challenge_id, routine_type, record_date)
);

CREATE TRIGGER ritual_records_updated_at
  BEFORE UPDATE ON public.ritual_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 7. books (책 관리 - 독서/원서 리추얼)
-- ============================================================
CREATE TABLE public.books (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id    UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  routine_type    TEXT NOT NULL CHECK (routine_type IN ('reading', 'english_book')),
  title           TEXT NOT NULL,
  author          TEXT NOT NULL,
  tracking_type   TEXT NOT NULL CHECK (tracking_type IN ('page', 'percent')),
  current_value   INTEGER NOT NULL DEFAULT 0,
  total_value     INTEGER NOT NULL,
  cover_image_url TEXT,
  is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 8. feeds (인증 게시글 - 사진 포함)
-- ============================================================
CREATE TABLE public.feeds (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id     UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  ritual_record_id UUID REFERENCES public.ritual_records(id) ON DELETE SET NULL,
  routine_type     TEXT NOT NULL CHECK (routine_type IN (
    'morning', 'exercise', 'reading', 'english',
    'second_language', 'recording', 'finance', 'english_book'
  )),
  feed_date        DATE NOT NULL,
  feed_data        JSONB NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. feed_comments (댓글)
-- ============================================================
CREATE TABLE public.feed_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id     UUID NOT NULL REFERENCES public.feeds(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. declarations (리추얼 선언)
-- ============================================================
CREATE TABLE public.declarations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id  UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  routine_type  TEXT NOT NULL CHECK (routine_type IN (
    'morning', 'exercise', 'reading', 'english',
    'second_language', 'recording', 'finance', 'english_book'
  )),
  answers       JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, challenge_id, routine_type)
);

-- ============================================================
-- 11. mid_reviews (중간 회고)
-- ============================================================
CREATE TABLE public.mid_reviews (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id            UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  routine_type            TEXT NOT NULL CHECK (routine_type IN (
    'morning', 'exercise', 'reading', 'english',
    'second_language', 'recording', 'finance', 'english_book'
  )),
  good_conditions         TEXT[] NOT NULL DEFAULT '{}',
  good_condition_details  JSONB NOT NULL DEFAULT '{}',
  hard_conditions         TEXT[] NOT NULL DEFAULT '{}',
  hard_condition_details  JSONB NOT NULL DEFAULT '{}',
  why_started             TEXT NOT NULL,
  keep_doing              TEXT NOT NULL,
  will_change             TEXT NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, challenge_id, routine_type)
);

-- ============================================================
-- 12. daily_completions (일일 달성 현황)
-- ============================================================
CREATE TABLE public.daily_completions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id      UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  completion_date   DATE NOT NULL,
  total_registered  SMALLINT NOT NULL,
  total_completed   SMALLINT NOT NULL,
  is_fully_complete BOOLEAN NOT NULL GENERATED ALWAYS AS (total_registered = total_completed) STORED,
  is_happy_chance   BOOLEAN NOT NULL DEFAULT FALSE,
  has_penalty       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, challenge_id, completion_date)
);

CREATE TRIGGER daily_completions_updated_at
  BEFORE UPDATE ON public.daily_completions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 13. todos (할 일)
-- ============================================================
CREATE TABLE public.todos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  completed   BOOLEAN NOT NULL DEFAULT FALSE,
  todo_date   DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER todos_updated_at
  BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================

-- team_members
CREATE INDEX idx_team_members_team ON public.team_members(team_id);
CREATE INDEX idx_team_members_user ON public.team_members(user_id);

-- challenge_registrations
CREATE INDEX idx_challenge_reg_user ON public.challenge_registrations(user_id, challenge_id);

-- ritual_records
CREATE INDEX idx_ritual_records_user_date ON public.ritual_records(user_id, record_date);
CREATE INDEX idx_ritual_records_challenge_date ON public.ritual_records(challenge_id, record_date);
CREATE INDEX idx_ritual_records_user_challenge ON public.ritual_records(user_id, challenge_id, routine_type);
CREATE INDEX idx_ritual_records_daily_check ON public.ritual_records(user_id, challenge_id, record_date);
CREATE INDEX idx_ritual_records_data ON public.ritual_records USING GIN (record_data);

-- books
CREATE INDEX idx_books_user_challenge ON public.books(user_id, challenge_id);

-- feeds
CREATE INDEX idx_feeds_challenge_date ON public.feeds(challenge_id, created_at DESC);
CREATE INDEX idx_feeds_user ON public.feeds(user_id, created_at DESC);

-- feed_comments
CREATE INDEX idx_feed_comments_feed ON public.feed_comments(feed_id, created_at);

-- daily_completions
CREATE INDEX idx_daily_completions_user_date ON public.daily_completions(user_id, completion_date DESC);
CREATE INDEX idx_daily_completions_streak ON public.daily_completions(user_id, challenge_id, completion_date);

-- declarations
CREATE INDEX idx_declarations_user_challenge ON public.declarations(user_id, challenge_id);

-- mid_reviews
CREATE INDEX idx_mid_reviews_user_challenge ON public.mid_reviews(user_id, challenge_id);

-- todos
CREATE INDEX idx_todos_user_date ON public.todos(user_id, todo_date);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ritual_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mid_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- profiles: 모든 유저가 읽기 가능, 본인만 수정
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- teams: 팀 멤버만 읽기
CREATE POLICY "teams_select" ON public.teams
  FOR SELECT USING (
    id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  );

-- team_members: 같은 팀 멤버끼리 읽기
CREATE POLICY "team_members_select" ON public.team_members
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  );

-- challenges: 팀 멤버만 읽기
CREATE POLICY "challenges_select" ON public.challenges
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  );

-- challenge_registrations: 같은 챌린지 멤버 읽기, 본인만 등록
CREATE POLICY "challenge_reg_select" ON public.challenge_registrations
  FOR SELECT USING (
    challenge_id IN (
      SELECT c.id FROM public.challenges c
      JOIN public.team_members tm ON tm.team_id = c.team_id
      WHERE tm.user_id = auth.uid()
    )
  );
CREATE POLICY "challenge_reg_insert" ON public.challenge_registrations
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "challenge_reg_delete" ON public.challenge_registrations
  FOR DELETE USING (user_id = auth.uid());

-- ritual_records: 본인만
CREATE POLICY "ritual_records_select" ON public.ritual_records
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "ritual_records_insert" ON public.ritual_records
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "ritual_records_update" ON public.ritual_records
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "ritual_records_delete" ON public.ritual_records
  FOR DELETE USING (user_id = auth.uid());

-- books: 본인만
CREATE POLICY "books_select" ON public.books
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "books_insert" ON public.books
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "books_update" ON public.books
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "books_delete" ON public.books
  FOR DELETE USING (user_id = auth.uid());

-- feeds: 같은 챌린지(팀) 멤버가 읽기, 본인만 작성/삭제
CREATE POLICY "feeds_select" ON public.feeds
  FOR SELECT USING (
    challenge_id IN (
      SELECT c.id FROM public.challenges c
      JOIN public.team_members tm ON tm.team_id = c.team_id
      WHERE tm.user_id = auth.uid()
    )
  );
CREATE POLICY "feeds_insert" ON public.feeds
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "feeds_update" ON public.feeds
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "feeds_delete" ON public.feeds
  FOR DELETE USING (user_id = auth.uid());

-- feed_comments: 피드 접근 가능한 유저가 읽기, 본인만 작성/삭제
CREATE POLICY "feed_comments_select" ON public.feed_comments
  FOR SELECT USING (
    feed_id IN (SELECT id FROM public.feeds)
  );
CREATE POLICY "feed_comments_insert" ON public.feed_comments
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "feed_comments_delete" ON public.feed_comments
  FOR DELETE USING (user_id = auth.uid());

-- declarations: 같은 챌린지 멤버가 읽기, 본인만 작성
CREATE POLICY "declarations_select" ON public.declarations
  FOR SELECT USING (
    challenge_id IN (
      SELECT c.id FROM public.challenges c
      JOIN public.team_members tm ON tm.team_id = c.team_id
      WHERE tm.user_id = auth.uid()
    )
  );
CREATE POLICY "declarations_insert" ON public.declarations
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "declarations_update" ON public.declarations
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "declarations_delete" ON public.declarations
  FOR DELETE USING (user_id = auth.uid());

-- mid_reviews: 같은 챌린지 멤버가 읽기, 본인만 작성
CREATE POLICY "mid_reviews_select" ON public.mid_reviews
  FOR SELECT USING (
    challenge_id IN (
      SELECT c.id FROM public.challenges c
      JOIN public.team_members tm ON tm.team_id = c.team_id
      WHERE tm.user_id = auth.uid()
    )
  );
CREATE POLICY "mid_reviews_insert" ON public.mid_reviews
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "mid_reviews_update" ON public.mid_reviews
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "mid_reviews_delete" ON public.mid_reviews
  FOR DELETE USING (user_id = auth.uid());

-- daily_completions: 같은 챌린지 멤버가 읽기 (진행도), 본인만 수정
CREATE POLICY "daily_completions_select" ON public.daily_completions
  FOR SELECT USING (
    challenge_id IN (
      SELECT c.id FROM public.challenges c
      JOIN public.team_members tm ON tm.team_id = c.team_id
      WHERE tm.user_id = auth.uid()
    )
  );
CREATE POLICY "daily_completions_insert" ON public.daily_completions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "daily_completions_update" ON public.daily_completions
  FOR UPDATE USING (user_id = auth.uid());

-- todos: 본인만
CREATE POLICY "todos_all" ON public.todos
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- STORAGE BUCKETS (사진 저장용)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('certification-photos', 'certification-photos', true),
  ('book-covers', 'book-covers', true),
  ('avatars', 'avatars', true);

-- Storage RLS: 인증된 유저만 업로드, 공개 읽기
CREATE POLICY "storage_public_read" ON storage.objects
  FOR SELECT USING (bucket_id IN ('certification-photos', 'book-covers', 'avatars'));

CREATE POLICY "storage_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('certification-photos', 'book-covers', 'avatars')
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "storage_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('certification-photos', 'book-covers', 'avatars')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
