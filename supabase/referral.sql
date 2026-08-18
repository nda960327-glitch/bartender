-- ============================================================
--  바텐톡 — 추천인(영업) 코드
--
--  Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 실행하세요.
--  여러 번 실행해도 안전합니다.
--  schema.sql · admin.sql · chat-admin.sql 을 실행한 뒤에 넣어주세요.
--
--  이 파일이 하는 일
--   1) 영업하시는 분마다 짧은 코드를 하나씩 줍니다 (예: G2G)
--   2) 가입할 때 그 코드를 적으면, 누가 데려온 회원인지 남습니다
--   3) 앱을 켤 때마다 "마지막 접속"을 기록해서,
--      데려온 50명이 진짜 쓰는 사람인지 숫자로 볼 수 있게 합니다
-- ============================================================

-- ------------------------------------------------------------
--  1. 추천인 코드 명단
-- ------------------------------------------------------------
create table if not exists public.referral_codes (
  code       text primary key,              -- 대문자 3글자 (예: G2G)
  owner      text not null,                 -- 영업하시는 분 이름
  memo       text,                          -- 메모 (연락처·지역 등 자유)
  active     boolean not null default true, -- false 로 바꾸면 더는 안 받아요
  created_at timestamptz not null default now()
);

comment on table public.referral_codes is '영업하시는 분에게 나눠주는 추천인 코드. 앱에서는 만들 수 없고 대시보드에서만 관리합니다.';

-- 처음 쓸 코드 4개입니다. 헷갈리는 글자(O·0·I·1·S·5)는 뺐어요.
-- owner 는 실제 이름으로 바꿔서 나눠주세요. (아래 5번 항목 참고)
insert into public.referral_codes (code, owner, memo) values
  ('G2G', '영업 1', '실제 이름으로 바꿔주세요'),
  ('J7J', '영업 2', '실제 이름으로 바꿔주세요'),
  ('N4N', '영업 3', '실제 이름으로 바꿔주세요'),
  ('T3T', '영업 4', '실제 이름으로 바꿔주세요')
on conflict (code) do nothing;

alter table public.referral_codes enable row level security;

-- 코드 명단 전체는 운영자만 봅니다.
-- 일반 회원은 아래 ref_owner() 로 "이 코드 맞나요?" 만 물어볼 수 있어요.
drop policy if exists refcodes_read on public.referral_codes;
create policy refcodes_read on public.referral_codes
  for select to authenticated using (public.is_admin());
-- insert/update/delete 정책은 일부러 없습니다 → 앱에서는 코드를 못 만듭니다.

-- ------------------------------------------------------------
--  2. 프로필에 칸 세 개 추가
-- ------------------------------------------------------------
alter table public.profiles add column if not exists ref_code  text;         -- 누구 소개로 왔는지
alter table public.profiles add column if not exists ref_at    timestamptz;  -- 코드를 적은 시각
alter table public.profiles add column if not exists last_seen timestamptz;  -- 마지막으로 앱을 켠 시각

create index if not exists profiles_ref_idx  on public.profiles (ref_code);
create index if not exists profiles_seen_idx on public.profiles (last_seen desc);

-- ------------------------------------------------------------
--  3. 코드 검사 + 한 번 정해지면 못 바꾸게
--
--  · 없는 코드를 적으면 그냥 빈칸으로 둡니다 (가입 자체는 막지 않아요)
--  · 이미 코드가 있는 사람이 다른 코드로 바꾸려 하면 무시합니다
--    (나중에 남의 실적을 가로채는 일을 막기 위해서예요)
-- ------------------------------------------------------------
create or replace function public.guard_ref_code() returns trigger
language plpgsql security definer set search_path = public as $fn$
declare ok boolean;
begin
  new.ref_code := nullif(upper(btrim(coalesce(new.ref_code, ''))), '');

  -- 이미 정해진 사람은 예전 값을 그대로 유지
  if tg_op = 'UPDATE' and old.ref_code is not null then
    new.ref_code := old.ref_code;
    new.ref_at   := old.ref_at;
    return new;
  end if;

  if new.ref_code is not null then
    select exists (select 1 from public.referral_codes
                   where code = new.ref_code and active) into ok;
    if ok then
      new.ref_at := coalesce(new.ref_at, now());
    else
      new.ref_code := null;   -- 없는 코드 → 없던 일로
      new.ref_at   := null;
    end if;
  end if;
  return new;
end $fn$;

drop trigger if exists profiles_ref_guard on public.profiles;
create trigger profiles_ref_guard
  before insert or update on public.profiles
  for each row execute function public.guard_ref_code();

