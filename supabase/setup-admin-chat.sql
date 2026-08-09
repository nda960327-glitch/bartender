-- ############################################################
--  바텐톡 — 운영자 권한 + 1:1 채팅 (통합본)
--  이 파일 하나만 붙여넣고 Run 하면 됩니다. 여러 번 실행해도 안전합니다.
--  (schema.sql 은 이미 실행하셨다는 전제입니다)
-- ############################################################

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


-- ============================================================
--  바텐톡 — 1:1 채팅 + 관리자 통계
--
--  SQL Editor 에 붙여넣고 실행하세요. 여러 번 실행해도 안전합니다.
--  schema.sql 을 먼저 실행한 뒤에 적용하세요.
-- ============================================================

-- ------------------------------------------------------------
--  0. 의존성 준비
--     admin.sql 을 아직 실행하지 않았어도 이 파일이 그대로 돌아가도록,
--     여기서 쓰는 admins 테이블과 is_admin() 을 먼저 확보합니다.
--     (admin.sql 과 같은 정의라 나중에 실행해도 충돌하지 않아요)
-- ------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

drop policy if exists admins_read_self on public.admins;
create policy admins_read_self on public.admins
  for select to authenticated using (user_id = auth.uid());

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ------------------------------------------------------------
--  1. 대화방 (두 사람당 하나)
-- ------------------------------------------------------------
-- user_a < user_b 로 정렬해 저장하기 때문에, 누가 먼저 말을 걸어도
-- 같은 대화방이 재사용됩니다. (A→B 와 B→A 가 따로 생기지 않음)
create table if not exists public.conversations (
  id         bigint primary key,
  user_a     uuid not null references auth.users(id) on delete cascade,
  user_b     uuid not null references auth.users(id) on delete cascade,
  ctx        text,
  a_color    smallint not null default 2,
  b_color    smallint not null default 2,
  last_at    timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint conversations_pair_order check (user_a < user_b),
  constraint conversations_pair_unique unique (user_a, user_b)
);

create index if not exists conversations_a_idx on public.conversations (user_a, last_at desc);
create index if not exists conversations_b_idx on public.conversations (user_b, last_at desc);

-- ------------------------------------------------------------
--  2. 메시지
-- ------------------------------------------------------------
create table if not exists public.messages (
  id              bigint primary key,
  conversation_id bigint not null references public.conversations(id) on delete cascade,
  sender          uuid not null references auth.users(id) on delete cascade,
  text            text not null check (char_length(text) between 1 and 2000),
  created_at      timestamptz not null default now()
);

create index if not exists messages_conv_idx on public.messages (conversation_id, created_at);

