-- ============================================================
--  자동 댓글 2차 — 뱃지 떼기 + 24시간 운영
--
--  auto-comment.sql 다음에 실행하세요.
--
--  바뀌는 것
--    1. "봇으로 쓸 수 있는 계정"과 "공식 뱃지를 붙이는 계정"을 분리합니다.
--       지금까지는 is_official 하나가 둘 다 했어요. 그래서 자동 댓글을
--       달려면 반드시 뱃지가 붙었습니다.
--       앞으로는 is_bot 이 "봇으로 쓸 수 있음", is_official 이 "뱃지".
--       is_bot = true, is_official = false 로 두면 댓글이 일반 이용자와
--       똑같이 (술방울N + 색) 보입니다.
--
--    2. 자동 댓글은 쉬는 시간을 따로 정합니다 (ac_ignore_quiet).
--       기본값 true — 24시간 언제든 답니다. 예약 발행의 쉬는 시간은
--       그대로 두고 자동 댓글만 풀어주는 거예요.
-- ============================================================

-- ------------------------------------------------------------
--  1. 컬럼
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists is_bot boolean not null default false;

comment on column public.profiles.is_bot is
  '자동 댓글이 이 계정을 써도 되는지. is_official(뱃지)과는 별개입니다.';

alter table public.content_settings
  add column if not exists ac_ignore_quiet boolean not null default true;

comment on column public.content_settings.ac_ignore_quiet is
  '자동 댓글이 쉬는 시간을 무시할지. true 면 24시간 답니다.';

-- 지금 공식으로 켜둔 계정을 봇으로도 쓸 수 있게 합니다.
update public.profiles set is_bot = true where is_official and not is_bot;

-- profiles 는 본인만 수정할 수 있어서 is_bot 을 앱에서 켤 수 없습니다.
-- 그건 의도한 것입니다 — 아무나 봇 계정을 만들면 곤란해요.
create index if not exists profiles_bot_idx on public.profiles (id) where is_bot;


