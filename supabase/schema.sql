-- ============================================================
-- OUR DATES — Schema del database
-- Da incollare TUTTO nell'SQL Editor di Supabase e premere RUN.
-- (Va eseguito UNA SOLA volta, su un progetto nuovo.)
-- ============================================================

-- 1) PROFILI --------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  birthdate date,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profili visibili a tutti"
  on public.profiles for select using (true);
create policy "inserisci il tuo profilo"
  on public.profiles for insert with check (auth.uid() = id);
create policy "aggiorna il tuo profilo"
  on public.profiles for update using (auth.uid() = id);

-- Crea automaticamente il profilo alla registrazione
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  uname text := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
begin
  begin
    insert into public.profiles (id, username, birthdate)
    values (new.id, uname, nullif(new.raw_user_meta_data->>'birthdate','')::date);
  exception when unique_violation then
    insert into public.profiles (id, username, birthdate)
    values (new.id, uname || '_' || substr(md5(random()::text), 1, 4),
            nullif(new.raw_user_meta_data->>'birthdate','')::date);
  end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) AMICI ----------------------------------------------------
create table if not exists public.friends (
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);
alter table public.friends enable row level security;

create policy "vedi le tue amicizie"
  on public.friends for select using (auth.uid() = user_id or auth.uid() = friend_id);
create policy "aggiungi amici"
  on public.friends for insert with check (auth.uid() = user_id);
create policy "rimuovi amici"
  on public.friends for delete using (auth.uid() = user_id);

-- 3) POST -----------------------------------------------------
create table if not exists public.posts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  title text not null,
  comment text not null default '',
  visibility text not null default 'public'
    check (visibility in ('private','friends','public')),
  media_type text check (media_type in ('photo','video','link')),
  media_url text,
  created_at timestamptz not null default now()
);
create index if not exists posts_date_idx on public.posts(date);
create index if not exists posts_user_idx on public.posts(user_id);
alter table public.posts enable row level security;

-- La visibilità (privato/amici/pubblico) è garantita QUI, dal database:
create policy "lettura post"
  on public.posts for select using (
    visibility = 'public'
    or user_id = auth.uid()
    or (visibility = 'friends' and exists (
      select 1 from public.friends f
      where f.user_id = posts.user_id and f.friend_id = auth.uid()
    ))
  );
create policy "crea i tuoi post"
  on public.posts for insert with check (auth.uid() = user_id);
create policy "modifica i tuoi post"
  on public.posts for update using (auth.uid() = user_id);
create policy "elimina i tuoi post"
  on public.posts for delete using (auth.uid() = user_id);

-- 4) MESSAGGI (chat private) ---------------------------------
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists messages_pair_idx on public.messages(sender_id, recipient_id, created_at);
create index if not exists messages_recipient_idx on public.messages(recipient_id, read);
alter table public.messages enable row level security;

create policy "leggi le tue chat"
  on public.messages for select using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "invia messaggi"
  on public.messages for insert with check (auth.uid() = sender_id);
create policy "segna come letti"
  on public.messages for update using (auth.uid() = recipient_id);

-- Chat in tempo reale
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;

-- 5) ARCHIVIO FOTO/VIDEO -------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "lettura pubblica media"
  on storage.objects for select using (bucket_id = 'media');
create policy "carica nella tua cartella"
  on storage.objects for insert with check (
    bucket_id = 'media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "elimina i tuoi file"
  on storage.objects for delete using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 6) ELIMINAZIONE ACCOUNT ------------------------------------
create or replace function public.delete_own_account()
returns void
language sql security definer set search_path = public
as $$
  delete from auth.users where id = auth.uid();
$$;
revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
