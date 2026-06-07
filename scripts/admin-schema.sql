-- Lolaum admin feature support tables.
-- Run in Supabase SQL editor with a service/admin role before using persistence-heavy admin functions.

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
