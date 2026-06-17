-- Feed likes/reactions + like notifications.
-- Run this in Supabase SQL editor.

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

notify pgrst, 'reload schema';
