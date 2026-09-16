-- ============================================================
--  하우스 패스 업데이트 한 번에 넣기 (자동 생성 — 직접 고치지 말고 tools/build-sql.js 로 다시 만드세요)
--
--  먼저 들어가 있어야 하는 것: pass.sql · pass-member.sql · pass-lifecycle.sql · phone.sql
--  Supabase 대시보드 → SQL Editor → 이 파일 전체를 붙여넣고 Run.
--  여러 번 돌려도 안전하고, 중간에 실패하면 전부 되돌려져요.
--
--  들어있는 것:
--   1. pass-refund.sql          환불 계산기 설정 · pass_json(총 잔수)
--   2. pass-owner.sql           운영자 추가 (같은 닉네임 구분)
--   3. pass-once.sql            한 번만 결제 할증
--   4. pass-capacity.sql        상품별 정원 · 신청 규칙
--   5. pass-goal.sql            월 구독 매출 목표
--   6. pass-dashboard-fix.sql   지표 집계 오류 수정
--   7. guard.sql                방어선 — 요청 횟수 제한 · 칸 잠금 · 기록 · 장애 보상 · 수기 기록
--   8. pass-offer.sql           빈자리 알림 · 스캔 보너스
--   9. pass-gift.sql            잔 선물 링크
-- ============================================================

begin;

-- ##################### pass-refund.sql #####################
-- 하우스 패스 환불 계산기 설정 (2.49.1)
--   해지 때 이용한 잔을 빼는 잔당 가격과 위약금 비율을 가게마다 둡니다. 기본 15,000원 · 10%.
--   pass_json 에 패스 기간 전체 이용 잔(total_drinks)을 더해 계산이 정확해져요.
--
-- 실행 순서: pass.sql → pass-member.sql → pass-lifecycle.sql → 이 파일.

alter table public.bar_pass_settings add column if not exists refund_drink_price integer  not null default 15000 check (refund_drink_price >= 0);
alter table public.bar_pass_settings add column if not exists refund_penalty_pct smallint not null default 10 check (refund_penalty_pct between 0 and 100);

create or replace function public.pass_json(p_id bigint) returns json
language plpgsql stable security definer set search_path = public as $fn$
declare
  p public.passes%rowtype; st public.bar_pass_settings%rowtype;
  today date := public.kst_today(); mon text := to_char(public.kst_today(), 'YYYY-MM');
begin
  select * into p from public.passes where id = p_id;
  if not found then return null; end if;
  select * into st from public.bar_pass_settings where bar_key = p.bar_key;
  return json_build_object(
    'id', p.id, 'bar_key', p.bar_key, 'bar_name', p.bar_name,
    'plan_id', p.plan_id, 'plan_name', p.plan_name, 'status', p.status,
    'kind', p.kind, 'days', p.days, 'drinks_per_day', p.drinks_per_day, 'monthly_cap', p.monthly_cap,
    'team_size', p.team_size, 'team_id', p.team_id, 'invite_code', p.invite_code,
    'starts_at', p.starts_at, 'ends_at', p.ends_at, 'price', p.price, 'duration_days', p.duration_days,
    'paid_via', p.paid_via, 'auto_renew', p.auto_renew, 'last_payment_error', p.last_payment_error,
    'created_at', p.created_at, 'user_id', p.user_id,
    'nick', (select nick from public.profiles where id = p.user_id),
    'member_name', p.member_name, 'member_phone', p.member_phone,
    'replaces_id', p.replaces_id,
    'replaces_name', (select plan_name from public.passes where id = p.replaces_id),
    'cancel_requested_at', p.cancel_requested_at, 'cancel_reason', p.cancel_reason,
    'renew_requested_at', p.renew_requested_at, 'closed_reason', p.closed_reason,
    'refund_policy', coalesce(st.refund_policy, ''),
    'refund_drink_price', coalesce(st.refund_drink_price, 15000), 'refund_penalty_pct', coalesce(st.refund_penalty_pct, 10),
    'total_drinks', (select coalesce(sum(drinks), 0) from public.pass_visits where pass_id = p.id),
    'today_drinks', (select coalesce(sum(drinks), 0) from public.pass_visits where pass_id = p.id and day = today),
    'month_drinks', (select coalesce(sum(drinks), 0) from public.pass_visits where pass_id = p.id and to_char(day, 'YYYY-MM') = mon),
    'stamps', (select count(distinct day) from public.pass_visits where pass_id = p.id and action = 'enter' and to_char(day, 'YYYY-MM') = mon),
    'stamp_goal', coalesce(st.stamp_goal, 4),
    'special_drink', coalesce(nullif(st.special_drink, ''), '이달의 한정 칵테일'),
    'entered_today', exists (select 1 from public.pass_visits where pass_id = p.id and day = today and action = 'enter'),
    'side_today', exists (select 1 from public.pass_visits where pass_id = p.id and day = today and action = 'enter' and side),
    'reward_pending', exists (select 1 from public.pass_rewards where pass_id = p.id and redeemed_at is null),
    'rewards_used', (select count(*) from public.pass_rewards where pass_id = p.id and redeemed_at is not null),
    'members', (select count(*) from public.passes where team_id = p.id and status in ('active', 'grace')),
    'lead_nick', (select pr.nick from public.passes l join public.profiles pr on pr.id = l.user_id where l.id = p.team_id),
    'team_members', case when p.kind = 'team' and p.team_id is null then
      (select coalesce(json_agg(json_build_object('id', m.id, 'nick', pr.nick, 'member_name', m.member_name, 'member_phone', m.member_phone, 'starts_at', m.starts_at, 'status', m.status) order by m.id), '[]'::json)
         from public.passes m left join public.profiles pr on pr.id = m.user_id
        where m.team_id = p.id and m.status in ('active', 'grace'))
      else '[]'::json end
  );
end $fn$;
revoke all on function public.pass_json(bigint) from public;

-- ##################### pass-owner.sql #####################
-- 운영자 추가 — 같은 닉네임이 여러 명일 때 골라서 지정 (2.56.3)
-- (phone.sql 의 profile_private 표가 있어야 이름·번호가 가려진 채로 나와요. 없으면 빈칸.)
--
-- 기존 pass_add_owner(닉네임) 은 같은 닉네임이 있으면 먼저 가입한 사람을 잡아 엉뚱한 사람이 운영자가 될 수 있어요.
-- 그래서 (1) 닉네임으로 후보를 찾고 (2) 고른 사람의 계정 번호로 지정하는 함수 두 개를 더합니다.
--
-- 실행: Supabase 대시보드 → SQL Editor 에 붙여넣고 Run. (pass.sql 다음에)

-- 0) 비공개 표에 이름 칸 (phone.sql 을 넣은 서버만)
do $$
begin
  if to_regclass('public.profile_private') is not null then
    alter table public.profile_private add column if not exists name text not null default '';
  end if;
end $$;

