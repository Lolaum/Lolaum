-- Public, non-sequential identifier used in challenger profile URLs.
-- Existing challenge UUIDs remain private and continue to back relations.

alter table public.challenges
  add column if not exists public_slug text;

update public.challenges
set public_slug = left(md5(id::text || ':' || random()::text), 16)
where public_slug is null;

alter table public.challenges
  alter column public_slug set default left(md5(gen_random_uuid()::text), 16),
  alter column public_slug set not null;

create unique index if not exists challenges_public_slug_uidx
  on public.challenges (public_slug);

alter table public.challenges
  drop constraint if exists challenges_public_slug_format_check;

alter table public.challenges
  add constraint challenges_public_slug_format_check
  check (public_slug ~ '^[a-f0-9]{16}$');
