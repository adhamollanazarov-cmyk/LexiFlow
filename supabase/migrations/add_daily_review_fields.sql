alter table public.words
add column if not exists next_review_at timestamptz default now(),
add column if not exists last_reviewed_at timestamptz,
add column if not exists review_count integer not null default 0,
add column if not exists review_level integer not null default 0;

create index if not exists words_user_id_next_review_at_idx
on public.words (user_id, next_review_at);