-- 1) 닉네임으로 후보 찾기 — 닉네임·물방울 색·가입일·쓴 글 수 + 가린 이름·번호 (김*수 · 010-****-5678)
--    가게 운영자나 관리자만 부를 수 있어요. 이름·번호를 통째로 보여주면 남의 개인정보가 새니까 가운데를 가립니다.
create or replace function public.pass_find_nick(p_nick text) returns json
language plpgsql stable security definer set search_path = public as $fn$
begin
  if auth.uid() is null then raise exception '로그인이 필요해요.'; end if;
  if not (public.is_admin() or exists (select 1 from public.bar_owners where user_id = auth.uid())) then
    raise exception '가게 운영자만 찾을 수 있어요.';
  end if;
  if nullif(btrim(coalesce(p_nick, '')), '') is null then return '[]'::json; end if;
  return (
    select coalesce(json_agg(json_build_object(
      'id', p.id, 'nick', p.nick, 'color', p.color, 'joined', p.created_at::date,
      'posts', (select count(*) from public.posts where author_id = p.id),
      'bars', (select count(*) from public.bar_owners where user_id = p.id),
      'name_masked', (select case when char_length(v.name) <= 1 then v.name
                                  when char_length(v.name) = 2 then left(v.name, 1) || '*'
                                  else left(v.name, 1) || repeat('*', char_length(v.name) - 2) || right(v.name, 1) end
                        from public.profile_private v where v.id = p.id),
      'phone_masked', (select case when char_length(v.phone) >= 8 then left(v.phone, 3) || '-****-' || right(v.phone, 4) else null end
                         from public.profile_private v where v.id = p.id)
    ) order by p.created_at), '[]'::json)
    from (select * from public.profiles where btrim(nick) = btrim(p_nick) order by created_at limit 10) p
  );
end $fn$;
revoke all on function public.pass_find_nick(text) from public;
grant execute on function public.pass_find_nick(text) to authenticated;

-- 2) 계정 번호로 운영자 지정 (기존 운영자·관리자만)
create or replace function public.pass_add_owner_id(p_bar text, p_bar_name text, p_user uuid) returns json
language plpgsql security definer set search_path = public as $fn$
declare target_nick text;
begin
  if not (public.is_admin() or public.is_bar_owner(p_bar)) then raise exception '운영자나 관리자만 지정할 수 있어요.'; end if;
  select nick into target_nick from public.profiles where id = p_user;
  if target_nick is null then raise exception '그 계정을 찾을 수 없어요.'; end if;
  insert into public.bar_owners (bar_key, user_id, bar_name) values (p_bar, p_user, coalesce(p_bar_name, ''))
    on conflict do nothing;
  insert into public.bar_pass_settings (bar_key, bar_name) values (p_bar, coalesce(p_bar_name, ''))
    on conflict (bar_key) do nothing;
  return json_build_object('user_id', p_user, 'nick', target_nick);
end $fn$;
revoke all on function public.pass_add_owner_id(text, text, uuid) from public;
grant execute on function public.pass_add_owner_id(text, text, uuid) to authenticated;

-- ##################### pass-once.sql #####################
-- "이번 한 번만" 결제 할증 (2.59)
--   카드 자동결제(정기 구독)가 정가이고, 한 번만 내는 결제는 n% 더 받습니다. 기본 20%.
--   원데이·3개월권처럼 원래 1회인 상품에는 붙지 않아요. 가게마다 상품·설정에서 바꿀 수 있어요.
--
-- 실행: Supabase 대시보드 → SQL Editor 에 붙여넣고 Run. (pass.sql 다음에)
alter table public.bar_pass_settings add column if not exists once_markup_pct smallint not null default 20 check (once_markup_pct between 0 and 100);

-- ##################### pass-capacity.sql #####################
-- 상품별 정원 (2.60)
--   30석 가게에 회원 100명이 오면 미어터집니다. 상품마다 정원을 두어 "정원 마감"이 되면 신청을 막고,
--   자리가 나면(해지·만료) 다시 열립니다. 비우면 정원 없음. 팀 패스는 팀 수로 셉니다.
--
-- 실행 순서: pass.sql → pass-member.sql → pass-lifecycle.sql → 이 파일.
--   Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.

alter table public.pass_plans add column if not exists max_members smallint check (max_members is null or max_members between 1 and 500);

-- 1) 상품별 현재 인원 — 신청 중·이용 중·유예 (팀은 팀장만 세요)
create or replace function public.pass_plan_seats(p_bar text) returns json
language sql stable security definer set search_path = public as $fn$
  select coalesce(json_object_agg(plan_id::text, n), '{}'::json)
  from (select plan_id, count(*) as n from public.passes
        where bar_key = p_bar and plan_id is not null and team_id is null
          and status in ('requested', 'active', 'grace')
        group by plan_id) s;
$fn$;
revoke all on function public.pass_plan_seats(text) from public;
grant execute on function public.pass_plan_seats(text) to authenticated;

-- 2) 신청 규칙 — pass-lifecycle.sql 의 guard_pass_insert 에 정원 검사만 더한 것
create or replace function public.guard_pass_insert() returns trigger
language plpgsql security definer set search_path = public as $fn$
declare pl public.pass_plans%rowtype; st public.bar_pass_settings%rowtype; old public.passes%rowtype; taken integer;
begin
  new.updated_at := now();
  if auth.uid() is null or current_setting('bartalk.trusted', true) = '1' then return new; end if;
  if public.is_banned() then raise exception '이용이 제한된 계정이에요.'; end if;
  if new.user_id <> auth.uid() then raise exception '본인 패스만 신청할 수 있어요.'; end if;

  select * into pl from public.pass_plans where id = new.plan_id and active;
  if not found then raise exception '지금 판매 중인 상품이 아니에요.'; end if;
  select * into st from public.bar_pass_settings where bar_key = pl.bar_key;
  if not found or not st.enabled then raise exception '이 가게는 아직 패스를 받지 않아요.'; end if;

  if new.replaces_id is not null then
    select * into old from public.passes where id = new.replaces_id;
    if not found or old.user_id <> new.user_id or old.bar_key <> pl.bar_key
       or old.status not in ('active', 'grace') or old.team_id is not null then
      raise exception '바꿀 수 있는 패스가 아니에요.';
    end if;
    if pl.kind = 'oneday' then raise exception '원데이로는 바꿀 수 없어요.'; end if;
    if pl.id = old.plan_id then raise exception '지금 쓰는 상품과 같아요.'; end if;
  end if;

  if exists (select 1 from public.passes
             where user_id = new.user_id and bar_key = pl.bar_key and status in ('requested', 'active', 'grace')
               and id is distinct from new.replaces_id) then
    raise exception '이 가게에 이미 신청 중이거나 쓰고 있는 패스가 있어요.';
  end if;

  -- 정원
  if pl.max_members is not null then
    select count(*) into taken from public.passes
      where plan_id = pl.id and team_id is null and status in ('requested', 'active', 'grace');
    if taken >= pl.max_members then
      raise exception '이 상품은 정원(%명)이 찼어요. 자리가 나면 다시 열려요.', pl.max_members;
    end if;
  end if;

  new.bar_key := pl.bar_key;          new.bar_name := st.bar_name;
  new.plan_name := pl.name;           new.kind := pl.kind;              new.days := pl.days;
  new.drinks_per_day := pl.drinks_per_day; new.monthly_cap := pl.monthly_cap;
  new.team_size := pl.team_size;      new.duration_days := pl.duration_days; new.price := pl.price;
  new.status := 'requested';          new.starts_at := null;            new.ends_at := null;
  new.team_id := null;                new.invite_code := null;
  new.paid_via := 'manual';           new.auto_renew := false;
  new.renew_attempts := 0;            new.next_retry_at := null;        new.last_payment_error := null;
  new.qr_nonce := null;               new.qr_at := null;                new.expiry_notified_at := null;
  new.approved_by := null;            new.approved_at := null;
  new.cancel_requested_at := null;    new.cancel_reason := '';          new.renew_requested_at := null;
  new.closed_reason := '';
  return new;
