create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique not null,
  display_name text not null,
  age int,
  identity text,
  current_issue text,
  ideal_state text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  ai_paused boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  answers jsonb not null,
  raw_total int not null,
  total_score_100 numeric(5, 2) not null,
  dimension_scores jsonb not null,
  primary_mode text not null,
  recommended_day int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.progress (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_day int not null default 1 check (current_day between 1 and 100),
  completed_days int[] not null default '{}',
  cards_collected int not null default 0,
  ai_conversation_count int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  day int not null check (day between 1 and 100),
  quote_card_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.content_days (
  day int primary key check (day between 1 and 100),
  title text not null,
  mirror text not null,
  story text not null,
  body_note text not null,
  ai_prompt_note text,
  ai_questions text[] not null default '{}',
  quote text,
  quote_author text,
  is_published boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.mystery_cards (
  day int primary key check (day between 1 and 100),
  person text not null,
  quote text not null,
  card_text text not null,
  image_url text,
  is_published boolean not null default false
);

create table if not exists public.card_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  day int not null references public.mystery_cards(day),
  collected_at timestamptz not null default now(),
  unique (user_id, day)
);

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  day int check (day between 1 and 100),
  prompt text not null,
  response text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', '她')
  )
  on conflict (id) do update set
    phone = excluded.phone,
    display_name = excluded.display_name,
    updated_at = now();

  insert into public.progress (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists progress_set_updated_at on public.progress;
create trigger progress_set_updated_at
  before update on public.progress
  for each row execute function public.set_updated_at();

drop trigger if exists content_days_set_updated_at on public.content_days;
create trigger content_days_set_updated_at
  before update on public.content_days
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.assessments enable row level security;
alter table public.progress enable row level security;
alter table public.checkins enable row level security;
alter table public.content_days enable row level security;
alter table public.mystery_cards enable row level security;
alter table public.card_collections enable row level security;
alter table public.ai_conversations enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.content_days, public.mystery_cards to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.memberships to authenticated;
grant select, insert on public.assessments to authenticated;
grant select, insert, update on public.progress to authenticated;
grant select, insert on public.checkins to authenticated;
grant select, insert on public.card_collections to authenticated;
grant select, insert, update on public.ai_conversations to authenticated;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can read own memberships" on public.memberships;
create policy "Users can read own memberships"
  on public.memberships for select
  using (auth.uid() = user_id);

drop policy if exists "Users can read own assessments" on public.assessments;
create policy "Users can read own assessments"
  on public.assessments for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own assessments" on public.assessments;
create policy "Users can insert own assessments"
  on public.assessments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own progress" on public.progress;
create policy "Users can read own progress"
  on public.progress for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own progress" on public.progress;
create policy "Users can insert own progress"
  on public.progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own progress" on public.progress;
create policy "Users can update own progress"
  on public.progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own checkins" on public.checkins;
create policy "Users can read own checkins"
  on public.checkins for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own checkins" on public.checkins;
create policy "Users can insert own checkins"
  on public.checkins for insert
  with check (auth.uid() = user_id);

drop policy if exists "Anyone can read published days" on public.content_days;
create policy "Anyone can read published days"
  on public.content_days for select
  using (is_published = true);

drop policy if exists "Anyone can read published mystery cards" on public.mystery_cards;
create policy "Anyone can read published mystery cards"
  on public.mystery_cards for select
  using (is_published = true);

drop policy if exists "Users can read own card collections" on public.card_collections;
create policy "Users can read own card collections"
  on public.card_collections for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own card collections" on public.card_collections;
create policy "Users can insert own card collections"
  on public.card_collections for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own ai conversations" on public.ai_conversations;
create policy "Users can read own ai conversations"
  on public.ai_conversations for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own ai conversations" on public.ai_conversations;
create policy "Users can insert own ai conversations"
  on public.ai_conversations for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own ai conversations" on public.ai_conversations;
create policy "Users can update own ai conversations"
  on public.ai_conversations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
