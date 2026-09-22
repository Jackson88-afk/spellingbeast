create unique index if not exists word_lists_owner_id_id_uidx
  on public.word_lists(owner_id, id);

create table if not exists public.adventure_level_progress (
  owner_id uuid not null references neon_auth."user"(id) on delete cascade,
  word_list_id text not null,
  level_number integer not null check (level_number >= 1),
  best_stars integer not null check (best_stars between 0 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, word_list_id, level_number),
  foreign key (owner_id, word_list_id) references public.word_lists(owner_id, id) on delete cascade
);

create index if not exists adventure_level_progress_list_idx
  on public.adventure_level_progress(word_list_id);