end $fn$;

-- ##################### pass-goal.sql #####################
-- 월 구독 매출 목표 (2.62)
--   운영자 화면 맨 위에 "이달 구독 매출 / 목표" 가 늘 보여요. 목표는 가게마다 두고 기본 1,500만 원.
--   이 파일을 안 넣어도 앱은 목표를 기기 안에 저장해 두고 씁니다(운영자 기기마다 따로).
--
-- 실행: Supabase 대시보드 → SQL Editor 에 붙여넣고 Run. (pass.sql 다음에)
alter table public.bar_pass_settings add column if not exists goal_monthly integer not null default 15000000 check (goal_monthly >= 0);

-- ##################### pass-dashboard-fix.sql #####################
-- 지표 집계 오류 수정 (2.62.1)
--   pass_dashboard 안의 변수 이름(drinks 등)이 pass_visits 의 칸 이름과 같아서
--   "column reference \"drinks\" is ambiguous" 로 지표 탭 서버 집계가 실패했어요. 변수에 v_ 를 붙였습니다.
--
-- 실행: Supabase 대시보드 → SQL Editor 에 붙여넣고 Run. (이미 pass.sql 을 넣은 서버용. 새 서버는 pass.sql 만 넣으면 돼요)

create or replace function public.pass_dashboard(p_bar text) returns json
language plpgsql stable security definer set search_path = public as $fn$
declare
  today date := public.kst_today(); m0 date := date_trunc('month', public.kst_today())::date;
  v_members int; v_pending int; v_visits int; v_sides int; v_tt_days int; v_tt_visits int; v_drinks int; v_revenue int;
begin
  if not (public.is_bar_owner(p_bar) or public.is_admin()) then raise exception '이 가게 운영자만 볼 수 있어요.'; end if;
  select count(*) into v_members from public.passes where bar_key = p_bar and status in ('active', 'grace');
  select count(*) into v_pending from public.passes where bar_key = p_bar and status = 'requested';
  select count(*), count(*) filter (where side) into v_visits, v_sides
    from public.pass_visits where bar_key = p_bar and action = 'enter' and day >= m0;
  select count(distinct day), count(*) into v_tt_days, v_tt_visits
    from public.pass_visits where bar_key = p_bar and action = 'enter' and day >= m0 and extract(isodow from day) between 2 and 4;
  select coalesce(sum(drinks), 0) into v_drinks from public.pass_visits where bar_key = p_bar and day >= m0;
  select coalesce(sum(price), 0) into v_revenue from public.passes
    where bar_key = p_bar and approved_at >= m0 and status in ('active', 'grace', 'expired');
  return json_build_object(
    'members', v_members, 'pending', v_pending,
    'visits_month', v_visits,
    'avg_visits', case when v_members > 0 then round(v_visits::numeric / v_members, 1) else 0 end,
    'nightly_tt', case when v_tt_days > 0 then round(v_tt_visits::numeric / v_tt_days, 1) else 0 end,
    'side_rate', case when v_visits > 0 then round(100.0 * v_sides / v_visits) else null end,
    'drinks_month', v_drinks, 'revenue_month', v_revenue,
    'daily', (select coalesce(json_agg(json_build_object('day', d::date, 'n', (
                select count(*) from public.pass_visits v where v.bar_key = p_bar and v.action = 'enter' and v.day = d::date
              )) order by d), '[]'::json)
              from generate_series(today - 13, today, interval '1 day') d)
  );
end $fn$;
revoke all on function public.pass_dashboard(text) from public;
grant execute on function public.pass_dashboard(text) to authenticated;

-- ##################### guard.sql #####################
-- ============================================================
--  바텐톡 방어선 (2.65)
--
--  서비스를 여는 날 바로 들어오는 장난을 서버에서 막습니다. 앱을 고쳐 부르거나
--  스크립트로 두드려도 여기서 걸립니다.
--
--   1. 요청 횟수 제한   글·댓글·모임·후기·신고·채팅·패스 신청을 사람마다 시간당 몇 번까지만
--   2. 패스 신청 제한   결제 안 한 신청은 한 사람당 동시에 3건까지, 72시간 지나면 자동 취소
--   3. 칸 잠금         운영자도 회원·가격·상품 조건은 못 바꿈, 환불액은 결제액을 넘을 수 없음
--   4. 대표 운영자 보호 공동 운영자가 대표 운영자를 뺄 수 없음 (관리자만)
--   5. 기록 남기기     승인·환불·종료·연장·상품 삭제를 누가 언제 했는지 (분쟁 대비)
--   6. 장애 보상       서버가 멈춘 날만큼 회원 기간을 한 번에 연장
--   7. 수기 기록       서버가 멈췄을 때 가게가 적어둔 입장·잔을 나중에 올리기
--   8. 입점 약관 동의  운영자가 입점 약관에 동의한 시각
--   9. 정리 작업       오래된 신청·선물·요청 기록 정리 (api/pass-cron.js 가 매일 부름)
--
--  실행: Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.
--        pass.sql 다음이면 언제든 괜찮고, 여러 번 돌려도 안전해요.
--        (supabase/pass-update-all.sql 에 이 파일이 포함돼 있어요)
-- ============================================================

-- ------------------------------------------------------------
--  1. 요청 횟수 제한
-- ------------------------------------------------------------
create table if not exists public.rate_events (
  id      bigint generated always as identity primary key,
  user_id uuid not null,
  kind    text not null,
  at      timestamptz not null default now()
);
create index if not exists rate_events_idx on public.rate_events (user_id, kind, at desc);
alter table public.rate_events enable row level security;
-- 정책 없음: 아래 함수와 서버(service role)만 씁니다.

-- p_max 번을 p_win 안에 넘기면 거절. 두 번째 창(p_max2, p_win2)은 하루 총량 같은 데 씁니다.
create or replace function public.rate_hit(p_kind text, p_max int, p_win interval, p_max2 int default null, p_win2 interval default null)
returns void language plpgsql security definer set search_path = public as $fn$
declare uid uuid := auth.uid(); n int;
begin
  if uid is null or current_setting('bartalk.trusted', true) = '1' then return; end if;
  if exists (select 1 from public.admins where user_id = uid) then return; end if;
  select count(*) into n from public.rate_events where user_id = uid and kind = p_kind and at > now() - p_win;
  if n >= p_max then raise exception '너무 자주 요청했어요. 잠시 뒤에 다시 해주세요.'; end if;
  if p_max2 is not null then
    select count(*) into n from public.rate_events where user_id = uid and kind = p_kind and at > now() - p_win2;
    if n >= p_max2 then raise exception '오늘 할 수 있는 횟수를 다 썼어요. 내일 다시 해주세요.'; end if;
  end if;
  insert into public.rate_events (user_id, kind) values (uid, p_kind);
