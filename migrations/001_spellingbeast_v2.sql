create table if not exists public.word_lists (
  id text primary key,
  owner_id uuid not null references neon_auth."user"(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists word_lists_owner_id_idx on public.word_lists(owner_id);

create table if not exists public.word_list_words (
  id bigserial primary key,
  word_list_id text not null references public.word_lists(id) on delete cascade,
  position integer not null check (position >= 0),
  word text not null,
  normalized_word text not null,
  unique (word_list_id, position),
  unique (word_list_id, normalized_word)
);

create table if not exists public.active_mistakes (
  id text primary key,
  owner_id uuid not null references neon_auth."user"(id) on delete cascade,
  word_list_id text not null references public.word_lists(id) on delete cascade,
  word text not null,
  normalized_word text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, word_list_id, normalized_word)
);

create index if not exists active_mistakes_owner_id_idx on public.active_mistakes(owner_id);
