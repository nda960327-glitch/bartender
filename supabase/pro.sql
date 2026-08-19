-- ============================================================
--  바텐톡 — 학원 · 대회 · 바텐더 프로필
--
--  SQL Editor 에 붙여넣고 실행하세요. 여러 번 실행해도 안전합니다.
--  schema.sql · admin.sql 을 실행한 뒤에 넣어주세요.
--
--  세 가지가 들어갑니다.
--   1) listings          — 조주기능사 학원 정보 · 대회 정보
--   2) bartender_profiles — 바텐더 프로필 (사진 · 경력 · 시그니처)
--   3) 입상 이력과 포트폴리오는 프로필 안에 목록으로 담습니다
-- ============================================================

-- ------------------------------------------------------------
--  1. 학원 · 대회 정보
--
--  둘 다 "이름 · 지역 · 일정 · 연락처 · 설명" 이라 한 표에 담고
--  kind 로만 나눕니다. 화면은 앱에서 갈라서 보여줘요.
-- ------------------------------------------------------------
create table if not exists public.listings (
  id         bigint primary key,
  kind       text   not null check (kind in ('academy', 'contest')),
  author_id  uuid   not null references auth.users(id) on delete cascade,
  title      text   not null check (char_length(title) between 2 and 80),
  org        text,                                    -- 주최 · 운영 주체
  region     text   not null default '전국',
  place      text,                                    -- 주소 · 장소
  phone      text,
  link       text,                                    -- 신청 페이지 · 홈페이지
  fee        text,                                    -- 수강료 · 참가비
  starts_on  date,                                    -- 대회일 · 개강일
  ends_on    date,                                    -- 접수 마감
  body       text not null default '' check (char_length(body) <= 3000),
  img        text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_kind_idx on public.listings (kind, created_at desc);
create index if not exists listings_when_idx on public.listings (kind, starts_on);

comment on table public.listings is '조주기능사 학원 · 바텐더 대회 정보. 누구나 올리고, 올린 사람과 운영자가 고칩니다.';

alter table public.listings enable row level security;

drop policy if exists listings_read   on public.listings;
drop policy if exists listings_insert on public.listings;
drop policy if exists listings_update on public.listings;
drop policy if exists listings_delete on public.listings;

create policy listings_read on public.listings
  for select to authenticated using (true);

create policy listings_insert on public.listings
  for insert to authenticated with check (author_id = auth.uid());

create policy listings_update on public.listings
  for update to authenticated using (author_id = auth.uid() or public.is_admin());

create policy listings_delete on public.listings
  for delete to authenticated using (author_id = auth.uid() or public.is_admin());

-- ------------------------------------------------------------
--  2. 바텐더 프로필
--
--  awards    : [{"year":"2025","title":"OO컵","prize":"대상"}]
--  portfolio : [{"img":"https://...","caption":"시그니처 3종"}]
--  jsonb 로 담는 이유 — 항목 수가 사람마다 다르고, 순서를 그대로
--  보여주면 되기 때문입니다. 표를 세 개로 쪼개면 관리만 복잡해져요.
-- ------------------------------------------------------------
create table if not exists public.bartender_profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 20),
  region     text not null default '서울',
  shop       text,                                     -- 근무하는 곳
  years      smallint not null default 0 check (years between 0 and 60),
  photo      text,                                     -- 프로필 사진
  intro      text not null default '' check (char_length(intro) <= 1000),
  sig_name   text,                                     -- 시그니처 칵테일 이름
  sig_recipe text,                                     -- 재료 · 만드는 법
  sig_note   text,                                     -- 어떤 술인지
  sig_img    text,
  awards     jsonb not null default '[]'::jsonb,
  portfolio  jsonb not null default '[]'::jsonb,
  open       boolean not null default true,            -- false 면 목록에서 빠집니다
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bp_region_idx on public.bartender_profiles (region, updated_at desc);

comment on table public.bartender_profiles is
  '바텐더 프로필. 사진·경력·입상 이력·시그니처 칵테일. 본인만 고칠 수 있습니다.';

alter table public.bartender_profiles enable row level security;

drop policy if exists bp_read   on public.bartender_profiles;
drop policy if exists bp_insert on public.bartender_profiles;
drop policy if exists bp_update on public.bartender_profiles;
drop policy if exists bp_delete on public.bartender_profiles;

-- 공개한 프로필은 누구나 봅니다. 내려둔 프로필은 본인과 운영자만.
create policy bp_read on public.bartender_profiles
  for select to authenticated using (open or user_id = auth.uid() or public.is_admin());

create policy bp_insert on public.bartender_profiles
  for insert to authenticated with check (user_id = auth.uid());

create policy bp_update on public.bartender_profiles
  for update to authenticated using (user_id = auth.uid());

-- 지우기는 본인과 운영자 (허위 프로필 정리)
create policy bp_delete on public.bartender_profiles
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- 정지된 계정은 프로필을 새로 올리거나 고칠 수 없게
create or replace function public.guard_pro_write() returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  if public.is_banned() then
    raise exception '이용이 제한된 계정이에요.';
  end if;
  new.updated_at := now();
  return new;
end $fn$;

drop trigger if exists bp_guard on public.bartender_profiles;
create trigger bp_guard before insert or update on public.bartender_profiles
  for each row execute function public.guard_pro_write();

drop trigger if exists listings_guard on public.listings;
create trigger listings_guard before insert or update on public.listings
  for each row execute function public.guard_pro_write();

-- ------------------------------------------------------------
--  3. 실시간 반영
-- ------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['listings', 'bartender_profiles']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ------------------------------------------------------------
--  참고
-- ------------------------------------------------------------
--  ▼ 학원 하나 직접 넣기 (앱에서 올리는 게 편하지만 대시보드에서도 됩니다)
--  insert into public.listings (id, kind, author_id, title, region, place, phone, fee, body)
--  values (extract(epoch from now())::bigint * 1000, 'academy', '내-이용자-번호',
--          'OO조주학원', '서울', '서울 강남구 ...', '02-000-0000', '주 2회 30만원', '설명');
--
--  ▼ 지난 대회 정리
--  delete from public.listings where kind = 'contest' and ends_on < now() - interval '90 days';
--
--  ▼ 프로필 많이 채운 순서
--  select name, region, shop, jsonb_array_length(awards) as 입상,
--         jsonb_array_length(portfolio) as 사진
--  from public.bartender_profiles where open order by 3 desc, 4 desc;
-- ------------------------------------------------------------
