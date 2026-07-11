-- Store each registered ritual's preferred daily time range.
-- Existing registrations remain valid; new UI requires both values.

alter table public.challenge_registrations
  add column if not exists routine_start_time time,
  add column if not exists routine_end_time time;

alter table public.challenge_registrations
  drop constraint if exists challenge_registrations_routine_time_range_check;

alter table public.challenge_registrations
  add constraint challenge_registrations_routine_time_range_check
  check (
    (routine_start_time is null and routine_end_time is null)
    or (routine_start_time is not null and routine_end_time is not null)
  );

create index if not exists challenge_registrations_user_challenge_time_idx
  on public.challenge_registrations (
    user_id,
    challenge_id,
    routine_start_time,
    registered_at
  );
