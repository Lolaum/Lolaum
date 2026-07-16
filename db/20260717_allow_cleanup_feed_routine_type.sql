-- Repair environments where the earlier cleanup migration was already applied
-- without updating the feeds table constraint.

alter table public.feeds
  drop constraint if exists feeds_routine_type_check;

alter table public.feeds
  add constraint feeds_routine_type_check
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
