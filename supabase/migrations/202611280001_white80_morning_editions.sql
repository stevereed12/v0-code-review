create table if not exists public.white80_morning_editions (
  edition_id text primary key,
  session_date date not null unique,
  captured_at timestamptz not null,
  content_sha256 text not null check (content_sha256 ~ '^[a-f0-9]{64}$'),
  content jsonb not null,
  published_at timestamptz not null default now(),
  check (edition_id = 'white80-' || to_char(session_date, 'YYYY-MM-DD')),
  check (coalesce(content ->> 'schemaVersion', '') = '1'),
  check (coalesce(content ->> 'editionId', '') = edition_id)
);

alter table public.white80_morning_editions enable row level security;
revoke all on public.white80_morning_editions from public, anon, authenticated, service_role;
grant select, insert on public.white80_morning_editions to service_role;