-- ------------------------------------------------------------
--  2. 대상 고르기 — is_official → is_bot, 쉬는 시간 분리
-- ------------------------------------------------------------
create or replace function public.auto_comment_pick()
returns table (
  post_id     bigint,
  post_title  text,
  post_body   text,
  post_cat    text,
  post_age_h  numeric,
  comments    jsonb,
  author_id   uuid,
  author_nick text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg      public.content_settings%rowtype;
  cur_hour int;
  quiet    boolean := false;
  n        int;
begin
  select * into cfg from public.content_settings where id = 1;
  if not found or not cfg.enabled or not cfg.auto_comment_enabled then
    return;
  end if;

  -- 쉬는 시간. ac_ignore_quiet 이 켜져 있으면 아예 보지 않습니다.
  if not cfg.ac_ignore_quiet and cfg.quiet_from <> cfg.quiet_to then
    cur_hour := extract(hour from (now() at time zone cfg.tz))::int;
    if cfg.quiet_from < cfg.quiet_to then
      quiet := cur_hour >= cfg.quiet_from and cur_hour < cfg.quiet_to;
    else
      quiet := cur_hour >= cfg.quiet_from or cur_hour < cfg.quiet_to;
    end if;
    if quiet then
      return;
    end if;
  end if;

  -- 구간 상한 세 개. 하나라도 걸리면 이번엔 넘어갑니다.
  select count(*) into n from public.content_queue q
   where q.kind = 'comment' and q.status = 'published'
     and q.source like 'auto:%' and q.published_at > now() - interval '10 minutes';
  if n >= cfg.ac_cap_10min then return; end if;

  select count(*) into n from public.content_queue q
   where q.kind = 'comment' and q.status = 'published'
     and q.source like 'auto:%' and q.published_at > now() - interval '60 minutes';
  if n >= cfg.ac_cap_60min then return; end if;

  select count(*) into n from public.content_queue q
   where q.kind = 'comment' and q.status = 'published'
     and q.source like 'auto:%' and q.published_at > now() - interval '24 hours';
  if n >= cfg.ac_cap_24h then return; end if;

  if (random() * 100) >= cfg.ac_chance_pct then
    return;
  end if;

  return query
  with persona as (
    select p.id, p.nick
      from public.profiles p
     where p.is_bot                                   -- ← 뱃지가 아니라 봇 여부
     order by random()
     limit 1
  )
  select
    po.id,
    po.title,
    left(coalesce(po.body, ''), 1200),
    po.cat,
    round(extract(epoch from (now() - po.created_at)) / 3600.0, 1),
    coalesce((
      select jsonb_agg(jsonb_build_object('nick', c.nick, 'text', left(c.text, 200))
                       order by c.created_at)
        from (select cc.created_at, '익명'::text as nick, cc.text
                from public.comments cc
               where cc.post_id = po.id
               order by cc.created_at
               limit 8) c
    ), '[]'::jsonb),
    pe.id,
    pe.nick
  from public.posts po
  cross join persona pe
  where po.created_at > now() - make_interval(hours => cfg.ac_max_age_h::int)
    and coalesce(po.author_id, '00000000-0000-0000-0000-000000000000'::uuid) <> pe.id
    -- 봇이 쓴 글에는 달지 않습니다 (봇끼리 대화하는 꼴이 됩니다)
    and not exists (
      select 1 from public.profiles ap
       where ap.id = po.author_id and (ap.is_bot or ap.is_official)
    )
    and (select count(*) from public.comments c3 where c3.post_id = po.id) <= cfg.ac_max_comments
    and not exists (
      select 1 from public.content_queue q
       where q.target_post_id = po.id and q.author_id = pe.id
    )
  order by random()
  limit 1;
end $$;

revoke all on function public.auto_comment_pick() from public;
revoke all on function public.auto_comment_pick() from anon;
revoke all on function public.auto_comment_pick() from authenticated;
grant execute on function public.auto_comment_pick() to service_role;


-- ------------------------------------------------------------
--  3. 등록 — is_official 대신 is_bot 을 봅니다
-- ------------------------------------------------------------
create or replace function public.auto_comment_publish(
  p_author  uuid,
  p_post_id bigint,
  p_text    text
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  prof   public.profiles%rowtype;
  qid    bigint;
  body   text := btrim(p_text);
begin
  select * into prof from public.profiles where id = p_author;
  if not found or not prof.is_bot then
    raise exception '봇으로 지정된 계정이 아닙니다.';
  end if;
  if body = '' or char_length(body) > 1000 then
    raise exception '댓글 길이가 올바르지 않습니다.';
  end if;
  if not exists (select 1 from public.posts where id = p_post_id) then
    raise exception '글을 찾을 수 없습니다.';
  end if;

  insert into public.content_queue
    (kind, status, author_id, target_post_id, text, publish_after, source, dedupe_key, note)
  values
    ('comment', 'approved', p_author, p_post_id, body, now(),
     'auto:' || p_post_id, 'auto:' || p_post_id || ':' || p_author, 'AI 자동 댓글')
  on conflict (dedupe_key) do nothing
  returning id into qid;

  if qid is null then
    return null;
  end if;

  return public.publish_queue_item(qid);
end $$;

revoke all on function public.auto_comment_publish(uuid, bigint, text) from public;
revoke all on function public.auto_comment_publish(uuid, bigint, text) from anon;
revoke all on function public.auto_comment_publish(uuid, bigint, text) from authenticated;
grant execute on function public.auto_comment_publish(uuid, bigint, text) to service_role;


-- ------------------------------------------------------------
--  4. publish_queue_item 이 봇 계정도 받아들이게
--
--  원래는 is_official 이 아니면 거절했습니다. 뱃지를 뗀 봇 계정도
--  통과해야 하므로 조건을 넓힙니다.
-- ------------------------------------------------------------
create or replace function public.publish_queue_item(p_id bigint)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  q      public.content_queue%rowtype;
  prof   public.profiles%rowtype;
  new_id bigint;
  tries  int := 0;
begin
  select * into q from public.content_queue where id = p_id for update;
  if not found then
    raise exception '큐 항목을 찾을 수 없습니다 (%)', p_id;
  end if;
  if q.status = 'published' then
    raise exception '이미 발행된 항목입니다 (%)', p_id;
  end if;

  select * into prof from public.profiles where id = q.author_id;
  if not found then
    raise exception '작성자 프로필이 없습니다 (%)', q.author_id;
  end if;

  -- 이 파이프라인은 공식 계정 또는 봇 계정으로만 발행할 수 있습니다.
  -- 실수로 일반 사용자 계정이 큐에 들어가도 여기서 막힙니다.
  if not (prof.is_official or prof.is_bot) then
    raise exception '공식/봇 계정이 아닙니다 (%). profiles.is_official 또는 is_bot 을 먼저 켜주세요.', q.author_id;
  end if;

  -- 앱과 같은 방식의 시간 기반 ID: Date.now() * 1000 + 난수
  loop
    tries  := tries + 1;
    new_id := (floor(extract(epoch from clock_timestamp()) * 1000)::bigint) * 1000
              + floor(random() * 1000)::bigint;
    begin
      if q.kind = 'post' then
        insert into public.posts (id, author_id, cat, title, body, color, nick, emoji, img)
        values (new_id, q.author_id, coalesce(q.cat, 'free'), q.title, coalesce(q.body, ''),
                prof.color, coalesce(nullif(btrim(prof.nick), ''), '운영'), q.emoji, q.img);
      else
        insert into public.comments (id, post_id, parent_id, author_id, color, text)
        values (new_id, q.target_post_id, q.parent_comment_id, q.author_id, prof.color, q.text);
      end if;
      exit;
    exception when unique_violation then
      if tries >= 5 then
        raise;
      end if;
    end;
  end loop;

  update public.content_queue
     set status       = 'published',
         published_id = new_id,
         published_at = now(),
         attempts     = attempts + 1,
         last_error   = null
   where id = q.id;

  return new_id;
end $$;

revoke all on function public.publish_queue_item(bigint) from public;
revoke all on function public.publish_queue_item(bigint) from anon;
revoke all on function public.publish_queue_item(bigint) from authenticated;
grant execute on function public.publish_queue_item(bigint) to service_role;


-- ------------------------------------------------------------
--  5. 뱃지 떼기
--
--  아래를 실행하면 지금 공식으로 켜둔 계정들이 일반 이용자처럼 보입니다.
--  (앱에서는 술방울1 · 술방울2 … 처럼 색으로만 구분됩니다)
--
--  뱃지를 유지하고 싶으면 이 부분은 건너뛰세요.
-- ------------------------------------------------------------
update public.profiles
   set is_official = false,
       official_label = null
 where is_bot;

-- 이미 달려 있던 댓글의 뱃지도 함께 떼어냅니다.
update public.comments c
   set official = false, official_label = null, official_nick = null
 where c.official
   and exists (select 1 from public.profiles p where p.id = c.author_id and p.is_bot);

-- 색이 겹치면 한 글 안에서 같은 사람처럼 보입니다. 서로 다르게 흩어놓아요.
with numbered as (
  select id, row_number() over (order by created_at, id) - 1 as n
    from public.profiles where is_bot
)
update public.profiles p
   set color = (numbered.n * 3 % 8)::smallint
  from numbered
 where p.id = numbered.id;


-- 확인용
--   select nick, color, is_bot, is_official from profiles where is_bot order by nick;
--   select * from auto_comment_pick();
