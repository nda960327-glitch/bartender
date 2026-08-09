-- ============================================================
--  바텐톡 — 운영자(관리자) 권한
--
--  SQL Editor 에 붙여넣고 실행하세요. 여러 번 실행해도 안전합니다.
--  schema.sql 을 이미 실행한 프로젝트에 추가로 적용하는 파일입니다.
--
--  핵심 원칙
--   · 관리자 여부는 서버가 판단합니다. 앱 코드를 조작해도 권한이 생기지 않습니다.
--   · 앱에서는 관리자를 만들 수 없습니다. 오직 이 대시보드에서만 지정합니다.
--   · 모든 관리자 조치는 admin_actions 에 기록됩니다.
-- ============================================================

-- ------------------------------------------------------------
--  1. 관리자 명단
-- ------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

drop policy if exists admins_read_self on public.admins;
-- 자기가 관리자인지'만' 확인할 수 있어요. 관리자 명단 전체는 아무도 못 봅니다.
create policy admins_read_self on public.admins
  for select to authenticated using (user_id = auth.uid());

-- ⚠️ insert/update/delete 정책을 일부러 만들지 않았습니다.
--    정책이 없으면 RLS 가 전부 거부하므로, 앱에서는 관리자를 만들 수도 지울 수도 없습니다.

-- ------------------------------------------------------------
--  2. 권한 판정 함수
-- ------------------------------------------------------------
-- security definer: admins 테이블을 직접 못 읽는 사용자도 "나 관리자야?" 판정은 받을 수 있게 함
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ------------------------------------------------------------
--  3. 관리자 조치 기록 (분쟁 대응용)
-- ------------------------------------------------------------
create table if not exists public.admin_actions (
  id          bigint generated always as identity primary key,
  admin_id    uuid not null references auth.users(id) on delete cascade,
  action      text not null,
  target_type text,
  target_id   bigint,
  target_user uuid,
  title       text,
  reason      text,
  created_at  timestamptz not null default now()
);

create index if not exists admin_actions_time_idx on public.admin_actions (created_at desc);

alter table public.admin_actions enable row level security;

drop policy if exists admin_actions_read   on public.admin_actions;
drop policy if exists admin_actions_insert on public.admin_actions;

create policy admin_actions_read on public.admin_actions
  for select to authenticated using (public.is_admin());

create policy admin_actions_insert on public.admin_actions
  for insert to authenticated with check (public.is_admin() and admin_id = auth.uid());

-- ------------------------------------------------------------
--  4. 기존 정책에 관리자 예외 추가
--     (본인 것 or 관리자)
-- ------------------------------------------------------------

-- 게시글
drop policy if exists posts_update on public.posts;
create policy posts_update on public.posts for update to authenticated
  using (author_id = auth.uid() or public.is_admin());

drop policy if exists posts_delete on public.posts;
create policy posts_delete on public.posts for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- 댓글
drop policy if exists comments_delete on public.comments;
create policy comments_delete on public.comments for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- 술도감
drop policy if exists spirits_update on public.spirits;
create policy spirits_update on public.spirits for update to authenticated
  using (author_id = auth.uid() or public.is_admin());

drop policy if exists spirits_delete on public.spirits;
create policy spirits_delete on public.spirits for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- 리뷰
drop policy if exists reviews_delete on public.reviews;
create policy reviews_delete on public.reviews for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- 모임
drop policy if exists meets_update on public.meets;
create policy meets_update on public.meets for update to authenticated
  using (host_id = auth.uid() or public.is_admin());

drop policy if exists meets_delete on public.meets;
create policy meets_delete on public.meets for delete to authenticated
  using (host_id = auth.uid() or public.is_admin());

drop policy if exists mc_delete on public.meet_comments;
create policy mc_delete on public.meet_comments for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- 프로필: 관리자는 이용 정지(banned_until)를 설정할 수 있어야 함
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin());

-- 신고: 접수는 누구나, 열람·처리는 관리자만
drop policy if exists reports_read   on public.reports;
drop policy if exists reports_update on public.reports;

create policy reports_read on public.reports
  for select to authenticated using (public.is_admin());

create policy reports_update on public.reports
  for update to authenticated using (public.is_admin());

-- 사진: 관리자는 부적절한 이미지를 내릴 수 있어야 함
drop policy if exists photos_delete on storage.objects;
create policy photos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'photos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- ------------------------------------------------------------
--  5. 관리자 지정 / 해제  ← 여기만 직접 실행하시면 됩니다
-- ------------------------------------------------------------
--
--  이용자 번호(uuid)는 앱에서 확인할 수 있어요:
--    마이페이지 > 고객센터 > 🆔 이용자 번호
--
--  ▼ 관리자로 지정
--  insert into public.admins (user_id, note)
--  values ('여기에-이용자-번호', '운영자')
--  on conflict (user_id) do nothing;
--
--  ▼ 관리자 해제
--  delete from public.admins where user_id = '여기에-이용자-번호';
--
--  ▼ 현재 관리자 목록
--  select a.user_id, a.note, a.created_at, p.nick
--  from public.admins a left join public.profiles p on p.id = a.user_id;
--
--  ▼ 관리자가 한 조치 확인
--  select * from public.admin_actions order by created_at desc limit 50;
--
-- ------------------------------------------------------------

-- 실시간 구독 대상에 신고 추가 (관리자 화면에 신고가 바로 뜨도록)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reports'
  ) then
    alter publication supabase_realtime add table public.reports;
  end if;
end $$;
