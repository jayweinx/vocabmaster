-- VocabMaster shared library schema
-- Safe to run again: tables, trigger and policies are created/replaced idempotently.

create table if not exists public.teacher_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.folders (
  id text primary key,
  name text not null check (length(trim(name)) > 0),
  parent_id text null references public.folders(id) on delete cascade,
  sort_order integer not null default 0,
  folder_type text null,
  raw_heading text null,
  source_page integer null,
  import_batch_id text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint folders_not_own_parent check (parent_id is null or parent_id <> id)
);

create table if not exists public.words (
  id text primary key,
  word text not null check (length(trim(word)) > 0),
  pronunciation text not null default '',
  meaning text not null default '',
  mandarin text not null default '',
  category text not null default 'General',
  folder_id text null references public.folders(id) on delete cascade,
  section text not null default '',
  part text not null default '',
  question text not null default '',
  source_page integer null,
  raw_heading text not null default '',
  raw_source text not null default '',
  import_batch_id text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists folders_parent_id_idx on public.folders(parent_id);
create index if not exists folders_sort_order_idx on public.folders(sort_order);
create index if not exists words_folder_id_idx on public.words(folder_id);
create index if not exists words_word_lower_idx on public.words(lower(word));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists folders_set_updated_at on public.folders;
create trigger folders_set_updated_at before update on public.folders
for each row execute function public.set_updated_at();

drop trigger if exists words_set_updated_at on public.words;
create trigger words_set_updated_at before update on public.words
for each row execute function public.set_updated_at();

create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.teacher_users where user_id = auth.uid()
  );
$$;

revoke all on function public.is_teacher() from public;
grant execute on function public.is_teacher() to authenticated;

alter table public.teacher_users enable row level security;
alter table public.folders enable row level security;
alter table public.words enable row level security;

drop policy if exists "Teacher can read own allowlist entry" on public.teacher_users;
create policy "Teacher can read own allowlist entry"
on public.teacher_users for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Anyone can read folders" on public.folders;
create policy "Anyone can read folders"
on public.folders for select to anon, authenticated
using (true);

drop policy if exists "Allowlisted teachers can insert folders" on public.folders;
create policy "Allowlisted teachers can insert folders"
on public.folders for insert to authenticated
with check (public.is_teacher());

drop policy if exists "Allowlisted teachers can update folders" on public.folders;
create policy "Allowlisted teachers can update folders"
on public.folders for update to authenticated
using (public.is_teacher()) with check (public.is_teacher());

drop policy if exists "Allowlisted teachers can delete folders" on public.folders;
create policy "Allowlisted teachers can delete folders"
on public.folders for delete to authenticated
using (public.is_teacher());

drop policy if exists "Anyone can read words" on public.words;
create policy "Anyone can read words"
on public.words for select to anon, authenticated
using (true);

drop policy if exists "Allowlisted teachers can insert words" on public.words;
create policy "Allowlisted teachers can insert words"
on public.words for insert to authenticated
with check (public.is_teacher());

drop policy if exists "Allowlisted teachers can update words" on public.words;
create policy "Allowlisted teachers can update words"
on public.words for update to authenticated
using (public.is_teacher()) with check (public.is_teacher());

drop policy if exists "Allowlisted teachers can delete words" on public.words;
create policy "Allowlisted teachers can delete words"
on public.words for delete to authenticated
using (public.is_teacher());

revoke all on table public.teacher_users from anon, authenticated;
grant select on table public.teacher_users to authenticated;

revoke all on table public.folders from anon, authenticated;
grant select on table public.folders to anon, authenticated;
grant insert, update, delete on table public.folders to authenticated;

revoke all on table public.words from anon, authenticated;
grant select on table public.words to anon, authenticated;
grant insert, update, delete on table public.words to authenticated;
