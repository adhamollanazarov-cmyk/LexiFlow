alter table public.words
add column if not exists repetitions integer not null default 0,
add column if not exists easiness_factor float not null default 2.5,
add column if not exists interval_days integer not null default 1,
add column if not exists quality_last integer check (quality_last between 0 and 5);

alter table public.words
add column if not exists next_review_at timestamptz default now(),
add column if not exists last_reviewed_at timestamptz;

create table if not exists public.review_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  word_id uuid references public.words(id) on delete cascade,
  quality integer not null check (quality between 0 and 5),
  interval_days integer not null,
  easiness_factor float not null,
  reviewed_at timestamptz default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_review_date date
);

alter table public.review_logs enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "Users can insert own review logs" on public.review_logs;
create policy "Users can insert own review logs"
on public.review_logs for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can read own review logs" on public.review_logs;
create policy "Users can read own review logs"
on public.review_logs for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create index if not exists words_user_id_next_review_at_sm2_idx
on public.words (user_id, next_review_at);

create index if not exists idx_user_words_due
on public.words (user_id, next_review_at);

create index if not exists words_user_id_repetitions_idx
on public.words (user_id, repetitions);

create index if not exists review_logs_user_id_reviewed_at_idx
on public.review_logs (user_id, reviewed_at);

create index if not exists idx_review_logs_user_date
on public.review_logs (user_id, reviewed_at);

create or replace function public.submit_sm2_review_transaction(
  p_user_id uuid,
  p_word_id uuid,
  p_quality integer,
  p_repetitions integer,
  p_easiness_factor float,
  p_interval_days integer,
  p_next_review_at timestamptz,
  p_reviewed_at timestamptz,
  p_review_count integer,
  p_review_level integer
)
returns table (
  word_id uuid,
  next_review_at timestamptz,
  interval_days integer,
  easiness_factor float,
  streak_maintained boolean,
  current_streak integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  word_owner uuid;
  review_day date := (p_reviewed_at at time zone 'utc')::date;
  previous_review_date date;
  previous_streak integer;
  previous_longest integer;
  next_streak integer;
begin
  if p_quality < 0 or p_quality > 5 then
    raise exception 'invalid_quality' using errcode = '22023';
  end if;

  select user_id into word_owner
  from public.words
  where id = p_word_id;

  if word_owner is null then
    raise exception 'review_word_not_found' using errcode = 'P0002';
  end if;

  if word_owner <> p_user_id then
    raise exception 'review_word_forbidden' using errcode = '42501';
  end if;

  update public.words
  set
    repetitions = p_repetitions,
    easiness_factor = p_easiness_factor,
    interval_days = p_interval_days,
    next_review_at = p_next_review_at,
    last_reviewed_at = p_reviewed_at,
    quality_last = p_quality,
    review_count = p_review_count,
    review_level = p_review_level
  where id = p_word_id
    and user_id = p_user_id;

  insert into public.review_logs (
    user_id,
    word_id,
    quality,
    interval_days,
    easiness_factor,
    reviewed_at
  )
  values (
    p_user_id,
    p_word_id,
    p_quality,
    p_interval_days,
    p_easiness_factor,
    p_reviewed_at
  );

  insert into public.profiles (
    id,
    current_streak,
    longest_streak,
    last_review_date
  )
  values (
    p_user_id,
    0,
    0,
    null
  )
  on conflict (id) do nothing;

  select
    last_review_date,
    current_streak,
    longest_streak
  into
    previous_review_date,
    previous_streak,
    previous_longest
  from public.profiles
  where id = p_user_id;

  if previous_review_date is null then
    next_streak := 1;
  elsif previous_review_date = review_day then
    next_streak := previous_streak;
  elsif previous_review_date = review_day - 1 then
    next_streak := previous_streak + 1;
  else
    next_streak := 1;
  end if;

  update public.profiles
  set
    current_streak = next_streak,
    longest_streak = greatest(previous_longest, next_streak),
    last_review_date = review_day
  where id = p_user_id;

  return query select
    p_word_id,
    p_next_review_at,
    p_interval_days,
    p_easiness_factor,
    p_quality >= 3,
    next_streak;
end;
$$;
