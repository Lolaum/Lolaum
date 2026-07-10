-- Allow the cleanup ritual type in database check constraints.
-- Run in Supabase SQL Editor after deploying code that references "cleanup".

alter table public.challenge_registrations
  drop constraint if exists challenge_registrations_routine_type_check;

alter table public.challenge_registrations
  add constraint challenge_registrations_routine_type_check
  check (
    routine_type in (
      'morning',
      'exercise',
      'reading',
      'english',
      'second_language',
      'recording',
      'cleanup',
      'finance',
      'english_book'
    )
  );

alter table public.declarations
  drop constraint if exists declarations_routine_type_check;

alter table public.declarations
  add constraint declarations_routine_type_check
  check (
    routine_type in (
      'morning',
      'exercise',
      'reading',
      'english',
      'second_language',
      'recording',
      'cleanup',
      'finance',
      'english_book'
    )
  );

alter table public.ritual_records
  drop constraint if exists ritual_records_routine_type_check;

alter table public.ritual_records
  add constraint ritual_records_routine_type_check
  check (
    routine_type in (
      'morning',
      'exercise',
      'reading',
      'english',
      'second_language',
      'recording',
      'cleanup',
      'finance',
      'english_book'
    )
  );
