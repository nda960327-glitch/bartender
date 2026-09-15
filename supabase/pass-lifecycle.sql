-- 하우스 패스 생애주기 (2.49)
--   팀에서 나가기 · 팀원 내보내기 · 상품 바꾸기(업그레이드) · 연장 요청 · 해지/환불 요청 · 환불 규정
--
-- 실행 순서: pass.sql → pass-member.sql → 이 파일.
-- 실행: Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.

-- ------------------------------------------------------------
--  1. 칸 추가
-- ------------------------------------------------------------
alter table public.passes add column if not exists replaces_id         bigint references public.passes(id) on delete set null;  -- 이 신청이 승인되면 끝나는 기존 패스
alter table public.passes add column if not exists cancel_requested_at timestamptz;   -- 손님의 해지·환불 요청
alter table public.passes add column if not exists cancel_reason       text not null default '';
alter table public.passes add column if not exists renew_requested_at  timestamptz;   -- 손님의 다음 달 연장 요청
alter table public.passes add column if not exists closed_reason       text not null default '';  -- refund · upgrade · left · removed · owner · ''
alter table public.bar_pass_settings add column if not exists refund_policy text not null default '' check (char_length(refund_policy) <= 2000);

comment on column public.passes.replaces_id is '상품 바꾸기 신청. 승인되는 순간 이 패스가 종료됩니다.';

-- ------------------------------------------------------------
--  2. 신청 규칙 — 바꾸기 신청은 기존 패스가 있어도 허용
-- ------------------------------------------------------------
create or replace function public.guard_pass_insert() returns trigger
language plpgsql security definer set search_path = public as $fn$
declare pl public.pass_plans%rowtype; st public.bar_pass_settings%rowtype; old public.passes%rowtype;
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

-- ------------------------------------------------------------
--  3. 상태 바뀔 때 — 바꾸기 승인이면 기존 패스 종료, 팀장 종료면 팀원도 종료
-- ------------------------------------------------------------
create or replace function public.guard_pass_update() returns trigger
language plpgsql security definer set search_path = public as $fn$
declare today date := public.kst_today();
begin
  new.updated_at := now();
  if new.status = 'active' and old.status <> 'active' then
    new.starts_at := coalesce(new.starts_at, today);
    new.ends_at   := coalesce(new.ends_at, new.starts_at + (new.duration_days - 1));
    if auth.uid() is not null then new.approved_by := auth.uid(); end if;
    new.approved_at := coalesce(new.approved_at, now());
    if new.kind = 'team' and new.team_id is null and new.invite_code is null then
      new.invite_code := upper(substr(md5(random()::text || clock_timestamp()::text || new.id::text), 1, 6));
    end if;
    -- 상품 바꾸기 승인: 기존 패스는 오늘 끝나고, 팀원은 새 팀 패스로 옮기거나(팀→팀) 같이 끝나요
    if new.replaces_id is not null then
      perform set_config('bartalk.trusted', '1', true);
      update public.passes set status = 'expired', closed_reason = 'upgrade',
             ends_at = least(coalesce(ends_at, today), today), cancel_requested_at = null, renew_requested_at = null
        where id = new.replaces_id and status in ('active', 'grace');
      if new.kind = 'team' then
        update public.passes set team_id = new.id, ends_at = new.ends_at, plan_name = new.plan_name || ' · 팀원'
          where team_id = new.replaces_id and status in ('active', 'grace');
      else
        update public.passes set status = 'expired', closed_reason = 'upgrade', ends_at = today
          where team_id = new.replaces_id and status in ('active', 'grace');
      end if;
    end if;
  end if;
  if new.status in ('expired', 'cancelled', 'rejected') and old.status not in ('expired', 'cancelled', 'rejected') then
    new.cancel_requested_at := null;
    new.renew_requested_at := null;
    -- 팀장 패스가 끝나면 팀원도 같이
    if new.kind = 'team' and new.team_id is null then
      perform set_config('bartalk.trusted', '1', true);
      update public.passes set status = 'expired', closed_reason = coalesce(nullif(new.closed_reason, ''), 'lead'), ends_at = least(coalesce(ends_at, today), today)
        where team_id = new.id and status in ('active', 'grace');
    end if;
  end if;
  return new;
end $fn$;

