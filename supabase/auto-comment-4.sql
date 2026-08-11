-- ============================================================
--  자동 답글 (대댓글)
--
--  auto-comment.sql → -2 → -why → -3 다음에 실행하세요.
--
--  지금까지는 글에만 댓글을 달았습니다. 사람이 댓글을 써도 아무 반응이
--  없었어요. 답글이 붙으면 그 사람에게 알림이 가고, 반응을 받았다고
--  느낍니다 — 커뮤니티가 사는 건 사실 이쪽입니다.
--
--  ac_reply_pct 확률로 "글에 새 댓글" 대신 "기존 댓글에 답글"을 고릅니다.
--  답글 대상은 사람이 쓴 원댓글 중 아직 아무도 답하지 않은 것입니다.
-- ============================================================

alter table public.content_settings
  add column if not exists ac_reply_pct smallint not null default 50
    check (ac_reply_pct between 0 and 100);

comment on column public.content_settings.ac_reply_pct is
  '답글을 고를 확률(%). 나머지는 글에 새 댓글을 답니다. 0 이면 답글을 아예 안 답니다.';


-- 돌려주는 열이 늘어나므로 먼저 지웁니다 (create or replace 로는 못 바꿔요).
drop function if exists public.auto_comment_pick();

create or replace function public.auto_comment_pick()
returns table (
  post_id      bigint,
  post_title   text,
  post_body    text,
  post_cat     text,
  post_age_h   numeric,
  comments     jsonb,
  author_id    uuid,
  author_nick  text,
  parent_id    bigint,     -- 답글이 붙을 곳 (스레드 원댓글). 새 댓글이면 null
  reply_to     bigint,     -- 지금 답하려는 그 댓글 (중복 방지용)
  parent_text  text        -- 그 댓글의 내용
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
  pe       record;
begin
  select * into cfg from public.content_settings where id = 1;
  if not found or not cfg.auto_comment_enabled then
    return;
  end if;

  if not cfg.ac_ignore_quiet and cfg.quiet_from <> cfg.quiet_to then
    cur_hour := extract(hour from (now() at time zone cfg.tz))::int;
    if cfg.quiet_from < cfg.quiet_to then
      quiet := cur_hour >= cfg.quiet_from and cur_hour < cfg.quiet_to;
    else
      quiet := cur_hour >= cfg.quiet_from or cur_hour < cfg.quiet_to;
    end if;
    if quiet then return; end if;
  end if;

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

  -- 이번에 쓸 계정 하나
  select p.id, p.nick into pe
    from public.profiles p
   where p.is_bot
   order by random()
   limit 1;
  if pe.id is null then return; end if;

  -- ── 1) 답글 시도 ────────────────────────────────────────────
  --
  -- 사람이 쓴 댓글이면 원댓글이든 답글이든 다 대상입니다. 그래야
  -- "봇 댓글 → 사람이 답글 → 봇이 또 답글" 처럼 대화가 이어져요.
  --
  -- 이 앱의 답글은 한 단계까지만 들어갑니다 (원댓글 아래에 나란히 붙어요).
  -- 그래서 답글에 답할 때도 붙는 곳은 그 스레드의 원댓글입니다.
  --
  -- 봇이 봇에게 답하는 일은 없습니다. 사람이 말을 걸어야만 이어져요.
  if (random() * 100) < cfg.ac_reply_pct then
    return query
    select
      po.id,
      po.title,
      left(coalesce(po.body, ''), 1200),
      po.cat,
      round(extract(epoch from (now() - po.created_at)) / 3600.0, 1),
      -- 그 스레드가 지금까지 어떻게 흘러왔는지 (누가 말했는지 포함)
      coalesce((
        select jsonb_agg(jsonb_build_object(
                 'nick', case when tp.is_bot then '나' else '술방울' end,
                 'text', left(t.text, 200)) order by t.created_at)
          from public.comments t
          left join public.profiles tp on tp.id = t.author_id
         where t.id = root.id or t.parent_id = root.id
      ), '[]'::jsonb),
      pe.id,
      pe.nick,
      root.id,                       -- 답글이 붙을 곳 (스레드 원댓글)
      c.id,                          -- 지금 답하려는 그 댓글
      left(c.text, 500)              -- 그 내용
    from public.comments c
    join public.posts po on po.id = c.post_id
    join public.comments root
      on root.id = coalesce(c.parent_id, c.id)     -- 스레드의 뿌리
    where c.created_at > now() - make_interval(hours => cfg.ac_max_age_h::int)
      and c.author_id <> pe.id
      -- 사람이 쓴 말에만 답합니다 (봇끼리 대화하는 꼴이 되면 안 돼요)
      and not exists (
        select 1 from public.profiles ap
         where ap.id = c.author_id and (ap.is_bot or ap.is_official))
      -- 이 계정이 이미 그 말에 답했으면 제외
      and not exists (
        select 1 from public.content_queue q
         where q.source = 'auto:reply:' || c.id and q.author_id = pe.id)
      -- 한 스레드에 봇 답글이 너무 쌓이지 않게 막습니다
      and (
        select count(*) from public.comments r
         join public.profiles rp on rp.id = r.author_id
        where r.parent_id = root.id and rp.is_bot
      ) < 2
    order by c.created_at desc      -- 최근에 달린 말부터
    limit 1;

    if found then return; end if;
    -- 답글 대상이 없으면 아래로 내려가 글에 답니다.
  end if;

  -- ── 2) 글에 새 댓글 ─────────────────────────────────────────
  return query
  select
    po.id,
    po.title,
    left(coalesce(po.body, ''), 1200),
    po.cat,
    round(extract(epoch from (now() - po.created_at)) / 3600.0, 1),
    coalesce((
      select jsonb_agg(jsonb_build_object('nick', '익명', 'text', left(cc.text, 200))
                       order by cc.created_at)
        from (select c2.created_at, c2.text
                from public.comments c2
               where c2.post_id = po.id
               order by c2.created_at
               limit 8) cc
    ), '[]'::jsonb),
    pe.id,
    pe.nick,
    null::bigint,
    null::bigint,
    null::text
  from public.posts po
  where po.created_at > now() - make_interval(hours => cfg.ac_max_age_h::int)
    and coalesce(po.author_id, '00000000-0000-0000-0000-000000000000'::uuid) <> pe.id
    and not exists (
      select 1 from public.profiles ap
       where ap.id = po.author_id and (ap.is_bot or ap.is_official))
    and (select count(*) from public.comments c3 where c3.post_id = po.id) <= cfg.ac_max_comments
    and not exists (
      select 1 from public.content_queue q
       where q.target_post_id = po.id and q.author_id = pe.id
         and q.parent_comment_id is null)
  order by random()
  limit 1;
