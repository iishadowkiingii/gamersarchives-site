-- GamersArchives.org Supabase MVP setup
-- Run this entire file once in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- The public browser key is protected by Row Level Security policies below.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 32),
  role text not null default 'member' check (role in ('member','moderator','admin','founder')),
  credits integer not null default 250 check (credits >= 0),
  wins integer not null default 0 check (wins >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  title text not null check (char_length(title) between 3 and 80),
  game text not null check (char_length(game) between 2 and 60),
  mode text not null check (mode in ('1v1','2v2','3v3','4v4','5v5')),
  entry_count integer not null default 1 check (entry_count >= 0),
  max_entries integer not null default 16 check (max_entries between 2 and 128),
  reward_text text not null default 'Community AC' check (char_length(reward_text) <= 40),
  status text not null default 'Registration' check (status in ('Registration','Almost Full','Upcoming','Closed')),
  starts_text text not null default 'Schedule pending' check (char_length(starts_text) <= 60),
  created_at timestamptz not null default now()
);

create table if not exists public.duels (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  challenger_name text not null default 'Archive Member',
  opponent_name text not null default 'Open Challenge',
  game text not null check (char_length(game) between 2 and 60),
  mode text not null check (mode in ('1v1','2v2','3v3','4v4','5v5')),
  stake_ac integer not null default 100 check (stake_ac between 0 and 5000),
  rank_requirement text not null default 'Any Rank' check (char_length(rank_requirement) <= 40),
  live boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.clips (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  creator_name text not null default 'Archive Member',
  title text not null check (char_length(title) between 3 and 100),
  game text not null check (char_length(game) between 2 and 60),
  category text not null default 'Highlight' check (category in ('Highlight','Moment','Clip','Funny')),
  video_url text,
  views integer not null default 0 check (views >= 0),
  duration_text text not null default '0:30' check (char_length(duration_text) <= 12),
  created_at timestamptz not null default now()
);

create table if not exists public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  author_name text not null default 'Archive Member',
  tag text not null default 'Discussion' check (tag in ('Discussion','Site Update','Tournament','Suggestion')),
  title text not null check (char_length(title) between 3 and 120),
  body text not null default '' check (char_length(body) <= 5000),
  reply_count integer not null default 0 check (reply_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  author_name text not null default 'Archive Member',
  body text not null check (char_length(body) between 1 and 240),
  created_at timestamptz not null default now()
);

create table if not exists public.daily_spins (
  user_id uuid not null references public.profiles(id) on delete cascade,
  spin_date date not null default current_date,
  reward integer not null check (reward in (25, 250)),
  created_at timestamptz not null default now(),
  primary key (user_id, spin_date)
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_username text;
  final_username text;
  proposed_display text;
begin
  base_username := lower(regexp_replace(coalesce(nullif(new.raw_user_meta_data->>'username',''), split_part(new.email,'@',1), 'gamer'), '[^a-zA-Z0-9_]', '', 'g'));
  if char_length(base_username) < 3 then base_username := 'gamer'; end if;
  base_username := left(base_username, 24);
  final_username := base_username;
  if exists(select 1 from public.profiles where username = final_username) then
    final_username := left(base_username, 17) || '_' || left(replace(new.id::text,'-',''), 6);
  end if;
  proposed_display := coalesce(nullif(new.raw_user_meta_data->>'display_name',''), nullif(new.raw_user_meta_data->>'username',''), split_part(new.email,'@',1), 'Archive Member');
  insert into public.profiles(id, username, display_name)
  values (new.id, final_username, left(proposed_display, 32));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.apply_duel_identity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is not null then
    select display_name into new.challenger_name from public.profiles where id = new.created_by;
  end if;
  return new;
end;
$$;
create or replace function public.apply_clip_identity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is not null then
    select display_name into new.creator_name from public.profiles where id = new.created_by;
  end if;
  return new;
end;
$$;
create or replace function public.apply_forum_identity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is not null then
    select display_name into new.author_name from public.profiles where id = new.created_by;
  end if;
  return new;
end;
$$;
create or replace function public.apply_chat_identity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.user_id is not null then
    select display_name into new.author_name from public.profiles where id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists duels_identity on public.duels;
create trigger duels_identity before insert or update on public.duels for each row execute function public.apply_duel_identity();
drop trigger if exists clips_identity on public.clips;
create trigger clips_identity before insert or update on public.clips for each row execute function public.apply_clip_identity();
drop trigger if exists forum_identity on public.forum_threads;
create trigger forum_identity before insert or update on public.forum_threads for each row execute function public.apply_forum_identity();
drop trigger if exists chat_identity on public.chat_messages;
create trigger chat_identity before insert on public.chat_messages for each row execute function public.apply_chat_identity();

create or replace function public.claim_daily_spin()
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  spin_reward integer;
  inserted_count integer;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  spin_reward := case when random() < 0.04 then 250 else 25 end;
  insert into public.daily_spins(user_id, spin_date, reward)
  values (auth.uid(), current_date, spin_reward)
  on conflict do nothing;
  get diagnostics inserted_count = row_count;
  if inserted_count = 0 then return 0; end if;
  update public.profiles set credits = credits + spin_reward where id = auth.uid();
  return spin_reward;
end;
$$;

alter table public.profiles enable row level security;
alter table public.tournaments enable row level security;
alter table public.duels enable row level security;
alter table public.clips enable row level security;
alter table public.forum_threads enable row level security;
alter table public.chat_messages enable row level security;
alter table public.daily_spins enable row level security;

-- Replace policies safely when rerunning this setup.
drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read" on public.profiles for select using (true);
drop policy if exists "profiles_owner_update" on public.profiles;
create policy "profiles_owner_update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "tournaments_public_read" on public.tournaments;
create policy "tournaments_public_read" on public.tournaments for select using (true);
drop policy if exists "tournaments_owner_insert" on public.tournaments;
create policy "tournaments_owner_insert" on public.tournaments for insert to authenticated with check (auth.uid() = created_by);
drop policy if exists "tournaments_owner_update" on public.tournaments;
create policy "tournaments_owner_update" on public.tournaments for update to authenticated using (auth.uid() = created_by) with check (auth.uid() = created_by);
drop policy if exists "tournaments_owner_delete" on public.tournaments;
create policy "tournaments_owner_delete" on public.tournaments for delete to authenticated using (auth.uid() = created_by);

drop policy if exists "duels_public_read" on public.duels;
create policy "duels_public_read" on public.duels for select using (true);
drop policy if exists "duels_owner_insert" on public.duels;
create policy "duels_owner_insert" on public.duels for insert to authenticated with check (auth.uid() = created_by);
drop policy if exists "duels_owner_update" on public.duels;
create policy "duels_owner_update" on public.duels for update to authenticated using (auth.uid() = created_by) with check (auth.uid() = created_by);
drop policy if exists "duels_owner_delete" on public.duels;
create policy "duels_owner_delete" on public.duels for delete to authenticated using (auth.uid() = created_by);

drop policy if exists "clips_public_read" on public.clips;
create policy "clips_public_read" on public.clips for select using (true);
drop policy if exists "clips_owner_insert" on public.clips;
create policy "clips_owner_insert" on public.clips for insert to authenticated with check (auth.uid() = created_by);
drop policy if exists "clips_owner_update" on public.clips;
create policy "clips_owner_update" on public.clips for update to authenticated using (auth.uid() = created_by) with check (auth.uid() = created_by);
drop policy if exists "clips_owner_delete" on public.clips;
create policy "clips_owner_delete" on public.clips for delete to authenticated using (auth.uid() = created_by);

drop policy if exists "forum_public_read" on public.forum_threads;
create policy "forum_public_read" on public.forum_threads for select using (true);
drop policy if exists "forum_owner_insert" on public.forum_threads;
create policy "forum_owner_insert" on public.forum_threads for insert to authenticated with check (auth.uid() = created_by);
drop policy if exists "forum_owner_update" on public.forum_threads;
create policy "forum_owner_update" on public.forum_threads for update to authenticated using (auth.uid() = created_by) with check (auth.uid() = created_by);
drop policy if exists "forum_owner_delete" on public.forum_threads;
create policy "forum_owner_delete" on public.forum_threads for delete to authenticated using (auth.uid() = created_by);

drop policy if exists "chat_public_read" on public.chat_messages;
create policy "chat_public_read" on public.chat_messages for select using (true);
drop policy if exists "chat_member_insert" on public.chat_messages;
create policy "chat_member_insert" on public.chat_messages for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "spins_owner_read" on public.daily_spins;
create policy "spins_owner_read" on public.daily_spins for select to authenticated using (auth.uid() = user_id);

revoke all on public.profiles, public.tournaments, public.duels, public.clips, public.forum_threads, public.chat_messages, public.daily_spins from anon, authenticated;
grant select on public.profiles, public.tournaments, public.duels, public.clips, public.forum_threads, public.chat_messages to anon, authenticated;
grant update (username, display_name) on public.profiles to authenticated;
grant insert, update, delete on public.tournaments, public.duels, public.clips, public.forum_threads to authenticated;
grant insert on public.chat_messages to authenticated;
grant select on public.daily_spins to authenticated;
revoke all on function public.claim_daily_spin() from public;
grant execute on function public.claim_daily_spin() to authenticated;

-- Add live chat inserts to Supabase Realtime without failing if rerun.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_messages'
     ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;

-- Starter public content.
-- Clear only system-created preview rows when rerunning setup. Member-created rows stay untouched.
delete from public.chat_messages where user_id is null;
delete from public.forum_threads where created_by is null;
delete from public.clips where created_by is null;
delete from public.duels where created_by is null;
delete from public.tournaments where created_by is null;

insert into public.tournaments(id,title,game,mode,entry_count,max_entries,reward_text,status,starts_text) values
('10000000-0000-0000-0000-000000000001','Welcome Tournament Test','Test Game','1v1',1,8,'500 AC','Registration','Schedule pending')
on conflict (id) do update set title=excluded.title, game=excluded.game, mode=excluded.mode, entry_count=excluded.entry_count, max_entries=excluded.max_entries, reward_text=excluded.reward_text, status=excluded.status, starts_text=excluded.starts_text;

insert into public.duels(id,challenger_name,opponent_name,game,mode,stake_ac,rank_requirement,live) values
('20000000-0000-0000-0000-000000000001','iishadowkiingii','TestCharacter','Test Game','1v1',100,'Any Rank',false)
on conflict (id) do update set challenger_name=excluded.challenger_name, opponent_name=excluded.opponent_name, game=excluded.game, mode=excluded.mode, stake_ac=excluded.stake_ac, rank_requirement=excluded.rank_requirement, live=excluded.live;

insert into public.clips(id,creator_name,title,game,category,views,duration_text) values
('30000000-0000-0000-0000-000000000001','iishadowkiingii','Highlight Upload Test','Test Game','Highlight',0,'0:30'),
('30000000-0000-0000-0000-000000000002','TestCharacter','Character Moment Test','Test Game','Moment',0,'0:30')
on conflict (id) do update set creator_name=excluded.creator_name, title=excluded.title, game=excluded.game, category=excluded.category, views=excluded.views, duration_text=excluded.duration_text;

insert into public.forum_threads(id,author_name,tag,title,body,reply_count,created_at) values
('40000000-0000-0000-0000-000000000001','iishadowkiingii','Site Update','Welcome to GamersArchives','This is the first clean site-update example for the new community. Add your real announcements when you are ready.',0,now()),
('40000000-0000-0000-0000-000000000002','TestCharacter','Discussion','Test discussion','This is a clearly labeled test-character post so you can preview the discussion layout.',0,now())
on conflict (id) do update set author_name=excluded.author_name, tag=excluded.tag, title=excluded.title, body=excluded.body, reply_count=excluded.reply_count, created_at=excluded.created_at;

insert into public.chat_messages(id,author_name,body,created_at) values
('50000000-0000-0000-0000-000000000001','iishadowkiingii','Welcome to the brand-new GamersArchives lobby.',now() - interval '2 minutes'),
('50000000-0000-0000-0000-000000000002','TestCharacter','This is a test character message so you can preview the chat layout.',now() - interval '1 minute')
on conflict (id) do update set author_name=excluded.author_name, body=excluded.body, created_at=excluded.created_at;

-- Optional after you create your own account:
-- update public.profiles set role = 'founder', credits = 4250 where username = 'iishadowkiingii';