-- ------------------------------------------------------------
--  4-1. 가입 화면에서 "이 코드 맞나요?" 확인
--       맞으면 영업하시는 분 이름이, 틀리면 빈 값이 돌아옵니다.
-- ------------------------------------------------------------
create or replace function public.ref_owner(p_code text) returns text
language sql stable security definer set search_path = public as $fn$
  select owner from public.referral_codes
  where code = upper(btrim(coalesce(p_code, ''))) and active;
$fn$;

revoke all on function public.ref_owner(text) from public;
grant execute on function public.ref_owner(text) to authenticated, anon;

-- ------------------------------------------------------------
--  4-2. 앱을 켤 때마다 "마지막 접속" 도장 찍기
--       (앱이 하루 한 번만 부릅니다. 서버에 부담 없어요.)
-- ------------------------------------------------------------
create or replace function public.touch_me() returns void
language sql volatile security definer set search_path = public as $fn$
  update public.profiles set last_seen = now() where id = auth.uid();
$fn$;

revoke all on function public.touch_me() from public;
grant execute on function public.touch_me() to authenticated;

-- ------------------------------------------------------------
--  4-3. 운영자용 — 코드별 성적표
--
--   데려온 회원   ref_code 가 이 코드인 사람 전부
--   최근 7일 가입 이번 주에 새로 들어온 사람
--   7일 활성      최근 7일 안에 앱을 켠 사람   ← "진짜 쓰는 사람"
--   30일 활성     최근 30일 안에 앱을 켠 사람
--   글쓴 사람     글·댓글·리뷰를 하나라도 남긴 사람
--
--   ※ last_seen 은 이 SQL 을 넣은 뒤부터 쌓입니다.
--     그전부터 있던 회원은 앱을 한 번 켜야 활성으로 잡혀요.
-- ------------------------------------------------------------
create or replace function public.admin_referrals()
returns table (
  code text, owner text, memo text, active boolean,
  signups bigint, joined_7d bigint,
  active_7d bigint, active_30d bigint, writers bigint,
  last_join timestamptz
)
language sql stable security definer set search_path = public as $fn$
  select
    r.code, r.owner, r.memo, r.active,
    count(p.id),
    count(p.id) filter (where p.created_at > now() - interval '7 days'),
    count(p.id) filter (where p.last_seen  > now() - interval '7 days'),
    count(p.id) filter (where p.last_seen  > now() - interval '30 days'),
    count(p.id) filter (where
         exists (select 1 from public.posts    x where x.author_id = p.id)
      or exists (select 1 from public.comments x where x.author_id = p.id)
      or exists (select 1 from public.reviews  x where x.author_id = p.id)),
    max(p.created_at)
  from public.referral_codes r
  left join public.profiles p on p.ref_code = r.code
  where public.is_admin()
  group by r.code, r.owner, r.memo, r.active
  order by count(p.id) desc, r.code;
$fn$;

revoke all on function public.admin_referrals() from public;
grant execute on function public.admin_referrals() to authenticated;

-- 코드를 안 적고 가입한 사람 수 + 전체 활성 수
create or replace function public.admin_referral_summary() returns json
language sql stable security definer set search_path = public as $fn$
  select case when public.is_admin() then json_build_object(
    'members',    (select count(*) from public.profiles),
    'no_code',    (select count(*) from public.profiles where ref_code is null),
    'active_7d',  (select count(*) from public.profiles where last_seen > now() - interval '7 days'),
    'active_30d', (select count(*) from public.profiles where last_seen > now() - interval '30 days')
  ) else null end;
$fn$;

revoke all on function public.admin_referral_summary() from public;
grant execute on function public.admin_referral_summary() to authenticated;

-- ------------------------------------------------------------
--  5. 코드 관리 — 여기만 직접 실행하시면 됩니다
-- ------------------------------------------------------------
--
--  ▼ 이름 바꾸기 (G2G 를 김바텐 님에게 준 경우)
--  update public.referral_codes set owner = '김바텐', memo = '010-0000-0000'
--  where code = 'G2G';
--
--  ▼ 코드 새로 만들기
--  insert into public.referral_codes (code, owner) values ('P8P', '박바텐');
--
--  ▼ 코드 그만 쓰기 (지금까지 실적은 그대로 남아요)
--  update public.referral_codes set active = false where code = 'P8P';
--
--  ▼ 성적표 한눈에 보기 (앱 관리자 화면에서도 볼 수 있어요)
--  select * from public.admin_referrals();
--
--  ▼ 특정 코드로 들어온 사람들의 활동 자세히 보기
--  select p.nick, p.created_at as 가입, p.last_seen as 마지막접속,
--         (select count(*) from public.posts    x where x.author_id = p.id) as 글,
--         (select count(*) from public.comments x where x.author_id = p.id) as 댓글
--  from public.profiles p where p.ref_code = 'G2G' order by p.created_at desc;
--
-- ------------------------------------------------------------
