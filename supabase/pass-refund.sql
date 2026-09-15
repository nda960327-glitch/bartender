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