end $fn$;
revoke all on function public.rate_hit(text, int, interval, int, interval) from public;
grant execute on function public.rate_hit(text, int, interval, int, interval) to authenticated;

-- 트리거용: rate_guard('종류', 짧은창 횟수, 짧은창 초, 하루 횟수)
create or replace function public.rate_guard() returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  perform public.rate_hit(TG_ARGV[0], TG_ARGV[1]::int, make_interval(secs => TG_ARGV[2]::int),
                          nullif(TG_ARGV[3], '')::int, interval '1 day');
  return new;
end $fn$;

-- 있는 표에만 답니다 (서버마다 설치된 기능이 달라요)
do $$
declare r record;
begin
  for r in select * from (values
      ('posts',          'post',     '5',   '600', '30'),
      ('comments',       'comment',  '20',  '600', '200'),
      ('meets',          'meet',     '3',   '600', '5'),
      ('meet_comments',  'meet_cmt', '20',  '600', '200'),
      ('bar_reviews',    'review',   '5',   '600', '10'),
      ('reviews',        'review2',  '5',   '600', '10'),
      ('reports',        'report',   '10',  '600', '30'),
      ('messages',       'message',  '60',  '600', '600'),
      ('listings',       'listing',  '5',   '600', '10'),
      ('spirits',        'spirit',   '10',  '600', '30'),
      ('likes',          'like',     '120', '600', '1000'),
      ('bar_likes',      'bar_like', '60',  '600', '500'),
      ('passes',         'pass_req', '5',   '600', '10'),
      ('meet_participants', 'meet_join', '20', '600', '60')
    ) as t(tbl, kind, mx, win, day)
  loop
    if to_regclass('public.' || r.tbl) is not null then
      execute format('drop trigger if exists %I on public.%I', r.tbl || '_rate_trg', r.tbl);
      execute format('create trigger %I before insert on public.%I for each row execute function public.rate_guard(%L, %L, %L, %L)',
                     r.tbl || '_rate_trg', r.tbl, r.kind, r.mx, r.win, r.day);
    end if;
  end loop;
end $$;

-- ------------------------------------------------------------
--  2. 패스 신청 — 결제 안 한 신청은 동시에 3건까지
-- ------------------------------------------------------------
create or replace function public.guard_pass_open_requests() returns trigger
language plpgsql security definer set search_path = public as $fn$
declare n int;
begin
  if auth.uid() is null or current_setting('bartalk.trusted', true) = '1' or new.replaces_id is not null then return new; end if;
  select count(*) into n from public.passes where user_id = auth.uid() and status = 'requested';
  if n >= 3 then raise exception '결제 안 한 신청이 3건 있어요. 먼저 결제하거나 취소해주세요.'; end if;
  return new;
end $fn$;
drop trigger if exists passes_open_limit on public.passes;
create trigger passes_open_limit before insert on public.passes
  for each row execute function public.guard_pass_open_requests();

-- ------------------------------------------------------------
--  3. 칸 잠금 — 운영자가 바꿀 수 있는 건 상태·기간·요청 표시·종료 사유뿐
-- ------------------------------------------------------------
create or replace function public.guard_pass_columns() returns trigger
language plpgsql security definer set search_path = public as $fn$
declare amt int;
begin
  if auth.uid() is null or current_setting('bartalk.trusted', true) = '1' or public.is_admin() then return new; end if;
  if new.user_id is distinct from old.user_id or new.bar_key is distinct from old.bar_key
     or new.kind is distinct from old.kind or new.price is distinct from old.price
     or new.plan_id is distinct from old.plan_id or new.team_id is distinct from old.team_id
     or new.drinks_per_day is distinct from old.drinks_per_day or new.monthly_cap is distinct from old.monthly_cap
     or new.duration_days is distinct from old.duration_days or new.team_size is distinct from old.team_size
     or new.paid_via is distinct from old.paid_via or new.auto_renew is distinct from old.auto_renew then
    raise exception '회원·가격·상품 조건은 바꿀 수 없어요. 상품 바꾸기나 새 신청으로 처리해주세요.';
  end if;
  if new.closed_reason like 'refund:%' and new.closed_reason is distinct from old.closed_reason then
    amt := nullif(regexp_replace(substr(new.closed_reason, 8), '[^0-9]', '', 'g'), '')::int;
    if amt is null or amt < 0 then raise exception '환불액이 올바르지 않아요.'; end if;
    if amt > coalesce(old.price, 0) then raise exception '환불액(%원)이 결제액(%원)보다 클 수 없어요.', amt, old.price; end if;
  end if;
  if new.ends_at is not null and new.starts_at is not null and new.ends_at > new.starts_at + 400 then
    raise exception '기간은 400일을 넘길 수 없어요.';
  end if;
  return new;
end $fn$;
drop trigger if exists passes_lock_columns on public.passes;
create trigger passes_lock_columns before update on public.passes
  for each row execute function public.guard_pass_columns();

-- ------------------------------------------------------------
--  4. 대표 운영자 보호 · 입점 약관 동의
-- ------------------------------------------------------------
alter table public.bar_owners add column if not exists terms_accepted_at timestamptz;

create or replace function public.guard_owner_delete() returns trigger
language plpgsql security definer set search_path = public as $fn$
declare first_uid uuid;
begin
  if auth.uid() is null or public.is_admin() then return old; end if;
  select user_id into first_uid from public.bar_owners where bar_key = old.bar_key order by created_at, user_id limit 1;
  if old.user_id = first_uid and old.user_id <> auth.uid() then
    raise exception '대표 운영자는 관리자만 뺄 수 있어요.';
  end if;
  if (select count(*) from public.bar_owners where bar_key = old.bar_key) <= 1 then
    raise exception '마지막 운영자는 뺄 수 없어요. 관리자에게 요청해주세요.';
  end if;
  return old;
end $fn$;
drop trigger if exists bar_owners_guard_delete on public.bar_owners;
create trigger bar_owners_guard_delete before delete on public.bar_owners
  for each row execute function public.guard_owner_delete();

create or replace function public.pass_accept_partner_terms(p_bar text) returns json
language plpgsql security definer set search_path = public as $fn$
declare t timestamptz;
begin
  update public.bar_owners set terms_accepted_at = coalesce(terms_accepted_at, now())
    where bar_key = p_bar and user_id = auth.uid() returning terms_accepted_at into t;
  if t is null then raise exception '이 가게 운영자가 아니에요.'; end if;
  return json_build_object('accepted_at', t);
end $fn$;
revoke all on function public.pass_accept_partner_terms(text) from public;
grant execute on function public.pass_accept_partner_terms(text) to authenticated;

-- ------------------------------------------------------------
--  5. 기록 남기기
-- ------------------------------------------------------------
create table if not exists public.pass_audit (
  id       bigint generated always as identity primary key,
  bar_key  text not null,
  pass_id  bigint,
  actor    uuid,
  action   text not null,
  detail   jsonb not null default '{}'::jsonb,
  at       timestamptz not null default now()
);
create index if not exists pass_audit_bar_idx on public.pass_audit (bar_key, at desc);
create index if not exists pass_audit_pass_idx on public.pass_audit (pass_id, at desc);
alter table public.pass_audit enable row level security;
drop policy if exists pass_audit_read on public.pass_audit;
create policy pass_audit_read on public.pass_audit for select to authenticated
  using (public.is_bar_owner(bar_key) or public.is_admin());
