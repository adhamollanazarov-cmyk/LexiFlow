create table if not exists public.analytics_events (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.analytics_events enable row level security;

drop policy if exists "Authenticated users can insert their own analytics events"
on public.analytics_events;
create policy "Authenticated users can insert their own analytics events"
on public.analytics_events
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can read their own analytics events"
on public.analytics_events;
create policy "Authenticated users can read their own analytics events"
on public.analytics_events
for select
to authenticated
using (auth.uid() = user_id);

create index if not exists analytics_events_user_id_created_at_idx
on public.analytics_events (user_id, created_at desc);

create index if not exists analytics_events_event_name_created_at_idx
on public.analytics_events (event_name, created_at desc);
