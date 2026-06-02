-- GamersArchives.org clean-start content reset
-- WARNING: Run only when you want to clear current community test content.
-- This keeps member accounts and profile records, but clears tournaments, duels,
-- clips, forum threads, chat messages, and daily-spin history before adding a
-- small set of clearly labeled starter examples.

begin;

truncate table public.daily_spins, public.chat_messages, public.forum_threads, public.clips, public.duels, public.tournaments;

insert into public.tournaments(id,title,game,mode,entry_count,max_entries,reward_text,status,starts_text) values
('10000000-0000-0000-0000-000000000001','Welcome Tournament Test','Test Game','1v1',1,8,'500 AC','Registration','Schedule pending');

insert into public.duels(id,challenger_name,opponent_name,game,mode,stake_ac,rank_requirement,live) values
('20000000-0000-0000-0000-000000000001','iishadowkiingii','TestCharacter','Test Game','1v1',100,'Any Rank',false);

insert into public.clips(id,creator_name,title,game,category,views,duration_text) values
('30000000-0000-0000-0000-000000000001','iishadowkiingii','Highlight Upload Test','Test Game','Highlight',0,'0:30'),
('30000000-0000-0000-0000-000000000002','TestCharacter','Character Moment Test','Test Game','Moment',0,'0:30');

insert into public.forum_threads(id,author_name,tag,title,body,reply_count,created_at) values
('40000000-0000-0000-0000-000000000001','iishadowkiingii','Site Update','Welcome to GamersArchives','This is the first clean site-update example for the new community. Add your real announcements when you are ready.',0,now()),
('40000000-0000-0000-0000-000000000002','TestCharacter','Discussion','Test discussion','This is a clearly labeled test-character post so you can preview the discussion layout.',0,now());

insert into public.chat_messages(id,author_name,body,created_at) values
('50000000-0000-0000-0000-000000000001','iishadowkiingii','Welcome to the brand-new GamersArchives lobby.',now() - interval '2 minutes'),
('50000000-0000-0000-0000-000000000002','TestCharacter','This is a test character message so you can preview the chat layout.',now() - interval '1 minute');

commit;

-- Optional founder update if your registered username is iishadowkiingii:
-- update public.profiles set role = 'founder', credits = 4250 where username = 'iishadowkiingii';
