-- profiles 테이블에 username(아이디) 컬럼 추가
ALTER TABLE public.profiles
  ADD COLUMN username TEXT UNIQUE;

-- 기존 데이터가 있을 경우 대비: NOT NULL은 별도 설정
-- (신규 유저는 트리거에서 반드시 username을 넣음)

-- username 검색용 인덱스
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- handle_new_user 트리거 함수 업데이트: username을 user_metadata에서 가져옴
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'username'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