-- 쓰기 정책 없음 (아래 트리거만 씁니다). 지우거나 고칠 수 없어요.

create or replace function public.audit_pass() returns trigger
language plpgsql security definer set search_path = public as $fn$
declare act text; det jsonb;
begin
  if tg_op = 'INSERT' then
    insert into public.pass_audit (bar_key, pass_id, actor, action, detail)
    values (new.bar_key, new.id, auth.uid(), 'create',
            jsonb_build_object('status', new.status, 'plan', new.plan_name, 'price', new.price, 'paid_via', new.paid_via, 'user_id', new.user_id));
    return new;
  end if;
  if new.status is not distinct from old.status and new.ends_at is not distinct from old.ends_at
     and new.closed_reason is not distinct from old.closed_reason
     and new.cancel_requested_at is not distinct from old.cancel_requested_at
     and new.renew_requested_at is not distinct from old.renew_requested_at
     and new.auto_renew is not distinct from old.auto_renew then
    return new;
  end if;
  act := case
    when new.status is distinct from old.status then 'status:' || old.status || '>' || new.status
    when new.ends_at is distinct from old.ends_at then 'extend'
    when new.closed_reason is distinct from old.closed_reason then 'reason'
    when new.cancel_requested_at is distinct from old.cancel_requested_at then case when new.cancel_requested_at is null then 'cancel_req_off' else 'cancel_req' end
    when new.renew_requested_at is distinct from old.renew_requested_at then case when new.renew_requested_at is null then 'renew_req_off' else 'renew_req' end
    else 'auto_renew:' || new.auto_renew end;
  det := jsonb_build_object(
    'from', jsonb_build_object('status', old.status, 'ends_at', old.ends_at, 'closed_reason', old.closed_reason, 'auto_renew', old.auto_renew),
    'to',   jsonb_build_object('status', new.status, 'ends_at', new.ends_at, 'closed_reason', new.closed_reason, 'auto_renew', new.auto_renew),
    'user_id', new.user_id, 'price', new.price, 'plan', new.plan_name);
  insert into public.pass_audit (bar_key, pass_id, actor, action, detail) values (new.bar_key, new.id, auth.uid(), act, det);
  return new;
end $fn$;
drop trigger if exists passes_audit_ins on public.passes;
create trigger passes_audit_ins after insert on public.passes for each row execute function public.audit_pass();
drop trigger if exists passes_audit_upd on public.passes;
create trigger passes_audit_upd after update on public.passes for each row execute function public.audit_pass();

create or replace function public.audit_plan() returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  if tg_op = 'DELETE' then
    insert into public.pass_audit (bar_key, actor, action, detail)
    values (old.bar_key, auth.uid(), 'plan_delete', jsonb_build_object('plan_id', old.id, 'name', old.name, 'price', old.price));
    return old;
  end if;
  if new.price is distinct from old.price or new.monthly_cap is distinct from old.monthly_cap
     or new.drinks_per_day is distinct from old.drinks_per_day or new.active is distinct from old.active then
    insert into public.pass_audit (bar_key, actor, action, detail)
    values (new.bar_key, auth.uid(), 'plan_change', jsonb_build_object('plan_id', new.id, 'name', new.name,
      'from', jsonb_build_object('price', old.price, 'monthly_cap', old.monthly_cap, 'drinks_per_day', old.drinks_per_day, 'active', old.active),
      'to',   jsonb_build_object('price', new.price, 'monthly_cap', new.monthly_cap, 'drinks_per_day', new.drinks_per_day, 'active', new.active)));
  end if;
  return new;
end $fn$;
drop trigger if exists pass_plans_audit on public.pass_plans;
create trigger pass_plans_audit after update or delete on public.pass_plans for each row execute function public.audit_plan();

-- ------------------------------------------------------------
--  6. 장애 보상 — 이 가게 회원 전원 기간 n일 연장
-- ------------------------------------------------------------
create or replace function public.pass_extend_all(p_bar text, p_days int, p_reason text default '') returns json
language plpgsql security definer set search_path = public as $fn$
declare n int;
begin
  if not (public.is_bar_owner(p_bar) or public.is_admin()) then raise exception '이 가게 운영자만 할 수 있어요.'; end if;
  if p_days is null or p_days < 1 or p_days > 14 then raise exception '연장은 1~14일 사이로 해주세요.'; end if;
  perform public.rate_hit('extend_all', 3, interval '1 day');
  perform set_config('bartalk.trusted', '1', true);
  update public.passes set ends_at = ends_at + p_days, expiry_notified_at = null
    where bar_key = p_bar and status in ('active', 'grace') and ends_at is not null;
  get diagnostics n = row_count;
  insert into public.pass_audit (bar_key, actor, action, detail)
  values (p_bar, auth.uid(), 'extend_all', jsonb_build_object('days', p_days, 'count', n, 'reason', left(coalesce(p_reason, ''), 200)));
  return json_build_object('count', n, 'days', p_days);
end $fn$;
revoke all on function public.pass_extend_all(text, int, text) from public;
grant execute on function public.pass_extend_all(text, int, text) to authenticated;

-- 운영 기록 보기 (최근 200건)
create or replace function public.pass_audit_list(p_bar text) returns json
language plpgsql stable security definer set search_path = public as $fn$
begin
  if not (public.is_bar_owner(p_bar) or public.is_admin()) then raise exception '이 가게 운영자만 볼 수 있어요.'; end if;
  return (select coalesce(json_agg(x order by x.at desc), '[]'::json) from (
    select a.id, a.pass_id, a.action, a.detail, a.at,
           (select nick from public.profiles where id = a.actor) as actor_nick,
           (select nick from public.profiles where id = (a.detail->>'user_id')::uuid) as member_nick
    from public.pass_audit a where a.bar_key = p_bar order by a.at desc limit 200) x);
end $fn$;
revoke all on function public.pass_audit_list(text) from public;
grant execute on function public.pass_audit_list(text) to authenticated;

-- ------------------------------------------------------------
--  7. 수기 기록 — 서버가 멈췄을 때 적어둔 입장·잔을 나중에 올리기
-- ------------------------------------------------------------
alter table public.pass_visits add column if not exists manual boolean not null default false;

