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
