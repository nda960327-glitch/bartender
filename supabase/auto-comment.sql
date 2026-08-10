-- ============================================================
--  자동 댓글 (AI)
--
--  official.sql 을 먼저 실행한 뒤 이 파일을 실행하세요.
--
--  하는 일
--    · 공식(봇) 계정이 최근 글에 짧은 댓글을 답니다.
--    · 언제 달지는 전부 여기 있는 상한이 정합니다.
--      10분 / 60분 / 24시간 각각의 구간 상한 + 매 호출마다 굴리는 확률.
--    · 문구는 서버(api/auto-comment.js)에서 Claude 가 씁니다.
--      DB 는 "지금 달아도 되는지"와 "어느 글에 달지"만 판단해요.
--
--  ⚠️ 자동 댓글도 공식 계정으로 나가므로 글 옆에 뱃지가 붙습니다.
--     (stamp_official 트리거) 사람이 쓴 척 숨기지 않는 편이 안전합니다.
-- ============================================================

-- ------------------------------------------------------------
--  1. 설정 (content_settings 확장)
-- ------------------------------------------------------------
alter table public.content_settings
  add column if not exists auto_comment_enabled boolean  not null default false,
  add column if not exists ac_cap_10min  smallint not null default 1  check (ac_cap_10min between 0 and 20),
  add column if not exists ac_cap_60min  smallint not null default 1  check (ac_cap_60min between 0 and 60),
  add column if not exists ac_cap_24h    smallint not null default 1  check (ac_cap_24h   between 0 and 300),
  add column if not exists ac_chance_pct smallint not null default 60 check (ac_chance_pct between 0 and 100),
  add column if not exists ac_max_age_h  smallint not null default 72 check (ac_max_age_h between 1 and 720),
  add column if not exists ac_max_comments smallint not null default 6 check (ac_max_comments between 0 and 50);

comment on column public.content_settings.auto_comment_enabled is
  '자동 댓글 스위치. 끄면 크론이 돌아도 아무 일도 하지 않습니다.';
comment on column public.content_settings.ac_cap_10min is
  '최근 10분 동안 최대 몇 개까지. 세 상한은 모두 동시에 지켜지므로 가장 빡빡한 것이 실질 상한입니다.';
comment on column public.content_settings.ac_chance_pct is
  '크론이 부를 때마다 굴리는 주사위. 60이면 열 번 중 여섯 번만 답니다 — 시계처럼 규칙적이지 않게 하려고요.';
comment on column public.content_settings.ac_max_age_h is
  '이 시간보다 오래된 글에는 달지 않습니다. 새벽에 옛날 글에 댓글이 붙으면 티가 나요.';
comment on column public.content_settings.ac_max_comments is
  '댓글이 이미 이만큼 달린 글은 건너뜁니다. 조용한 글을 살리는 게 목적입니다.';