-- ------------------------------------------------------------
--  3. 읽음 표시
-- ------------------------------------------------------------
create table if not exists public.conversation_reads (
  conversation_id bigint not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  last_read_at    timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

-- 새 메시지가 오면 대화방을 목록 맨 위로
create or replace function public.touch_conversation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set last_at = new.created_at where id = new.conversation_id;
  return null;
end $$;

drop trigger if exists messages_touch_trg on public.messages;
create trigger messages_touch_trg
  after insert on public.messages
  for each row execute function public.touch_conversation();

-- ------------------------------------------------------------
--  4. RLS — 대화 당사자만. 운영자도 남의 DM 은 볼 수 없습니다.
-- ------------------------------------------------------------
alter table public.conversations      enable row level security;
alter table public.messages           enable row level security;
alter table public.conversation_reads enable row level security;

do $$
declare r record;
begin
  for r in
    select tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('conversations','messages','conversation_reads')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy conv_read on public.conversations
  for select to authenticated
  using (user_a = auth.uid() or user_b = auth.uid());

create policy conv_insert on public.conversations
  for insert to authenticated
  with check (user_a = auth.uid() or user_b = auth.uid());

create policy conv_update on public.conversations
  for update to authenticated
  using (user_a = auth.uid() or user_b = auth.uid());

-- 대화 참여자인지 확인하는 도우미
create or replace function public.in_conversation(cid bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversations c
    where c.id = cid and (c.user_a = auth.uid() or c.user_b = auth.uid())
  );
$$;
revoke all on function public.in_conversation(bigint) from public;
grant execute on function public.in_conversation(bigint) to authenticated;

create policy msg_read on public.messages
  for select to authenticated using (public.in_conversation(conversation_id));

create policy msg_insert on public.messages
  for insert to authenticated
  with check (sender = auth.uid() and public.in_conversation(conversation_id));

create policy msg_delete on public.messages
  for delete to authenticated using (sender = auth.uid());

create policy read_own on public.conversation_reads
  for select to authenticated using (user_id = auth.uid());
create policy read_upsert on public.conversation_reads
  for insert to authenticated with check (user_id = auth.uid());
create policy read_update on public.conversation_reads
  for update to authenticated using (user_id = auth.uid());

-- 실시간 구독
do $$
declare t text;
begin
  foreach t in array array['conversations','messages']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ============================================================
--  5. 관리자 통계 — 앱의 "현황" 탭
-- ============================================================
create or replace function public.admin_stats() returns json
language sql stable security definer set search_path = public as $$
  select case when public.is_admin() then json_build_object(
    'users',            (select count(*) from public.profiles),
    'users_today',      (select count(*) from public.profiles where created_at > now() - interval '1 day'),
    'posts',            (select count(*) from public.posts),
    'posts_today',      (select count(*) from public.posts where created_at > now() - interval '1 day'),
    'comments',         (select count(*) from public.comments),
    'meets',            (select count(*) from public.meets),
    'meets_upcoming',   (select count(*) from public.meets where meet_at > now()),
    'spirits',          (select count(*) from public.spirits),
    'reviews',          (select count(*) from public.reviews),
    'reports_pending',  (select count(*) from public.reports where status = '접수'),
    'reports_total',    (select count(*) from public.reports),
    'banned',           (select count(*) from public.profiles where banned_until > now()),
    'conversations',    (select count(*) from public.conversations)
  ) else null end;
$$;

revoke all on function public.admin_stats() from public;
grant execute on function public.admin_stats() to authenticated;

-- ============================================================
--  6. 관리자 회원 목록 — 앱의 "회원" 탭
-- ============================================================
create or replace function public.admin_users(q text default '', lim int default 100)
returns table (
  id uuid, nick text, color smallint,
  banned_until timestamptz, created_at timestamptz,
  posts bigint, comments bigint, reported bigint
)
language sql stable security definer set search_path = public as $$
  select
    p.id, p.nick, p.color, p.banned_until, p.created_at,
    (select count(*) from public.posts    x where x.author_id  = p.id),
    (select count(*) from public.comments x where x.author_id  = p.id),
    (select count(*) from public.reports  x where x.target_user = p.id)
  from public.profiles p
  where public.is_admin()
    and (coalesce(q, '') = '' or p.nick ilike '%' || q || '%')
  order by p.created_at desc
  limit least(coalesce(lim, 100), 500);
$$;

revoke all on function public.admin_users(text, int) from public;
grant execute on function public.admin_users(text, int) to authenticated;

-- ============================================================
--  참고
--   · 운영자는 신고·통계·회원 목록을 볼 수 있지만
--     1:1 대화 내용은 볼 수 없습니다 (RLS 가 당사자만 허용).
--   · 대화 내용까지 봐야 하는 상황(수사 협조 등)에는
--     대시보드에서 service_role 로 직접 조회하세요.
--
--  ⚠️ 이 파일만으로는 "운영자가 남의 글을 삭제"할 수 없습니다.
--     그 권한은 admin.sql 이 각 테이블 정책에 관리자 예외를 넣어 만듭니다.
--     admin.sql 도 함께 실행해주세요.
-- ============================================================
