-- Lolaum admin feature support tables.
-- Run in Supabase SQL editor with a service/admin role before using persistence-heavy admin functions.

alter table public.challenge_periods
  add column if not exists mid_review_start_date date,
  add column if not exists mid_review_end_date date,
  add column if not exists final_review_start_date date,
  add column if not exists final_review_end_date date;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'final_reviews'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%continuation_choice%'
  loop
    execute format('alter table public.final_reviews drop constraint if exists %I', constraint_name);
  end loop;
end $$;

alter table public.final_reviews
  add constraint final_reviews_continuation_choice_check
  check (continuation_choice in ('keep', 'adjust', 'other'));

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'notifications'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%type%'
  loop
    execute format('alter table public.notifications drop constraint if exists %I', constraint_name);
  end loop;
end $$;

alter table public.notifications
  add constraint notifications_type_check
  check (type in ('comment', 'like', 'ritual_completion'));

create table if not exists public.admin_deactivated_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  deactivated_by uuid references public.profiles(id) on delete set null,
  deactivated_at timestamptz not null default now(),
  reactivated_at timestamptz,
  unique (user_id, reactivated_at)
);

create index if not exists admin_deactivated_users_active_idx
  on public.admin_deactivated_users(user_id)
  where reactivated_at is null;

create table if not exists public.admin_review_questions (
  id uuid primary key default gen_random_uuid(),
  review_type text not null check (review_type in ('mid', 'final')),
  question_key text not null,
  label text not null,
  helper_text text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (review_type, question_key)
);

create table if not exists public.admin_error_logs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  message text not null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.feed_reactions (
  id uuid primary key default gen_random_uuid(),
  feed_id uuid not null references public.feeds(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (feed_id, user_id, emoji)
);

create index if not exists feed_reactions_feed_id_idx
  on public.feed_reactions(feed_id);

create index if not exists feed_reactions_user_id_idx
  on public.feed_reactions(user_id);

notify pgrst, 'reload schema';
