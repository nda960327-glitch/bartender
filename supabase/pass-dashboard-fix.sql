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
