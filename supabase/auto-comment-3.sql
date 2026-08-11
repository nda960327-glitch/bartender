-- ============================================================
--  자동 댓글을 예약 발행에서 떼어냅니다
--
--  auto-comment.sql → auto-comment-2.sql → auto-comment-why.sql
--  다음에 실행하세요.
--
--  무엇이 문제였나
--    auto_comment_pick 이 content_settings.enabled(전체 자동 발행)까지
--    켜져 있어야 동작하게 만들어 두었습니다. 그래서 "댓글만 켜고 싶다"가
--    불가능했어요 — 댓글을 켜려면 큐에 쌓인 예약 글까지 전부 풀어야 했습니다.
--
--    둘은 상관없는 기능입니다. enabled 는 이제 예약 글 발행만 담당하고,
--    자동 댓글은 auto_comment_enabled 하나로만 켜고 끕니다.
-- ============================================================

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
  -- ↓ enabled 는 보지 않습니다. 예약 글 발행과는 별개예요.
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
    if quiet then
      return;
    end if;
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

  return query
  with persona as (
    select p.id, p.nick
      from public.profiles p
     where p.is_bot
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
--  진단 함수도 같이 고칩니다.
--  전체 스위치는 이제 자동 댓글을 막지 않으므로, 막힌 곳이 아니라
--  "예약 글에만 해당된다"는 안내로 바꿉니다.
-- ------------------------------------------------------------
create or replace function public.auto_comment_why()
returns table (
  step   text,
  ok     boolean,
  detail text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg       public.content_settings%rowtype;
  cur_hour  int;
  quiet     boolean := false;
  bots      int;
  n10       int;
  n60       int;
  n24       int;
  nfail     int;
  recent    int;
  eligible  int;
begin
  if not public.is_admin() then
    raise exception '관리자만 사용할 수 있습니다.';
  end if;

  select * into cfg from public.content_settings where id = 1;
  if not found then
    step := '설정'; ok := false;
    detail := 'content_settings 행이 없습니다. official.sql 을 실행하세요.';
    return next; return;
  end if;

  step := 'AI 자동 댓글 스위치';
  ok := coalesce(cfg.auto_comment_enabled, false);
  detail := case when coalesce(cfg.auto_comment_enabled, false) then '켜짐' else '꺼짐' end;
  return next;

  -- 예약 글 발행 스위치는 자동 댓글과 무관합니다. 참고로만 보여줘요.
  step := '(참고) 예약 글 자동 발행';
  ok := true;
  detail := case when cfg.enabled then '켜짐' else '꺼짐' end
         || ' — 예약된 글에만 해당됩니다. 자동 댓글과는 상관없어요.';
  return next;

  cur_hour := extract(hour from (now() at time zone cfg.tz))::int;
  if coalesce(cfg.ac_ignore_quiet, false) then
    quiet := false;
  elsif cfg.quiet_from <> cfg.quiet_to then
    if cfg.quiet_from < cfg.quiet_to then
      quiet := cur_hour >= cfg.quiet_from and cur_hour < cfg.quiet_to;
    else
      quiet := cur_hour >= cfg.quiet_from or cur_hour < cfg.quiet_to;
    end if;
  end if;
  step := '쉬는 시간';
  ok := not quiet;
  detail := case
    when coalesce(cfg.ac_ignore_quiet, false) then '무시함 (24시간 답니다) · 지금 ' || cur_hour || '시'
    when quiet then '지금은 쉬는 시간입니다 (' || cfg.quiet_from || '~' || cfg.quiet_to || '시) · 지금 ' || cur_hour || '시'
    else '해당 없음 · 지금 ' || cur_hour || '시' end;
  return next;

  select count(*) into bots from public.profiles where is_bot;
  step := '댓글 달 계정 (is_bot)';
  ok := bots > 0;
  detail := bots || '개' || case when bots = 0
    then ' — 없습니다. auto-comment-2.sql 을 실행했는지 보세요.' else '' end;
  return next;

  select count(*) into n10 from public.content_queue q
   where q.kind = 'comment' and q.status = 'published'
     and q.source like 'auto:%' and q.published_at > now() - interval '10 minutes';
  select count(*) into n60 from public.content_queue q
   where q.kind = 'comment' and q.status = 'published'
     and q.source like 'auto:%' and q.published_at > now() - interval '60 minutes';
  select count(*) into n24 from public.content_queue q
   where q.kind = 'comment' and q.status = 'published'
     and q.source like 'auto:%' and q.published_at > now() - interval '24 hours';
  step := '구간 상한';
  ok := n10 < cfg.ac_cap_10min and n60 < cfg.ac_cap_60min and n24 < cfg.ac_cap_24h;
  detail := '10분 ' || n10 || '/' || cfg.ac_cap_10min
         || ' · 60분 ' || n60 || '/' || cfg.ac_cap_60min
         || ' · 24시간 ' || n24 || '/' || cfg.ac_cap_24h
         || case when n24 >= cfg.ac_cap_24h then '  ← 24시간 상한을 다 썼습니다' else '' end;
  return next;

  select count(*) into recent from public.posts po
   where po.created_at > now() - make_interval(hours => cfg.ac_max_age_h::int);
  step := '최근 글';
  ok := recent > 0;
  detail := cfg.ac_max_age_h || '시간 안에 올라온 글 ' || recent || '개'
         || case when recent = 0 then ' — 달 글이 없습니다.' else '' end;
  return next;

  select count(*) into eligible
    from public.posts po
   where po.created_at > now() - make_interval(hours => cfg.ac_max_age_h::int)
     and not exists (
       select 1 from public.profiles ap
        where ap.id = po.author_id and (ap.is_bot or ap.is_official))
     and (select count(*) from public.comments c3 where c3.post_id = po.id) <= cfg.ac_max_comments
     and exists (
       select 1 from public.profiles pe
        where pe.is_bot
          and pe.id <> coalesce(po.author_id, '00000000-0000-0000-0000-000000000000'::uuid)
          and not exists (
            select 1 from public.content_queue q
             where q.target_post_id = po.id and q.author_id = pe.id));
  step := '지금 달 수 있는 글';
  ok := eligible > 0;
  detail := eligible || '개'
         || case when eligible = 0 then
              ' — 봇이 쓴 글은 제외되고, 댓글이 ' || cfg.ac_max_comments
              || '개 넘게 달린 글도 건너뜁니다. 이미 모든 봇이 단 글도 빠져요.'
            else '' end;
  return next;

  step := '확률';
  ok := true;
  detail := cfg.ac_chance_pct || '% — 크론이 부를 때마다 굴립니다.';
  return next;

  select count(*) into nfail from public.content_queue q
   where q.kind = 'comment' and q.status = 'failed';
  step := '최근 실패';
  ok := nfail = 0;
  detail := case when nfail = 0 then '없음'
    else nfail || '건 — content_queue 에서 last_error 를 보세요.' end;
  return next;

  return;
end $$;

revoke all on function public.auto_comment_why() from public;
revoke all on function public.auto_comment_why() from anon;
grant execute on function public.auto_comment_why() to authenticated;
