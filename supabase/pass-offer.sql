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
