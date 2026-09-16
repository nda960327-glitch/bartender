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