-- ------------------------------------------------------------
--  2. 지금 달아도 되는지 + 어디에 달지
--
--  크론이 이 함수를 부릅니다. 달 곳이 없으면 아무것도 돌려주지 않아요.
--  글을 고르기만 하고 쓰지는 않습니다 — 문구는 서버가 만듭니다.
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

  -- 쉬는 시간에는 사람도 안 씁니다.
  cur_hour := extract(hour from (now() at time zone cfg.tz))::int;
  if cfg.quiet_from <> cfg.quiet_to then
    if cfg.quiet_from < cfg.quiet_to then
      quiet := cur_hour >= cfg.quiet_from and cur_hour < cfg.quiet_to;
    else
      quiet := cur_hour >= cfg.quiet_from or cur_hour < cfg.quiet_to;
    end if;
  end if;
  if quiet then
    return;
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

  -- 주사위. 이게 없으면 상한을 채우는 시각이 매일 똑같아집니다.
  if (random() * 100) >= cfg.ac_chance_pct then
    return;
  end if;

  -- 어느 글에, 누구로.
  --   · 공식 계정이 쓴 글에는 달지 않습니다 (봇끼리 대화하는 꼴이 됩니다)
  --   · 이미 그 계정이 댓글을 단 글도 건너뜁니다
  --   · 조용한 글을 고릅니다
  return query
  with persona as (
    select p.id, p.nick
      from public.profiles p
     where p.is_official
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
        from (select * from public.comments c2
               where c2.post_id = po.id
               order by c2.created_at
               limit 8) c
    ), '[]'::jsonb),
    pe.id,
    pe.nick
  from public.posts po
  cross join persona pe
  where po.created_at > now() - make_interval(hours => cfg.ac_max_age_h::int)
    and coalesce(po.author_id, '00000000-0000-0000-0000-000000000000'::uuid) <> pe.id
    and not exists (
      select 1 from public.profiles ap
       where ap.id = po.author_id and ap.is_official
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
--  3. 서버가 만든 문구를 실제로 올립니다
--
--  dedupe_key 가 unique 라서, 크론이 겹쳐 돌아도 같은 글에 같은 계정이
--  두 번 달지 않습니다.
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
  if not found or not prof.is_official then
    raise exception '공식 계정이 아닙니다.';
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
    return null;          -- 이미 누가 달았습니다. 조용히 넘어갑니다.
  end if;

  return public.publish_queue_item(qid);
end $$;

revoke all on function public.auto_comment_publish(uuid, bigint, text) from public;
revoke all on function public.auto_comment_publish(uuid, bigint, text) from anon;
revoke all on function public.auto_comment_publish(uuid, bigint, text) from authenticated;
grant execute on function public.auto_comment_publish(uuid, bigint, text) to service_role;


-- ------------------------------------------------------------
--  4. 최근 자동 댓글 (관리자 화면에서 봅니다)
-- ------------------------------------------------------------
create index if not exists content_queue_auto_idx
  on public.content_queue (published_at desc)
  where kind = 'comment' and source like 'auto:%';


-- ------------------------------------------------------------
--  5. 예약 발행이 자동 댓글에 발목 잡히지 않도록
--
--  자동 댓글도 같은 큐에 쌓입니다. 그대로 두면 publish_due_content 의
--  "하루 상한"과 "최소 간격"을 자동 댓글이 다 먹어버려요. 댓글 하나가
--  방금 나갔다는 이유로 예약해둔 글이 90분씩 밀립니다.
--
--  아래는 official.sql 의 함수와 같고, 두 군데 집계에서 자동 댓글만
--  빼놓은 것입니다. (auto_comment_pick 이 자기 상한을 따로 봅니다)
-- ------------------------------------------------------------
create or replace function public.publish_due_content(p_limit int default 1)
returns table (
  queue_id     bigint,
  kind         text,
  published_id bigint,
  result       text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg       public.content_settings%rowtype;
  q         public.content_queue%rowtype;
  cur_hour  int;
  quiet     boolean := false;
  last_at   timestamptz;
  today_cnt int;
  room      int;
  new_id    bigint;
begin
  select * into cfg from public.content_settings where id = 1;
  if not found or not cfg.enabled then
    return;
  end if;

  cur_hour := extract(hour from (now() at time zone cfg.tz))::int;

  if cfg.quiet_from <> cfg.quiet_to then
    if cfg.quiet_from < cfg.quiet_to then
      quiet := cur_hour >= cfg.quiet_from and cur_hour < cfg.quiet_to;
    else
      quiet := cur_hour >= cfg.quiet_from or cur_hour < cfg.quiet_to;
    end if;
  end if;
  if quiet then
    return;
  end if;

  select max(cq.published_at) into last_at
    from public.content_queue cq
   where cq.status = 'published'
     and coalesce(cq.source, '') not like 'auto:%';   -- ← 자동 댓글 제외

  if last_at is not null
     and now() - last_at < make_interval(mins => cfg.min_gap_min::int) then
    return;
  end if;

  select count(*) into today_cnt
    from public.content_queue cq
   where cq.status = 'published'
     and coalesce(cq.source, '') not like 'auto:%'    -- ← 자동 댓글 제외
     and (cq.published_at at time zone cfg.tz)::date = (now() at time zone cfg.tz)::date;

  room := least(greatest(p_limit, 0), greatest(cfg.daily_cap::int - today_cnt, 0));
  if room <= 0 then
    return;
  end if;

  for q in
    select * from public.content_queue cq
     where cq.status = 'approved'
       and cq.publish_after <= now()
     order by cq.publish_after
     limit room
     for update skip locked
  loop
    begin
      new_id := public.publish_queue_item(q.id);

      queue_id     := q.id;
      kind         := q.kind;
      published_id := new_id;
      result       := 'published';
      return next;

    exception when others then
      update public.content_queue
         set attempts      = attempts + 1,
             last_error    = left(sqlerrm, 500),
             status        = case when attempts + 1 >= 3 then 'failed' else 'approved' end,
             publish_after = case when attempts + 1 >= 3
                                  then publish_after
                                  else now() + interval '10 minutes' end
       where id = q.id;

      queue_id     := q.id;
      kind         := q.kind;
      published_id := null;
      result       := 'error: ' || left(sqlerrm, 200);
      return next;
    end;
  end loop;

  return;
end $$;

revoke all on function public.publish_due_content(int) from public;
revoke all on function public.publish_due_content(int) from anon;
revoke all on function public.publish_due_content(int) from authenticated;
grant execute on function public.publish_due_content(int) to service_role;