create or replace function public.pass_scan_manual(p_pass bigint, p_action text, p_at timestamptz) returns json
language plpgsql security definer set search_path = public as $fn$
declare p public.passes%rowtype; at_ts timestamptz; d date; mon text; today_drinks int; month_drinks int; bonus int := 0;
begin
  select * into p from public.passes where id = p_pass;
  if not found then raise exception '없는 패스예요 (%번).', p_pass; end if;
  if not (public.is_bar_owner(p.bar_key) or public.is_admin()) then raise exception '이 가게 운영자만 올릴 수 있어요.'; end if;
  if p_action not in ('enter', 'drink') then raise exception '알 수 없는 동작이에요.'; end if;
  at_ts := least(greatest(coalesce(p_at, now()), now() - interval '72 hours'), now());
  d := (at_ts at time zone 'Asia/Seoul')::date;
  mon := to_char(d, 'YYYY-MM');
  if p.status not in ('active', 'grace', 'expired') or p.starts_at is null or d < p.starts_at or d > p.ends_at then
    raise exception '%번 패스는 그날 쓸 수 있는 패스가 아니에요.', p_pass;
  end if;
  if not exists (select 1 from public.pass_visits where pass_id = p.id and day = d and action = 'enter') then
    insert into public.pass_visits (pass_id, bar_key, user_id, action, drinks, side, by_user, at, day, manual)
    values (p.id, p.bar_key, p.user_id, 'enter', 0, false, auth.uid(), at_ts, d, true);
  end if;
  if p_action = 'drink' then
    if to_regclass('public.pass_seat_offers') is not null then
      execute 'select coalesce(max(bonus_drinks), 0) from public.pass_seat_offers where bar_key = $1 and day = $2' into bonus using p.bar_key, d;
    end if;
    select coalesce(sum(drinks), 0) into today_drinks from public.pass_visits where pass_id = p.id and day = d and action = 'drink';
    select coalesce(sum(drinks), 0) into month_drinks from public.pass_visits where pass_id = p.id and to_char(day, 'YYYY-MM') = mon;
    if today_drinks >= p.drinks_per_day + bonus then raise exception '%번 패스는 그날 잔수를 이미 다 썼어요.', p_pass; end if;
    if p.monthly_cap is not null and month_drinks >= p.monthly_cap then raise exception '%번 패스는 이달 상한에 닿았어요.', p_pass; end if;
    insert into public.pass_visits (pass_id, bar_key, user_id, action, drinks, side, by_user, at, day, manual)
    values (p.id, p.bar_key, p.user_id, 'drink', 1, false, auth.uid(), at_ts, d, true);
  end if;
  return public.pass_json(p.id);
end $fn$;
revoke all on function public.pass_scan_manual(bigint, text, timestamptz) from public;
grant execute on function public.pass_scan_manual(bigint, text, timestamptz) to authenticated;

-- ------------------------------------------------------------
--  9. 정리 작업 (서버 전용 — api/pass-cron.js)
-- ------------------------------------------------------------
create or replace function public.pass_housekeeping() returns json
language plpgsql security definer set search_path = public as $fn$
declare stale int := 0; gifts int := 0; purged int := 0;
begin
  perform set_config('bartalk.trusted', '1', true);
  update public.passes set status = 'cancelled', closed_reason = 'stale'
    where status = 'requested' and created_at < now() - interval '72 hours';
  get diagnostics stale = row_count;
  if to_regclass('public.pass_gifts') is not null then
    execute 'update public.pass_gifts set status = ''expired'' where status in (''open'', ''claimed'') and expires_at < now()';
    get diagnostics gifts = row_count;
  end if;
  delete from public.rate_events where at < now() - interval '2 days';
  get diagnostics purged = row_count;
  return json_build_object('stale_requests', stale, 'expired_gifts', gifts, 'purged_rate_events', purged);
end $fn$;
revoke all on function public.pass_housekeeping() from public;
revoke all on function public.pass_housekeeping() from authenticated;
grant execute on function public.pass_housekeeping() to service_role;

-- ##################### pass-offer.sql #####################
-- 빈자리 알림 — "지금 오면 오늘 한 잔 더" (2.64)
--   사장이 저녁에 "자리 12개 남음"을 누르면 회원에게 푸시가 가고(api/pass-offer.js), 그날은 하루 잔수가 +1(또는 +2) 됩니다.
--   원데이(비회원) 가격도 빈자리에 따라 내려갑니다. 빈 좌석을 재고처럼 파는 장치예요.
--
-- 실행 순서: pass.sql → pass-member.sql → pass-lifecycle.sql → (pass-refund.sql) → 이 파일.
--   Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.

create table if not exists public.pass_seat_offers (
  id            bigint generated always as identity primary key,
  bar_key       text not null,
  bar_name      text not null default '',
  seats_left    smallint not null check (seats_left between 0 and 500),
  bonus_drinks  smallint not null default 1 check (bonus_drinks between 0 and 5),
  oneday_price  integer check (oneday_price is null or oneday_price >= 0),
  day           date not null default public.kst_today(),
  expires_at    timestamptz not null,
  created_by    uuid,
  created_at    timestamptz not null default now()
);
create index if not exists pass_seat_offers_bar_idx on public.pass_seat_offers (bar_key, expires_at desc);
alter table public.pass_seat_offers enable row level security;
drop policy if exists pass_seat_offers_read on public.pass_seat_offers;
create policy pass_seat_offers_read on public.pass_seat_offers for select to authenticated using (true);
drop policy if exists pass_seat_offers_write on public.pass_seat_offers;
create policy pass_seat_offers_write on public.pass_seat_offers for all to authenticated
  using (public.is_bar_owner(bar_key) or public.is_admin())
  with check (public.is_bar_owner(bar_key) or public.is_admin());

-- 오늘 이 가게의 살아 있는 알림 (없으면 null)
create or replace function public.pass_offer_now(p_bar text) returns json
language sql stable security definer set search_path = public as $fn$
  select row_to_json(o) from (
    select id, bar_key, bar_name, seats_left, bonus_drinks, oneday_price, day, expires_at
    from public.pass_seat_offers
    where bar_key = p_bar and day = public.kst_today() and expires_at > now()
    order by created_at desc limit 1) o;
$fn$;
revoke all on function public.pass_offer_now(text) from public;
grant execute on function public.pass_offer_now(text) to authenticated;

-- 선물 잔(pass-gift.sql)도 방문 기록에 남기려고 동작 종류에 'gift' 를 더합니다.
alter table public.pass_visits drop constraint if exists pass_visits_action_check;
alter table public.pass_visits add constraint pass_visits_action_check check (action in ('enter', 'drink', 'reward', 'gift'));

-- 스캔 규칙 — pass.sql 의 pass_scan 에 "오늘 빈자리 알림이 있으면 하루 잔수 + 보너스" 만 더한 것
create or replace function public.pass_scan(p_token text, p_action text, p_side boolean default false)
returns json language plpgsql security definer set search_path = public as $fn$
declare
  parts text[]; p public.passes%rowtype; st public.bar_pass_settings%rowtype;
  today date := public.kst_today(); mon text := to_char(public.kst_today(), 'YYYY-MM');
  today_drinks int; month_drinks int; stamps int; has_enter boolean; rid bigint; bonus int := 0; day_limit int;
