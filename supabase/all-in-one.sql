-- ============================================================
--  바텐톡 — 새 기능 한 번에 설치  (SQL Editor 에 통째로 붙여넣고 Run)
--  여러 번 실행해도 안전합니다. 순서가 중요해서 한 파일로 묶었어요.
--  schema.sql · admin.sql · official.sql 이 먼저 들어가 있어야 합니다.
--  설명이 붙은 원본은 supabase/ 폴더의 각 파일을 보세요.
-- ============================================================


-- ###########  1) 도감·모임 감추기 (운영자가 내린 항목)  ###########

create table if not exists public.content_overrides (
  kind       text   not null check (kind in ('spirit', 'job', 'meet')),
  ref_id     bigint not null,
  patch      jsonb  not null default '{}'::jsonb,   -- 바꿀 항목만 담음
  hidden     boolean not null default false,        -- true 면 목록에서 감춤
  updated_by uuid   references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (kind, ref_id)
);

do $$
begin
  alter table public.content_overrides drop constraint if exists content_overrides_kind_check;
  alter table public.content_overrides
    add constraint content_overrides_kind_check check (kind in ('spirit', 'job', 'meet'));
end $$;

comment on table public.content_overrides is
  '앱에 내장된 도감·채용·모임 항목을 운영자가 수정하거나 감추기 위한 덮어쓰기 표. patch 에 담긴 필드만 교체됩니다.';

create index if not exists content_overrides_kind_idx on public.content_overrides (kind);

alter table public.content_overrides enable row level security;

do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'content_overrides'
  loop
    execute format('drop policy %I on public.content_overrides', r.policyname);
  end loop;
end $$;

create policy overrides_read on public.content_overrides
  for select to authenticated using (true);

create policy overrides_insert on public.content_overrides
  for insert to authenticated with check (public.is_admin() and updated_by = auth.uid());

create policy overrides_update on public.content_overrides
  for update to authenticated using (public.is_admin());

create policy overrides_delete on public.content_overrides
  for delete to authenticated using (public.is_admin());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'content_overrides'
  ) then
    alter publication supabase_realtime add table public.content_overrides;
  end if;
end $$;


-- ###########  2) 도감 공동 편집 + 수정 기록  ###########

create or replace function public.is_banned() returns boolean
language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and banned_until is not null and banned_until > now()
  );
$fn$;

revoke all on function public.is_banned() from public;
grant execute on function public.is_banned() to authenticated;

create table if not exists public.content_edits (
  id          bigint generated always as identity primary key,
  kind        text   not null check (kind in ('spirit', 'cocktail', 'job', 'meet')),
  ref_id      bigint not null,
  title       text,                                  -- 그때의 항목 이름 (목록에 보여주려고)
  editor_id   uuid   references auth.users(id) on delete set null,
  editor_nick text,
  fields      text[] not null default '{}',          -- 바뀐 항목 이름들
  before      jsonb  not null default '{}'::jsonb,
  after       jsonb  not null default '{}'::jsonb,
  note        text,                                  -- '되돌리기' 같은 표시
  created_at  timestamptz not null default now()
);

create index if not exists content_edits_ref_idx  on public.content_edits (kind, ref_id, created_at desc);
create index if not exists content_edits_time_idx on public.content_edits (created_at desc);
create index if not exists content_edits_who_idx  on public.content_edits (editor_id, created_at desc);

comment on table public.content_edits is
  '도감 공동 편집 기록. 누가 무엇을 어떻게 바꿨는지 남겨 되돌리기와 훼손 추적에 씁니다.';

alter table public.content_edits enable row level security;

drop policy if exists edits_read   on public.content_edits;
drop policy if exists edits_insert on public.content_edits;

create policy edits_read on public.content_edits
  for select to authenticated using (true);

create policy edits_insert on public.content_edits
  for insert to authenticated
  with check (editor_id = auth.uid() and not public.is_banned());

drop policy if exists overrides_insert on public.content_overrides;
drop policy if exists overrides_update on public.content_overrides;
drop policy if exists overrides_delete on public.content_overrides;

create policy overrides_insert on public.content_overrides
  for insert to authenticated
  with check (updated_by = auth.uid() and not public.is_banned());

create policy overrides_update on public.content_overrides
  for update to authenticated
  using (not public.is_banned());

create policy overrides_delete on public.content_overrides
  for delete to authenticated using (public.is_admin());

create or replace function public.guard_override() returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  if public.is_banned() then
    raise exception '이용이 제한된 계정이에요.';
  end if;
  if not public.is_admin() then
    if tg_op = 'UPDATE' then new.hidden := old.hidden;
    else new.hidden := false;
    end if;
  end if;
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end $fn$;

drop trigger if exists content_overrides_guard on public.content_overrides;
create trigger content_overrides_guard
  before insert or update on public.content_overrides
  for each row execute function public.guard_override();

drop policy if exists spirits_update on public.spirits;
create policy spirits_update on public.spirits
  for update to authenticated using (not public.is_banned());

drop policy if exists spirits_delete on public.spirits;
create policy spirits_delete on public.spirits
  for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

create or replace function public.guard_spirit_edit() returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  if public.is_banned() then
    raise exception '이용이 제한된 계정이에요.';
  end if;
  new.id        := old.id;
  new.author_id := old.author_id;   -- 처음 올린 사람은 안 바뀝니다
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end $fn$;

