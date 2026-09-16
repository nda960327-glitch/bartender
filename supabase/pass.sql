-- ============================================================
--  하우스 패스 — 가게 단위 월정액 멤버십 (구독 · 입장 QR · 도장 · 잔수)
--
--  Supabase > SQL Editor 에 붙여넣고 Run 하세요. 여러 번 실행해도 안전합니다.
--  schema.sql · admin.sql · bars.sql 이 먼저 들어가 있어야 합니다.
--
--  구조
--    bar_owners          어느 가게를 누가 운영하나 (가게 열쇠 = bars.sql 의 bar_key)
--    bar_pass_settings   가게별 패스 켜기/끄기, 도장 목표, 이달의 한정 칵테일
--    pass_plans          가게가 파는 상품 (라이트·올데이·트리플·팀·원데이 …)
--    passes              손님이 신청/보유한 패스 (팀원은 team_id 로 팀장 패스에 묶임)
--    pass_visits         스캔 기록 (입장·잔 사용·보상 제공)
--    pass_rewards        도장 목표 달성 보상 (이달의 한정 칵테일 1잔)
--    pass_billing        토스 빌링키 (앱에서 읽을 수 없음 — 서버 전용)
--    pass_payments       결제 내역
--
--  원칙
--    · "무제한"은 없습니다. 하루 잔수 + 월 상한으로만 말해요.
--    · 미리 금액을 충전하는 구조가 아니라 기간제(월정액)만 팝니다.
--    · 스캔 기록은 앱이 직접 쓰지 못하고 pass_scan() 을 통해서만 남습니다.
-- ============================================================

-- 한국 날짜. 밤 12시를 넘겨도 서버(UTC)가 아닌 우리 날짜로 셉니다.
create or replace function public.kst_today() returns date
language sql stable as $$ select (now() at time zone 'Asia/Seoul')::date $$;

-- ------------------------------------------------------------
--  1. 가게 운영자
-- ------------------------------------------------------------
create table if not exists public.bar_owners (
  bar_key    text not null check (char_length(bar_key) between 1 and 200),
  user_id    uuid not null references auth.users(id) on delete cascade,
  bar_name   text not null default '',
  created_at timestamptz not null default now(),
  primary key (bar_key, user_id)
);
create index if not exists bar_owners_user_idx on public.bar_owners (user_id);

create or replace function public.is_bar_owner(k text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.bar_owners where bar_key = k and user_id = auth.uid());
$$;
revoke all on function public.is_bar_owner(text) from public;
grant execute on function public.is_bar_owner(text) to authenticated;

alter table public.bar_owners enable row level security;
drop policy if exists bar_owners_read on public.bar_owners;
create policy bar_owners_read on public.bar_owners for select to authenticated
  using (user_id = auth.uid() or public.is_bar_owner(bar_key) or public.is_admin());
drop policy if exists bar_owners_write on public.bar_owners;
create policy bar_owners_write on public.bar_owners for delete to authenticated
  using (public.is_bar_owner(bar_key) or public.is_admin());
-- 추가는 pass_add_owner() 로만 (닉네임으로 사람을 찾아야 해서)

-- ------------------------------------------------------------
--  2. 가게별 설정
-- ------------------------------------------------------------
create table if not exists public.bar_pass_settings (
  bar_key       text primary key,
  bar_name      text not null default '',
  enabled       boolean not null default false,
  stamp_goal    smallint not null default 4 check (stamp_goal between 2 and 10),
  special_drink text not null default '' check (char_length(special_drink) <= 60),
  notice        text not null default '' check (char_length(notice) <= 300),
  updated_at    timestamptz not null default now()
);
-- 연계 가게는 카카오 목록에 없어도 모든 손님의 "바 찾기"에 보여야 해서 가게 정보를 같이 둡니다.
alter table public.bar_pass_settings add column if not exists addr   text not null default '';
alter table public.bar_pass_settings add column if not exists region text not null default '';
alter table public.bar_pass_settings add column if not exists area   text not null default '';
alter table public.bar_pass_settings add column if not exists type   text not null default '';
alter table public.bar_pass_settings add column if not exists lat    double precision;
alter table public.bar_pass_settings add column if not exists lng    double precision;

