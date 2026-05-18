alter table public.users enable row level security;
alter table public.words enable row level security;

drop policy if exists "Users can select their own profile" on public.users;
create policy "Users can select their own profile"
on public.users
for select
using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.users;
create policy "Users can insert their own profile"
on public.users
for insert
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.users;
create policy "Users can update their own profile"
on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can delete their own profile" on public.users;
create policy "Users can delete their own profile"
on public.users
for delete
using (auth.uid() = id);

drop policy if exists "Users can select their own words" on public.words;
create policy "Users can select their own words"
on public.words
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own words" on public.words;
create policy "Users can insert their own words"
on public.words
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own words" on public.words;
create policy "Users can update their own words"
on public.words
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own words" on public.words;
create policy "Users can delete their own words"
on public.words
for delete
using (auth.uid() = user_id);

create index if not exists words_user_id_created_at_idx
on public.words (user_id, created_at desc);