end $$;

revoke all on function public.auto_comment_pick() from public;
revoke all on function public.auto_comment_pick() from anon;
revoke all on function public.auto_comment_pick() from authenticated;
grant execute on function public.auto_comment_pick() to service_role;


-- ------------------------------------------------------------
--  등록 — 부모 댓글을 받을 수 있게
-- ------------------------------------------------------------
create or replace function public.auto_comment_publish(
  p_author   uuid,
  p_post_id  bigint,
  p_text     text,
  p_parent   bigint default null,   -- 답글이 붙을 곳 (스레드 원댓글)
  p_reply_to bigint default null    -- 지금 답하는 그 댓글 (중복 방지)
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  prof public.profiles%rowtype;
  qid  bigint;
  body text := btrim(p_text);
  dkey text;
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
  if p_parent is not null
     and not exists (select 1 from public.comments where id = p_parent) then
    raise exception '답글을 달 댓글을 찾을 수 없습니다.';
  end if;

  /* 중복을 막는 기준이 둘로 갈립니다.
       새 댓글 → 글 하나에 이 계정이 한 번
       답글   → "그 말" 하나에 이 계정이 한 번
     답글을 스레드 원댓글 기준으로 막으면 대화가 한 번 오가고 끝나버려요.
     그래서 실제로 답하는 대상(p_reply_to)을 기준으로 삼습니다. */
  dkey := case when p_reply_to is null
               then 'auto:' || p_post_id || ':' || p_author
               else 'auto:r' || p_reply_to || ':' || p_author end;

  insert into public.content_queue
    (kind, status, author_id, target_post_id, parent_comment_id, text,
     publish_after, source, dedupe_key, note)
  values
    ('comment', 'approved', p_author, p_post_id, p_parent, body, now(),
     -- auto_comment_pick 이 "이미 답한 말"을 걸러낼 때 이 값을 봅니다
     case when p_reply_to is null
          then 'auto:' || p_post_id
          else 'auto:reply:' || p_reply_to end,
     dkey,
     case when p_parent is null then 'AI 자동 댓글' else 'AI 자동 답글' end)
  on conflict (dedupe_key) do nothing
  returning id into qid;

  if qid is null then
    return null;
  end if;

  return public.publish_queue_item(qid);
end $$;

revoke all on function public.auto_comment_publish(uuid, bigint, text, bigint, bigint) from public;
revoke all on function public.auto_comment_publish(uuid, bigint, text, bigint, bigint) from anon;
revoke all on function public.auto_comment_publish(uuid, bigint, text, bigint, bigint) from authenticated;
grant execute on function public.auto_comment_publish(uuid, bigint, text, bigint, bigint) to service_role;

/* 옛 서명들을 치웁니다.
   기본값이 있는 인자 때문에, 3개·4개짜리가 남아 있으면 서버가 부를 때
   "어느 함수를 말하는지 모르겠다"는 오류가 납니다. */
drop function if exists public.auto_comment_publish(uuid, bigint, text);
drop function if exists public.auto_comment_publish(uuid, bigint, text, bigint);
