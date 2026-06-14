create table if not exists public.feedback (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  what_went_wrong text,
  what_should_we_improve text,
  contact text,
  page_path text,
  created_at timestamptz default now()
);

alter table public.feedback enable row level security;

drop policy if exists "Authenticated users can insert own feedback" on public.feedback;
create policy "Authenticated users can insert own feedback"
on public.feedback
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can read own feedback" on public.feedback;
create policy "Authenticated users can read own feedback"
on public.feedback
for select
to authenticated
using (auth.uid() = user_id);

create index if not exists feedback_user_id_created_at_idx
on public.feedback (user_id, created_at desc);