begin
  if p_token is null or p_token !~ '^BTP:[0-9]+:[A-Za-z0-9]{4,12}$' then
    raise exception '패스 QR이 아니에요.';
  end if;
  parts := string_to_array(p_token, ':');
  select * into p from public.passes where id = parts[2]::bigint;
  if not found then raise exception '없는 패스예요.'; end if;
  if not (public.is_bar_owner(p.bar_key) or public.is_admin()) then
    raise exception '이 가게 운영자만 확인할 수 있어요.';
  end if;
  if p.qr_nonce is null or upper(p.qr_nonce) <> upper(parts[3]) or p.qr_at < now() - interval '90 seconds' then
    raise exception 'QR이 만료됐어요. 손님 화면을 새로고침해 주세요.';
  end if;
  if p.status not in ('active', 'grace') then raise exception '쓸 수 없는 패스예요 (%).', p.status; end if;
  if today < p.starts_at or today > p.ends_at then
    raise exception '기간이 아니에요 (% ~ %).', to_char(p.starts_at, 'MM.DD'), to_char(p.ends_at, 'MM.DD');
  end if;
  if p.days = 'tue-thu' and extract(isodow from today) not between 2 and 4 then
    raise exception '이 패스는 화·수·목에만 쓸 수 있어요.';
  end if;
  select * into st from public.bar_pass_settings where bar_key = p.bar_key;

  -- 오늘 빈자리 알림이 살아 있으면 보너스 잔
  select coalesce(max(bonus_drinks), 0) into bonus from public.pass_seat_offers
    where bar_key = p.bar_key and day = today and expires_at > now();
  day_limit := p.drinks_per_day + bonus;

  select coalesce(sum(drinks), 0) into today_drinks from public.pass_visits where pass_id = p.id and day = today and action <> 'gift';
  select coalesce(sum(drinks), 0) into month_drinks from public.pass_visits where pass_id = p.id and to_char(day, 'YYYY-MM') = mon;
  select exists (select 1 from public.pass_visits where pass_id = p.id and day = today and action = 'enter') into has_enter;

  if p_action not in ('enter', 'drink', 'reward') then raise exception '알 수 없는 동작이에요.'; end if;

  if p_action in ('enter', 'drink') and not has_enter then
    insert into public.pass_visits (pass_id, bar_key, user_id, action, drinks, side, by_user)
    values (p.id, p.bar_key, p.user_id, 'enter', 0, coalesce(p_side, false), auth.uid());
    select count(distinct day) into stamps from public.pass_visits
      where pass_id = p.id and action = 'enter' and to_char(day, 'YYYY-MM') = mon;
    if stamps = coalesce(st.stamp_goal, 4) then
      insert into public.pass_rewards (pass_id, bar_key, user_id, month, kind, label)
      values (p.id, p.bar_key, p.user_id, mon, 'special', coalesce(nullif(st.special_drink, ''), '이달의 한정 칵테일'))
      on conflict do nothing;
    end if;
  end if;
  if coalesce(p_side, false) then
    update public.pass_visits set side = true where pass_id = p.id and day = today and action = 'enter';
  end if;

  if p_action = 'drink' then
    if today_drinks >= day_limit then
      if bonus > 0 then raise exception '오늘 잔수(%잔 + 빈자리 보너스 %잔)를 다 썼어요.', p.drinks_per_day, bonus;
      else raise exception '오늘 잔수(%잔)를 다 썼어요.', p.drinks_per_day; end if;
    end if;
    if p.monthly_cap is not null and month_drinks >= p.monthly_cap then
      raise exception '이달 상한(%잔)에 닿았어요. 추가는 회원가로 계산해 주세요.', p.monthly_cap;
    end if;
    insert into public.pass_visits (pass_id, bar_key, user_id, action, drinks, side, by_user)
    values (p.id, p.bar_key, p.user_id, 'drink', 1, false, auth.uid());
  elsif p_action = 'reward' then
    select id into rid from public.pass_rewards where pass_id = p.id and redeemed_at is null order by created_at limit 1;
    if rid is null then raise exception '받을 보상이 없어요.'; end if;
    update public.pass_rewards set redeemed_at = now() where id = rid;
    insert into public.pass_visits (pass_id, bar_key, user_id, action, drinks, side, by_user)
    values (p.id, p.bar_key, p.user_id, 'reward', 0, false, auth.uid());
  end if;

  return public.pass_json(p.id);
end $fn$;
revoke all on function public.pass_scan(text, text, boolean) from public;
grant execute on function public.pass_scan(text, text, boolean) to authenticated;

-- ##################### pass-gift.sql #####################
-- 잔 선물 링크 — "퇴근길 한 잔 쏠게" (2.64)
--   회원이 자기 월 잔수에서 한 잔을 떼어 링크로 보냅니다. 받은 사람은 가게에 와서 코드를 보여주고 마셔요.
--   잔은 받은 사람이 실제로 마실 때(가게가 코드 확인) 보낸 사람 패스에서 빠집니다. 안 오면 아무것도 안 빠져요.
--   열려 있는 선물은 한 패스에 3개까지. 14일 지나면 소멸.
--
-- 실행 순서: pass.sql → … → guard.sql(요청 횟수 제한) → pass-offer.sql(동작 'gift' 허용) → 이 파일.
--   (supabase/pass-update-all.sql 한 번이면 순서대로 다 들어가요)

create table if not exists public.pass_gifts (
  id           bigint generated always as identity primary key,
  code         text not null unique,
  pass_id      bigint not null references public.passes(id) on delete cascade,
  from_user    uuid not null,
  to_user      uuid,
  bar_key      text not null,
  bar_name     text not null default '',
  message      text not null default '' check (char_length(message) <= 80),
  status       text not null default 'open' check (status in ('open', 'claimed', 'redeemed', 'expired', 'cancelled')),
  expires_at   timestamptz not null default now() + interval '14 days',
  claimed_at   timestamptz,
  redeemed_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists pass_gifts_from_idx on public.pass_gifts (from_user, created_at desc);
create index if not exists pass_gifts_to_idx on public.pass_gifts (to_user, created_at desc);
alter table public.pass_gifts enable row level security;
drop policy if exists pass_gifts_read on public.pass_gifts;
create policy pass_gifts_read on public.pass_gifts for select to authenticated
  using (from_user = auth.uid() or to_user = auth.uid() or public.is_bar_owner(bar_key) or public.is_admin());
-- 쓰기는 아래 함수로만.

create or replace function public.pass_gift_json(g public.pass_gifts) returns json
language sql stable security definer set search_path = public as $fn$
  select json_build_object(
    'id', g.id, 'code', g.code, 'pass_id', g.pass_id, 'bar_key', g.bar_key, 'bar_name', g.bar_name,
    'message', g.message, 'status', case when g.status = 'open' and g.expires_at < now() then 'expired' else g.status end,
    'expires_at', g.expires_at, 'claimed_at', g.claimed_at, 'redeemed_at', g.redeemed_at, 'created_at', g.created_at,
    'from_nick', (select nick from public.profiles where id = g.from_user),
    'to_nick', (select nick from public.profiles where id = g.to_user),
    'mine', g.from_user = auth.uid(), 'for_me', g.to_user = auth.uid());
$fn$;

-- 1) 만들기 — 내 패스에서
create or replace function public.pass_gift_create(p_pass bigint, p_message text default '') returns json
language plpgsql security definer set search_path = public as $fn$
declare p public.passes%rowtype; g public.pass_gifts%rowtype; open_n int; month_drinks int;
  mon text := to_char(public.kst_today(), 'YYYY-MM'); v_code text;
