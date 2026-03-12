create table if not exists public.privacy_detective_sessions (
  id bigint generated always as identity primary key,
  player_name text not null,
  session_id text not null unique,
  created_at timestamptz not null default now(),
  room1_clicks text,
  room1_success boolean default false,
  room2_selections text,
  room2_success boolean default false,
  room3_removed_fields text,
  room3_success boolean default false,
  final_result text,
  completed boolean default false
);

alter table public.privacy_detective_sessions enable row level security;

create policy "allow_anon_insert"
on public.privacy_detective_sessions
for insert
to anon
with check (true);

create policy "allow_anon_update"
on public.privacy_detective_sessions
for update
to anon
using (true)
with check (true);

create policy "allow_anon_select"
on public.privacy_detective_sessions
for select
to anon
using (true);
