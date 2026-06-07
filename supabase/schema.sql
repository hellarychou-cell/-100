create extension if not exists "pgcrypto";

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
  summary text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);
