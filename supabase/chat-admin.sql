-- ============================================================
--  바텐톡 — 1:1 채팅 + 관리자 통계
--
--  SQL Editor 에 붙여넣고 실행하세요. 여러 번 실행해도 안전합니다.
--  schema.sql, admin.sql 을 먼저 실행한 뒤에 적용하세요.
-- ============================================================

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
-- ============================================================
