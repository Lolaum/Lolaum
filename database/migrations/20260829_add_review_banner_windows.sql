-- Store the admin-configured home banner windows on each challenge period.
-- Safe to run repeatedly in every Supabase environment.

alter table public.challenge_periods
  add column if not exists mid_review_start_date date,
  add column if not exists mid_review_end_date date,
  add column if not exists final_review_start_date date,
  add column if not exists final_review_end_date date;
