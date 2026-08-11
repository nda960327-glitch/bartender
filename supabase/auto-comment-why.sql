-- ============================================================
--  자동 댓글이 왜 안 나가는지 알려주는 함수
--
--  auto-comment.sql, auto-comment-2.sql 다음에 실행하세요.
--
--  auto_comment_pick() 은 조건이 안 맞으면 그냥 빈손으로 돌아옵니다.
--  어디서 막혔는지는 알려주지 않아요. 그래서 관문을 하나씩 되짚어
--  "여기서 막혔다"를 돌려주는 함수를 따로 둡니다.
--
--  관리자만 부를 수 있고, 아무것도 바꾸지 않습니다 (읽기만).
-- ============================================================

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

  -- 1. 전체 스위치
  step := '전체 자동 발행 스위치';
  ok := cfg.enabled;
  detail := case when cfg.enabled then '켜짐'
                 else '꺼짐 — 관리자 > 봇 > 맨 위 "자동 발행"을 켜세요. 이게 꺼져 있으면 자동 댓글도 안 나갑니다.' end;
  return next;

  -- 2. 자동 댓글 스위치
  step := 'AI 자동 댓글 스위치';
  ok := coalesce(cfg.auto_comment_enabled, false);
  detail := case when coalesce(cfg.auto_comment_enabled, false) then '켜짐' else '꺼짐' end;
  return next;

  -- 3. 쉬는 시간
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

  -- 4. 댓글 달 계정
  select count(*) into bots from public.profiles where is_bot;
  step := '댓글 달 계정 (is_bot)';
  ok := bots > 0;
  detail := bots || '개' || case when bots = 0
    then ' — 없습니다. auto-comment-2.sql 을 실행했는지, profiles.is_bot 이 켜져 있는지 보세요.'
    else '' end;
  return next;

  -- 5. 구간 상한
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

  -- 6. 최근 글
  select count(*) into recent from public.posts po
   where po.created_at > now() - make_interval(hours => cfg.ac_max_age_h::int);
  step := '최근 글';
  ok := recent > 0;
  detail := cfg.ac_max_age_h || '시간 안에 올라온 글 ' || recent || '개'
         || case when recent = 0 then ' — 달 글이 없습니다.' else '' end;
  return next;

  -- 7. 실제로 달 수 있는 글 (모든 조건 적용)
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
              ' — 조건에 맞는 글이 없습니다. 봇이 쓴 글은 제외되고, 댓글이 '
              || cfg.ac_max_comments || '개 넘게 달린 글도 건너뜁니다. 이미 모든 봇이 댓글을 단 글도 빠져요.'
            else '' end;
  return next;

  -- 8. 주사위
  step := '확률';
  ok := true;
  detail := cfg.ac_chance_pct || '% — 크론이 부를 때마다 굴립니다. 위가 다 통과해도 이만큼만 답니다.';
  return next;

  -- 9. 최근 실패 기록
  step := '최근 실패';
  select count(*) into n10 from public.content_queue q
   where q.kind = 'comment' and q.status = 'failed';
  ok := n10 = 0;
  detail := case when n10 = 0 then '없음'
    else n10 || '건 — content_queue 에서 last_error 를 보세요.' end;
  return next;

  return;
end $$;

revoke all on function public.auto_comment_why() from public;
revoke all on function public.auto_comment_why() from anon;
grant execute on function public.auto_comment_why() to authenticated;