-- ------------------------------------------------------------
--  4. 손님이 부르는 함수들
-- ------------------------------------------------------------
-- 해지·환불 요청. 승인 전 신청이면 그 자리에서 취소돼요.
create or replace function public.pass_request_cancel(p_pass bigint, p_reason text default '') returns json
language plpgsql security definer set search_path = public as $fn$
declare p public.passes%rowtype;
begin
  select * into p from public.passes where id = p_pass and user_id = auth.uid();
  if not found then raise exception '내 패스가 아니에요.'; end if;
  perform set_config('bartalk.trusted', '1', true);
  if p.status = 'requested' then
    update public.passes set status = 'cancelled' where id = p.id;
  elsif p.status in ('active', 'grace') then
    if p.team_id is not null then raise exception '팀원은 "팀에서 나가기"를 눌러주세요.'; end if;
    update public.passes set cancel_requested_at = now(), cancel_reason = left(btrim(coalesce(p_reason, '')), 200) where id = p.id;
  else
    raise exception '해지할 수 있는 패스가 아니에요.';
  end if;
  return public.pass_json(p.id);
end $fn$;
revoke all on function public.pass_request_cancel(bigint, text) from public;
grant execute on function public.pass_request_cancel(bigint, text) to authenticated;

create or replace function public.pass_withdraw_cancel(p_pass bigint) returns json
language plpgsql security definer set search_path = public as $fn$
begin
  perform set_config('bartalk.trusted', '1', true);
  update public.passes set cancel_requested_at = null, cancel_reason = ''
    where id = p_pass and user_id = auth.uid() and cancel_requested_at is not null;
  if not found then raise exception '취소할 요청이 없어요.'; end if;
  return public.pass_json(p_pass);
end $fn$;
revoke all on function public.pass_withdraw_cancel(bigint) from public;
grant execute on function public.pass_withdraw_cancel(bigint) to authenticated;

create or replace function public.pass_request_renew(p_pass bigint) returns json
language plpgsql security definer set search_path = public as $fn$
begin
  perform set_config('bartalk.trusted', '1', true);
  update public.passes set renew_requested_at = now()
    where id = p_pass and user_id = auth.uid() and status in ('active', 'grace') and team_id is null and kind <> 'oneday';
  if not found then raise exception '연장을 요청할 수 있는 패스가 아니에요.'; end if;
  return public.pass_json(p_pass);
end $fn$;
revoke all on function public.pass_request_renew(bigint) from public;
grant execute on function public.pass_request_renew(bigint) to authenticated;

-- 팀원이 스스로 나가기
create or replace function public.pass_team_leave(p_pass bigint) returns void
language plpgsql security definer set search_path = public as $fn$
begin
  perform set_config('bartalk.trusted', '1', true);
  update public.passes set status = 'cancelled', closed_reason = 'left', ends_at = public.kst_today()
    where id = p_pass and user_id = auth.uid() and team_id is not null and status in ('active', 'grace');
  if not found then raise exception '나갈 수 있는 팀 패스가 아니에요.'; end if;
end $fn$;
revoke all on function public.pass_team_leave(bigint) from public;
grant execute on function public.pass_team_leave(bigint) to authenticated;

-- 팀장 또는 가게 운영자가 팀원 내보내기
create or replace function public.pass_team_remove(p_member bigint) returns void
language plpgsql security definer set search_path = public as $fn$
declare m public.passes%rowtype; lead public.passes%rowtype;
begin
  select * into m from public.passes where id = p_member and team_id is not null and status in ('active', 'grace');
  if not found then raise exception '내보낼 수 있는 팀원이 아니에요.'; end if;
  select * into lead from public.passes where id = m.team_id;
  if not (lead.user_id = auth.uid() or public.is_bar_owner(m.bar_key) or public.is_admin()) then
    raise exception '팀장이나 가게 운영자만 내보낼 수 있어요.';
  end if;
  perform set_config('bartalk.trusted', '1', true);
  update public.passes set status = 'cancelled', closed_reason = 'removed', ends_at = public.kst_today() where id = m.id;
end $fn$;
revoke all on function public.pass_team_remove(bigint) from public;
grant execute on function public.pass_team_remove(bigint) to authenticated;

-- ------------------------------------------------------------
--  5. pass_json — 생애주기 항목 + 팀원 명단 + 환불 규정
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
--  6. 운영자 화면에서 종료 사유·요청 칸을 고칠 수 있게 (passes_update 정책은 이미 운영자 허용)
-- ------------------------------------------------------------
-- 별도 작업 없음. 손님은 위 함수로만 바꿉니다.
