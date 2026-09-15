-- 하우스 패스 회원 이름·전화번호 (2.47)
--
-- 운영자가 계산대에서 "누구 패스인지" 알아봐야 해서, 패스마다 회원 이름과 번호를 붙입니다.
-- 그 가게 운영자(is_bar_owner)와 본인, 관리자만 읽습니다 (passes 의 기존 RLS 그대로).
--
-- 실행: Supabase 대시보드 → SQL Editor 에 붙여넣고 Run. (pass.sql 다음에)

alter table public.passes add column if not exists member_name  text not null default '';
alter table public.passes add column if not exists member_phone text not null default '';

-- 앱이 보낸 값을 정리합니다 (이름 20자, 번호는 숫자만). 손님이 이상한 값을 넣어도 표는 깨끗하게.
create or replace function public.clean_pass_member() returns trigger
language plpgsql as $fn$
begin
  new.member_name  := left(btrim(coalesce(new.member_name, '')), 20);
  new.member_phone := regexp_replace(coalesce(new.member_phone, ''), '\D', '', 'g');
  return new;
end $fn$;
drop trigger if exists passes_clean_member on public.passes;
create trigger passes_clean_member before insert or update of member_name, member_phone on public.passes
  for each row execute function public.clean_pass_member();

-- 운영자 상세 시트에도 이름·번호가 나오게 pass_json 을 다시 정의합니다 (기존 항목 + 2개).
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
    'starts_at', p.starts_at, 'ends_at', p.ends_at, 'price', p.price,
    'paid_via', p.paid_via, 'auto_renew', p.auto_renew, 'last_payment_error', p.last_payment_error,
    'created_at', p.created_at, 'user_id', p.user_id,
    'nick', (select nick from public.profiles where id = p.user_id),
    'member_name', p.member_name, 'member_phone', p.member_phone,
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
    'lead_nick', (select pr.nick from public.passes l join public.profiles pr on pr.id = l.user_id where l.id = p.team_id)
  );
end $fn$;
revoke all on function public.pass_json(bigint) from public;

-- 팀원 참여도 이름·번호를 같이 받습니다. (옛 1-인자 함수는 그대로 두어 구버전 앱도 동작)
create or replace function public.pass_join_team(p_code text, p_name text, p_phone text) returns json
language plpgsql security definer set search_path = public as $fn$
declare lead public.passes%rowtype; cnt int; newid bigint; today date := public.kst_today();
begin
  if public.is_banned() then raise exception '이용이 제한된 계정이에요.'; end if;
  select * into lead from public.passes
    where invite_code = upper(btrim(coalesce(p_code, ''))) and kind = 'team' and team_id is null and status in ('active', 'grace');
  if not found then raise exception '초대 코드를 찾을 수 없어요.'; end if;
  if lead.user_id = auth.uid() then raise exception '팀장은 이미 패스가 있어요.'; end if;
  if lead.ends_at < today then raise exception '팀 패스 기간이 끝났어요.'; end if;
  select count(*) into cnt from public.passes where team_id = lead.id and status in ('active', 'grace');
  if cnt >= lead.team_size - 1 then raise exception '팀 인원(%명)이 다 찼어요.', lead.team_size; end if;
  if exists (select 1 from public.passes
             where user_id = auth.uid() and bar_key = lead.bar_key and status in ('requested', 'active', 'grace')) then
    raise exception '이 가게에 이미 패스가 있어요.';
  end if;
  perform set_config('bartalk.trusted', '1', true);
  insert into public.passes (bar_key, bar_name, plan_id, plan_name, user_id, status, kind, days, drinks_per_day,
                             monthly_cap, team_size, duration_days, price, team_id, starts_at, ends_at, paid_via, approved_at,
                             member_name, member_phone)
  values (lead.bar_key, lead.bar_name, lead.plan_id, lead.plan_name || ' · 팀원', auth.uid(), 'active', 'team', lead.days,
          lead.drinks_per_day, lead.monthly_cap, lead.team_size, lead.duration_days, 0, lead.id,
          greatest(lead.starts_at, today), lead.ends_at, lead.paid_via, now(),
          coalesce(p_name, ''), coalesce(p_phone, ''))
  returning id into newid;
  return public.pass_json(newid);
end $fn$;
revoke all on function public.pass_join_team(text, text, text) from public;
grant execute on function public.pass_join_team(text, text, text) to authenticated;