alter table public.bar_pass_settings enable row level security;
drop policy if exists bps_read on public.bar_pass_settings;
create policy bps_read on public.bar_pass_settings for select to authenticated using (true);
drop policy if exists bps_insert on public.bar_pass_settings;
create policy bps_insert on public.bar_pass_settings for insert to authenticated
  with check (public.is_bar_owner(bar_key) or public.is_admin());
drop policy if exists bps_update on public.bar_pass_settings;
create policy bps_update on public.bar_pass_settings for update to authenticated
  using (public.is_bar_owner(bar_key) or public.is_admin());

-- ------------------------------------------------------------
--  3. 상품
-- ------------------------------------------------------------
create table if not exists public.pass_plans (
  id             bigint generated always as identity primary key,
  bar_key        text not null,
  name           text not null check (char_length(name) between 1 and 30),
  price          integer not null check (price >= 0),
  kind           text not null default 'personal' check (kind in ('personal', 'team', 'oneday')),
  days           text not null default 'all' check (days in ('all', 'tue-thu')),
  drinks_per_day smallint not null default 1 check (drinks_per_day between 1 and 9),
  monthly_cap    smallint check (monthly_cap is null or monthly_cap between 1 and 200),
  team_size      smallint not null default 1 check (team_size between 1 and 20),
  duration_days  smallint not null default 30 check (duration_days between 1 and 366),
  note           text not null default '' check (char_length(note) <= 120),
  active         boolean not null default true,
  sort           smallint not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists pass_plans_bar_idx on public.pass_plans (bar_key, active, sort);

alter table public.pass_plans enable row level security;
drop policy if exists pass_plans_read on public.pass_plans;
create policy pass_plans_read on public.pass_plans for select to authenticated using (true);
drop policy if exists pass_plans_write on public.pass_plans;
create policy pass_plans_write on public.pass_plans for all to authenticated
  using (public.is_bar_owner(bar_key) or public.is_admin())
  with check (public.is_bar_owner(bar_key) or public.is_admin());

-- ------------------------------------------------------------
--  4. 패스
-- ------------------------------------------------------------
create table if not exists public.passes (
  id                 bigint generated always as identity primary key,
  bar_key            text not null,
  bar_name           text not null default '',
  plan_id            bigint references public.pass_plans(id) on delete set null,
  plan_name          text not null default '',
  user_id            uuid not null references auth.users(id) on delete cascade,
  status             text not null default 'requested'
                     check (status in ('requested', 'active', 'grace', 'expired', 'cancelled', 'rejected')),
  kind               text not null default 'personal',
  days               text not null default 'all',
  drinks_per_day     smallint not null default 1,
  monthly_cap        smallint,
  team_size          smallint not null default 1,
  duration_days      smallint not null default 30,
  price              integer not null default 0,
  team_id            bigint references public.passes(id) on delete cascade,  -- 팀원이면 팀장 패스
  invite_code        text unique,
  starts_at          date,
  ends_at            date,
  paid_via           text not null default 'manual' check (paid_via in ('manual', 'toss')),
  auto_renew         boolean not null default false,
  renew_attempts     smallint not null default 0,
  next_retry_at      timestamptz,
  last_payment_error text,
  qr_nonce           text,
  qr_at              timestamptz,
  expiry_notified_at timestamptz,
  note               text not null default '' check (char_length(note) <= 200),
  approved_by        uuid,
  approved_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists passes_user_idx on public.passes (user_id, status);
create index if not exists passes_bar_idx  on public.passes (bar_key, status);
create index if not exists passes_team_idx on public.passes (team_id);
create index if not exists passes_ends_idx on public.passes (ends_at) where status in ('active', 'grace');

alter table public.passes enable row level security;
drop policy if exists passes_read on public.passes;
create policy passes_read on public.passes for select to authenticated
  using (user_id = auth.uid() or public.is_bar_owner(bar_key) or public.is_admin());
drop policy if exists passes_insert on public.passes;
create policy passes_insert on public.passes for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists passes_update on public.passes;
create policy passes_update on public.passes for update to authenticated
  using (public.is_bar_owner(bar_key) or public.is_admin());

-- 앱이 넣는 신청은 상품표의 값을 그대로 복사하고 '신청' 상태로 고정합니다.
-- (가격·잔수를 손님이 정할 수 없게.) 서버(service role)나 우리 함수가 넣을 때는 건드리지 않아요.
create or replace function public.guard_pass_insert() returns trigger
language plpgsql security definer set search_path = public as $fn$
declare pl public.pass_plans%rowtype; st public.bar_pass_settings%rowtype;
begin
  new.updated_at := now();
  if auth.uid() is null or current_setting('bartalk.trusted', true) = '1' then return new; end if;
  if public.is_banned() then raise exception '이용이 제한된 계정이에요.'; end if;
  if new.user_id <> auth.uid() then raise exception '본인 패스만 신청할 수 있어요.'; end if;

  select * into pl from public.pass_plans where id = new.plan_id and active;
  if not found then raise exception '지금 판매 중인 상품이 아니에요.'; end if;
  select * into st from public.bar_pass_settings where bar_key = pl.bar_key;
  if not found or not st.enabled then raise exception '이 가게는 아직 패스를 받지 않아요.'; end if;
  if exists (select 1 from public.passes
             where user_id = new.user_id and bar_key = pl.bar_key and status in ('requested', 'active', 'grace')) then
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
  return new;
end $fn$;

drop trigger if exists passes_guard_insert on public.passes;
create trigger passes_guard_insert before insert on public.passes
  for each row execute function public.guard_pass_insert();

-- 승인(→ active)되는 순간 기간을 정하고, 팀 패스면 초대 코드를 만듭니다.
create or replace function public.guard_pass_update() returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  new.updated_at := now();
  if new.status = 'active' and old.status <> 'active' then
    new.starts_at := coalesce(new.starts_at, public.kst_today());
    new.ends_at   := coalesce(new.ends_at, new.starts_at + (new.duration_days - 1));
    if auth.uid() is not null then new.approved_by := auth.uid(); end if;
    new.approved_at := coalesce(new.approved_at, now());
    if new.kind = 'team' and new.team_id is null and new.invite_code is null then
      new.invite_code := upper(substr(md5(random()::text || clock_timestamp()::text || new.id::text), 1, 6));
    end if;
  end if;
  return new;
end $fn$;

drop trigger if exists passes_guard_update on public.passes;
create trigger passes_guard_update before update on public.passes
  for each row execute function public.guard_pass_update();

-- ------------------------------------------------------------
--  5. 스캔 기록 · 보상
-- ------------------------------------------------------------
create table if not exists public.pass_visits (
  id       bigint generated always as identity primary key,
  pass_id  bigint not null references public.passes(id) on delete cascade,
  bar_key  text not null,
  user_id  uuid not null,
  action   text not null check (action in ('enter', 'drink', 'reward')),
  drinks   smallint not null default 0,
  side     boolean not null default false,   -- 사이드(안주) 주문했는지
  by_user  uuid,                             -- 스캔한 운영자
  at       timestamptz not null default now(),
  day      date not null default public.kst_today()
);
create index if not exists pass_visits_pass_idx on public.pass_visits (pass_id, day);
create index if not exists pass_visits_bar_idx  on public.pass_visits (bar_key, day);

alter table public.pass_visits enable row level security;
drop policy if exists pass_visits_read on public.pass_visits;
create policy pass_visits_read on public.pass_visits for select to authenticated
  using (user_id = auth.uid() or public.is_bar_owner(bar_key) or public.is_admin());
-- 쓰기 정책 없음: pass_scan() 만 기록합니다.

create table if not exists public.pass_rewards (
  id          bigint generated always as identity primary key,
  pass_id     bigint not null references public.passes(id) on delete cascade,
  bar_key     text not null,
  user_id     uuid not null,
  month       text not null,               -- 'YYYY-MM'
  kind        text not null default 'special',
  label       text not null default '',
  redeemed_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (pass_id, month, kind)
);
alter table public.pass_rewards enable row level security;
drop policy if exists pass_rewards_read on public.pass_rewards;
create policy pass_rewards_read on public.pass_rewards for select to authenticated
  using (user_id = auth.uid() or public.is_bar_owner(bar_key) or public.is_admin());

-- ------------------------------------------------------------
--  6. 결제 (3단계 — 토스페이먼츠 정기결제)
--     빌링키는 앱에서 절대 읽을 수 없습니다. 정책이 하나도 없으니 service role 만 접근해요.
-- ------------------------------------------------------------
create table if not exists public.pass_billing (
  user_id      uuid not null references auth.users(id) on delete cascade,
  bar_key      text not null,
  customer_key text not null,
  billing_key  text not null,
  card_label   text not null default '',   -- "현대 ****1234"
  created_at   timestamptz not null default now(),
  primary key (user_id, bar_key)
);
alter table public.pass_billing enable row level security;

create table if not exists public.pass_payments (
  id          bigint generated always as identity primary key,
  pass_id     bigint references public.passes(id) on delete set null,
  user_id     uuid not null,
  bar_key     text not null,
  order_id    text not null unique,
  amount      integer not null,
  status      text not null check (status in ('paid', 'failed')),
  method      text not null default 'toss',
  receipt_url text,
  fail_reason text,
  paid_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists pass_payments_user_idx on public.pass_payments (user_id, created_at desc);
alter table public.pass_payments enable row level security;
drop policy if exists pass_payments_read on public.pass_payments;
create policy pass_payments_read on public.pass_payments for select to authenticated
  using (user_id = auth.uid() or public.is_bar_owner(bar_key) or public.is_admin());

-- 내 카드가 등록돼 있나 (라벨만 돌려줍니다)
create or replace function public.pass_card_label(p_bar text) returns text
language sql stable security definer set search_path = public as $fn$
  select card_label from public.pass_billing where user_id = auth.uid() and bar_key = p_bar;
$fn$;
revoke all on function public.pass_card_label(text) from public;
grant execute on function public.pass_card_label(text) to authenticated;

-- ------------------------------------------------------------
--  7. 패스 한 장의 현재 상태 (오늘 잔수 · 이달 잔수 · 도장 · 보상)
--     권한 검사는 부르는 쪽(pass_info / pass_scan)이 합니다.
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
    'starts_at', p.starts_at, 'ends_at', p.ends_at, 'price', p.price,
    'paid_via', p.paid_via, 'auto_renew', p.auto_renew, 'last_payment_error', p.last_payment_error,
    'created_at', p.created_at, 'user_id', p.user_id,
    'nick', (select nick from public.profiles where id = p.user_id),
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

-- 손님(본인) 또는 운영자가 보는 패스 상태
create or replace function public.pass_info(p_pass bigint) returns json
language plpgsql stable security definer set search_path = public as $fn$
declare p public.passes%rowtype;
begin
  select * into p from public.passes where id = p_pass;
  if not found then raise exception '없는 패스예요.'; end if;
  if not (p.user_id = auth.uid() or public.is_bar_owner(p.bar_key) or public.is_admin()) then
    raise exception '볼 수 없는 패스예요.';
  end if;
  return public.pass_json(p.id);
end $fn$;
revoke all on function public.pass_info(bigint) from public;
grant execute on function public.pass_info(bigint) to authenticated;

-- ------------------------------------------------------------
--  8. 입장 QR — 손님이 부르면 90초짜리 코드가 새로 나옵니다
--     화면 캡처를 친구에게 보내도 90초 뒤엔 못 씁니다.
-- ------------------------------------------------------------
create or replace function public.pass_qr(p_pass bigint) returns json
language plpgsql security definer set search_path = public as $fn$
declare p public.passes%rowtype; nonce text; today date := public.kst_today();
begin
  select * into p from public.passes where id = p_pass and user_id = auth.uid();
  if not found then raise exception '내 패스가 아니에요.'; end if;
  if p.status not in ('active', 'grace') then raise exception '아직 쓸 수 없는 패스예요.'; end if;
  if today < p.starts_at then raise exception '%부터 쓸 수 있어요.', to_char(p.starts_at, 'MM.DD'); end if;
  if today > p.ends_at then raise exception '기간이 끝난 패스예요.'; end if;
  -- 0/O, 1/I 처럼 헷갈리는 글자가 없도록 16진수만 씁니다 (직접 입력할 때 편하게)
  nonce := upper(substr(md5(random()::text || clock_timestamp()::text || p.id::text), 1, 6));
  perform set_config('bartalk.trusted', '1', true);
  update public.passes set qr_nonce = nonce, qr_at = now() where id = p.id;
  return json_build_object('token', 'BTP:' || p.id || ':' || nonce, 'code', nonce, 'pass_id', p.id, 'ttl', 90);
end $fn$;
revoke all on function public.pass_qr(bigint) from public;
grant execute on function public.pass_qr(bigint) to authenticated;

-- ------------------------------------------------------------
--  9. 스캔 — 운영자가 부릅니다
--     enter  : 입장(도장). 하루 한 번만 찍히고, 이달 n번째 방문이면 보상이 생겨요
--     drink  : 잔 사용 (하루 잔수·월 상한 검사)
--     reward : 보상(한정 칵테일) 제공 처리
--     p_side : 사이드(안주)를 시켰다고 표시
-- ------------------------------------------------------------
create or replace function public.pass_scan(p_token text, p_action text, p_side boolean default false)
returns json language plpgsql security definer set search_path = public as $fn$
declare
  parts text[]; p public.passes%rowtype; st public.bar_pass_settings%rowtype;
  today date := public.kst_today(); mon text := to_char(public.kst_today(), 'YYYY-MM');
  today_drinks int; month_drinks int; stamps int; has_enter boolean; rid bigint;
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

  select coalesce(sum(drinks), 0) into today_drinks from public.pass_visits where pass_id = p.id and day = today;
  select coalesce(sum(drinks), 0) into month_drinks from public.pass_visits where pass_id = p.id and to_char(day, 'YYYY-MM') = mon;
  select exists (select 1 from public.pass_visits where pass_id = p.id and day = today and action = 'enter') into has_enter;

  if p_action not in ('enter', 'drink', 'reward') then raise exception '알 수 없는 동작이에요.'; end if;

  -- 오늘 첫 스캔이면 입장(도장)
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
    if today_drinks >= p.drinks_per_day then raise exception '오늘 잔수(%잔)를 다 썼어요.', p.drinks_per_day; end if;
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

-- ------------------------------------------------------------
--  10. 팀 패스 참여 (초대 코드)
-- ------------------------------------------------------------
create or replace function public.pass_join_team(p_code text) returns json
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
                             monthly_cap, team_size, duration_days, price, team_id, starts_at, ends_at, paid_via, approved_at)
  values (lead.bar_key, lead.bar_name, lead.plan_id, lead.plan_name || ' · 팀원', auth.uid(), 'active', 'team', lead.days,
          lead.drinks_per_day, lead.monthly_cap, lead.team_size, lead.duration_days, 0, lead.id,
          greatest(lead.starts_at, today), lead.ends_at, lead.paid_via, now())
  returning id into newid;
  return public.pass_json(newid);
end $fn$;
revoke all on function public.pass_join_team(text) from public;
grant execute on function public.pass_join_team(text) to authenticated;

-- 신청 취소 (승인 전에만)
create or replace function public.pass_cancel_mine(p_pass bigint) returns void
language plpgsql security definer set search_path = public as $fn$
begin
  perform set_config('bartalk.trusted', '1', true);
  update public.passes set status = 'cancelled'
    where id = p_pass and user_id = auth.uid() and status = 'requested';
  if not found then raise exception '취소할 수 있는 신청이 없어요.'; end if;
end $fn$;
revoke all on function public.pass_cancel_mine(bigint) from public;
grant execute on function public.pass_cancel_mine(bigint) to authenticated;

-- ------------------------------------------------------------
--  11. 운영자 지정 — 관리자 또는 기존 운영자가 닉네임으로 추가
--      p_nick 이 비면 부른 사람 자신을 운영자로 (관리자가 자기 가게를 등록할 때)
-- ------------------------------------------------------------
drop function if exists public.pass_add_owner(text, text, text);
create or replace function public.pass_add_owner(p_bar text, p_bar_name text, p_nick text default null, p_info jsonb default null) returns json
language plpgsql security definer set search_path = public as $fn$
declare target uuid; target_nick text;
begin
  if not (public.is_admin() or public.is_bar_owner(p_bar)) then raise exception '관리자만 운영자를 지정할 수 있어요.'; end if;
  if nullif(btrim(coalesce(p_nick, '')), '') is null then
    target := auth.uid();
  else
    select id into target from public.profiles where btrim(nick) = btrim(p_nick) order by created_at limit 1;
    if target is null then raise exception '그 닉네임을 찾을 수 없어요.'; end if;
  end if;
  select nick into target_nick from public.profiles where id = target;
  insert into public.bar_owners (bar_key, user_id, bar_name) values (p_bar, target, coalesce(p_bar_name, ''))
    on conflict do nothing;
  insert into public.bar_pass_settings (bar_key, bar_name, addr, region, area, type, lat, lng)
  values (p_bar, coalesce(p_bar_name, ''),
          coalesce(p_info->>'addr', ''), coalesce(p_info->>'region', ''), coalesce(p_info->>'area', ''), coalesce(p_info->>'type', ''),
          nullif(p_info->>'lat', '')::double precision, nullif(p_info->>'lng', '')::double precision)
  on conflict (bar_key) do update set
    bar_name = case when public.bar_pass_settings.bar_name = '' then excluded.bar_name else public.bar_pass_settings.bar_name end,
    addr = case when public.bar_pass_settings.addr = '' then excluded.addr else public.bar_pass_settings.addr end,
    region = case when public.bar_pass_settings.region = '' then excluded.region else public.bar_pass_settings.region end,
    area = case when public.bar_pass_settings.area = '' then excluded.area else public.bar_pass_settings.area end,
    type = case when public.bar_pass_settings.type = '' then excluded.type else public.bar_pass_settings.type end,
    lat = coalesce(public.bar_pass_settings.lat, excluded.lat),
    lng = coalesce(public.bar_pass_settings.lng, excluded.lng);
  return json_build_object('user_id', target, 'nick', target_nick);
end $fn$;
revoke all on function public.pass_add_owner(text, text, text, jsonb) from public;
grant execute on function public.pass_add_owner(text, text, text, jsonb) to authenticated;

-- ------------------------------------------------------------
--  12. 운영자 대시보드 — 매주 볼 숫자 4개 + 최근 14일
--      회원 수 · 회원 월 방문 · 화~목 밤 손님 · 사이드 주문률
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
--  13. 실시간 — 운영자 화면이 새 신청을 바로 보게
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'passes') then
    execute 'alter publication supabase_realtime add table public.passes';
  end if;
end $$;