drop trigger if exists spirits_edit_guard on public.spirits;
create trigger spirits_edit_guard
  before update on public.spirits
  for each row execute function public.guard_spirit_edit();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'content_edits'
  ) then
    alter publication supabase_realtime add table public.content_edits;
  end if;
end $$;


-- ###########  3) 모임 참가 신청서 (연락처)  ###########

create table if not exists public.meet_contacts (
  meet_id    bigint not null references public.meets(id) on delete cascade,
  user_id    uuid   not null references auth.users(id)   on delete cascade,
  nick       text   not null check (char_length(nick) between 1 and 20),
  phone      text   not null check (char_length(phone) between 6 and 20),
  memo       text   check (memo is null or char_length(memo) <= 200),
  created_at timestamptz not null default now(),
  primary key (meet_id, user_id)
);

comment on table public.meet_contacts is
  '모임 참가 신청서. 주최자와 본인, 운영자만 볼 수 있습니다.';

create index if not exists meet_contacts_meet_idx on public.meet_contacts (meet_id, created_at);

alter table public.meet_contacts enable row level security;

drop policy if exists mct_read   on public.meet_contacts;
drop policy if exists mct_insert on public.meet_contacts;
drop policy if exists mct_update on public.meet_contacts;
drop policy if exists mct_delete on public.meet_contacts;

create policy mct_read on public.meet_contacts
  for select to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.meets m where m.id = meet_id and m.host_id = auth.uid())
    or public.is_admin()
  );

create policy mct_insert on public.meet_contacts
  for insert to authenticated with check (user_id = auth.uid());

create policy mct_update on public.meet_contacts
  for update to authenticated using (user_id = auth.uid());

create policy mct_delete on public.meet_contacts
  for delete to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.meets m where m.id = meet_id and m.host_id = auth.uid())
    or public.is_admin()
  );


-- ###########  4) 추천인(영업) 코드 + 활성 사용자  ###########

create table if not exists public.referral_codes (
  code       text primary key,              -- 대문자 3글자 (예: G2G)
  owner      text not null,                 -- 영업하시는 분 이름
  memo       text,                          -- 메모 (연락처·지역 등 자유)
  active     boolean not null default true, -- false 로 바꾸면 더는 안 받아요
  created_at timestamptz not null default now()
);

comment on table public.referral_codes is '영업하시는 분에게 나눠주는 추천인 코드. 앱에서는 만들 수 없고 대시보드에서만 관리합니다.';

insert into public.referral_codes (code, owner, memo) values
  ('G2G', '영업 1', null),
  ('J7J', '영업 2', null),
  ('N4N', '영업 3', null),
  ('T3T', '영업 4', null)
-- 이미 이름을 바꿔두셨다면 그대로 둡니다 (덮어쓰지 않아요).
-- 이름은 아래처럼 따로 바꾸세요:
--   update public.referral_codes set owner = '김바텐' where code = 'G2G';
on conflict (code) do nothing;

alter table public.referral_codes enable row level security;

drop policy if exists refcodes_read on public.referral_codes;
create policy refcodes_read on public.referral_codes
  for select to authenticated using (public.is_admin());

alter table public.profiles add column if not exists ref_code  text;         -- 누구 소개로 왔는지
alter table public.profiles add column if not exists ref_at    timestamptz;  -- 코드를 적은 시각
alter table public.profiles add column if not exists last_seen timestamptz;  -- 마지막으로 앱을 켠 시각

create index if not exists profiles_ref_idx  on public.profiles (ref_code);
create index if not exists profiles_seen_idx on public.profiles (last_seen desc);

create or replace function public.guard_ref_code() returns trigger
language plpgsql security definer set search_path = public as $fn$
declare ok boolean;
begin
  new.ref_code := nullif(upper(btrim(coalesce(new.ref_code, ''))), '');

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

create or replace function public.ref_owner(p_code text) returns text
language sql stable security definer set search_path = public as $fn$
  select owner from public.referral_codes
  where code = upper(btrim(coalesce(p_code, ''))) and active;
$fn$;

revoke all on function public.ref_owner(text) from public;
grant execute on function public.ref_owner(text) to authenticated, anon;

create or replace function public.touch_me() returns void
language sql volatile security definer set search_path = public as $fn$
  update public.profiles set last_seen = now() where id = auth.uid();
$fn$;

revoke all on function public.touch_me() from public;
grant execute on function public.touch_me() to authenticated;

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


-- ###########  5) 학원·대회 정보 + 바텐더 프로필  ###########

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

create policy bp_read on public.bartender_profiles
  for select to authenticated using (open or user_id = auth.uid() or public.is_admin());

create policy bp_insert on public.bartender_profiles
  for insert to authenticated with check (user_id = auth.uid());

create policy bp_update on public.bartender_profiles
  for update to authenticated using (user_id = auth.uid());

create policy bp_delete on public.bartender_profiles
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

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


-- ###########  6) 봇 계정 금·은·동 관리자 표시  ###########

update public.profiles set
  is_official    = true,
  official_label = '관리자',
  color          = v.color
from (values
  ('바텐톡',        10),
  ('바텐톡 위스키', 11),
  ('바텐톡 칵테일', 12)
) as v(nick, color)
where btrim(public.profiles.nick) = v.nick;

update public.posts p set
  official       = true,
  official_label = '관리자'
from public.profiles pr
where pr.id = p.author_id
  and btrim(pr.nick) in ('바텐톡', '바텐톡 위스키', '바텐톡 칵테일');

