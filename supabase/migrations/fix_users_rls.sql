alter table public.users enable row level security;

drop policy if exists "Users can update own profile" on public.users;

create policy "Users can update own profile"
on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);
