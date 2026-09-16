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