begin
  select * into p from public.passes where id = p_pass and user_id = auth.uid();
  if not found then raise exception '내 패스가 아니에요.'; end if;
  if p.status not in ('active', 'grace') then raise exception '쓸 수 있는 패스가 아니에요.'; end if;
  if p.kind = 'oneday' then raise exception '원데이는 선물할 수 없어요.'; end if;
  select count(*) into open_n from public.pass_gifts where pass_id = p.id and status in ('open', 'claimed') and expires_at > now();
  if open_n >= 3 then raise exception '아직 안 쓴 선물이 3개 있어요. 먼저 그걸 쓰게 해주세요.'; end if;
  if p.monthly_cap is not null then
    select coalesce(sum(drinks), 0) into month_drinks from public.pass_visits where pass_id = p.id and to_char(day, 'YYYY-MM') = mon;
    if month_drinks + open_n >= p.monthly_cap then raise exception '이달 잔이 남아 있지 않아요.'; end if;
  end if;
  perform public.rate_hit('gift_create', 5, interval '10 minutes', 10, interval '1 day');
  -- 8자리(16진수) 코드: 약 43억 가지라 찍어서 맞히기 어렵고, 조회도 횟수 제한이 있어요
  loop
    v_code := 'G-' || upper(substr(md5(random()::text || clock_timestamp()::text || p.id::text), 1, 8));
    exit when not exists (select 1 from public.pass_gifts where pass_gifts.code = v_code);
  end loop;
  insert into public.pass_gifts (code, pass_id, from_user, bar_key, bar_name, message)
  values (v_code, p.id, auth.uid(), p.bar_key, p.bar_name, left(btrim(coalesce(p_message, '')), 80))
  returning * into g;
  return public.pass_gift_json(g);
end $fn$;
revoke all on function public.pass_gift_create(bigint, text) from public;
grant execute on function public.pass_gift_create(bigint, text) to authenticated;

-- 2) 링크로 들어온 사람이 보는 정보
create or replace function public.pass_gift_info(p_code text) returns json
language plpgsql security definer set search_path = public as $fn$
declare g public.pass_gifts%rowtype;
begin
  perform public.rate_hit('gift_lookup', 20, interval '10 minutes', 100, interval '1 day');
  select * into g from public.pass_gifts where upper(code) = upper(btrim(p_code));
  -- 없는 코드는 오류로 끝내지 않아요. 오류로 끝나면 위의 시도 기록까지 되돌려져서 코드 찍어보기를 막을 수 없어요.
  if not found then return json_build_object('error', '없는 선물 코드예요.'); end if;
  return public.pass_gift_json(g);
end $fn$;
revoke all on function public.pass_gift_info(text) from public;
grant execute on function public.pass_gift_info(text) to authenticated;

-- 3) 받기 — 내 이름으로 걸어두기
create or replace function public.pass_gift_claim(p_code text) returns json
language plpgsql security definer set search_path = public as $fn$
declare g public.pass_gifts%rowtype;
begin
  perform public.rate_hit('gift_lookup', 20, interval '10 minutes', 100, interval '1 day');
  select * into g from public.pass_gifts where upper(code) = upper(btrim(p_code)) for update;
  if not found then return json_build_object('error', '없는 선물 코드예요.'); end if;
  if g.from_user = auth.uid() then raise exception '내가 보낸 선물이에요. 친구에게 링크를 보내주세요.'; end if;
  if g.status = 'claimed' and g.to_user = auth.uid() then return public.pass_gift_json(g); end if;
  if g.status <> 'open' then raise exception '이미 받아간 선물이에요.'; end if;
  if g.expires_at < now() then raise exception '기한이 지난 선물이에요.'; end if;
  update public.pass_gifts set status = 'claimed', to_user = auth.uid(), claimed_at = now() where id = g.id returning * into g;
  return public.pass_gift_json(g);
end $fn$;
revoke all on function public.pass_gift_claim(text) from public;
grant execute on function public.pass_gift_claim(text) to authenticated;

-- 4) 가게에서 코드 확인 — 이때 보낸 사람 패스에서 1잔이 빠져요
create or replace function public.pass_gift_redeem(p_code text) returns json
language plpgsql security definer set search_path = public as $fn$
declare g public.pass_gifts%rowtype; p public.passes%rowtype; month_drinks int;
  today date := public.kst_today(); mon text := to_char(public.kst_today(), 'YYYY-MM');
begin
  select * into g from public.pass_gifts where upper(code) = upper(btrim(p_code)) for update;
  if not found or not (public.is_bar_owner(g.bar_key) or public.is_admin()) then raise exception '이 가게의 선물 코드가 아니에요.'; end if;
  if g.status = 'redeemed' then raise exception '이미 제공한 선물이에요 (%).', to_char(g.redeemed_at at time zone 'Asia/Seoul', 'MM.DD HH24:MI'); end if;
  if g.status not in ('open', 'claimed') then raise exception '쓸 수 없는 선물이에요 (%).', g.status; end if;
  if g.expires_at < now() then raise exception '기한이 지난 선물이에요.'; end if;
  select * into p from public.passes where id = g.pass_id;
  if p.status not in ('active', 'grace') or today < p.starts_at or today > p.ends_at then
    raise exception '보낸 분의 패스가 지금 쓸 수 없는 상태예요.';
  end if;
  if p.monthly_cap is not null then
    select coalesce(sum(drinks), 0) into month_drinks from public.pass_visits where pass_id = p.id and to_char(day, 'YYYY-MM') = mon;
    if month_drinks >= p.monthly_cap then raise exception '보낸 분의 이달 잔이 다 떨어졌어요.'; end if;
  end if;
  -- 한 패스로 하루에 선물 잔은 2잔까지 (계정 여러 개로 하루 잔수를 우회하지 못하게)
  if (select count(*) from public.pass_visits where pass_id = p.id and day = today and action = 'gift') >= 2 then
    raise exception '이 회원의 선물 잔은 오늘 2잔까지예요.';
  end if;
  if g.to_user is not null and g.to_user = p.user_id then raise exception '보낸 분 본인은 선물 잔을 쓸 수 없어요.'; end if;
  insert into public.pass_visits (pass_id, bar_key, user_id, action, drinks, side, by_user)
  values (p.id, p.bar_key, p.user_id, 'gift', 1, false, auth.uid());
  update public.pass_gifts set status = 'redeemed', redeemed_at = now(), to_user = coalesce(to_user, auth.uid()) where id = g.id returning * into g;
  return public.pass_gift_json(g);
end $fn$;
revoke all on function public.pass_gift_redeem(text) from public;
grant execute on function public.pass_gift_redeem(text) to authenticated;

-- 5) 내 선물 목록 (보낸 것 · 받은 것)
create or replace function public.pass_gifts_mine() returns json
language sql stable security definer set search_path = public as $fn$
  select coalesce(json_agg(public.pass_gift_json(g) order by g.created_at desc), '[]'::json)
  from public.pass_gifts g
  where (g.from_user = auth.uid() or g.to_user = auth.uid()) and g.created_at > now() - interval '60 days';
$fn$;
revoke all on function public.pass_gifts_mine() from public;
grant execute on function public.pass_gifts_mine() to authenticated;

commit;

-- 끝. 오류 없이 끝났다면 앱을 새로고침하세요.
