-- ============================================================
--  바텐톡 — 모임 참가 신청서 (닉네임 · 연락처)
--
--  SQL Editor 에 붙여넣고 실행하세요. 여러 번 실행해도 안전합니다.
--  schema.sql · admin.sql 을 실행한 뒤에 넣어주세요.
--
--  왜 표를 따로 만드나요?
--   참가자 목록(meet_participants)은 "몇 명 참여 중"을 세느라
--   모든 사람이 읽을 수 있게 열려 있습니다. 거기에 전화번호를 넣으면
--   누구나 남의 번호를 가져갈 수 있어요. 그래서 연락처만 따로 담고,
--   주최자·본인·운영자에게만 열어둡니다.
-- ============================================================

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

-- 읽기: 내 신청서 · 내가 연 모임의 신청서 · 운영자
create policy mct_read on public.meet_contacts
  for select to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.meets m where m.id = meet_id and m.host_id = auth.uid())
    or public.is_admin()
  );

-- 쓰기: 자기 신청서만
create policy mct_insert on public.meet_contacts
  for insert to authenticated with check (user_id = auth.uid());

create policy mct_update on public.meet_contacts
  for update to authenticated using (user_id = auth.uid());

-- 지우기: 본인이 참여를 취소하거나, 주최자가 모임을 정리하거나, 운영자
create policy mct_delete on public.meet_contacts
  for delete to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.meets m where m.id = meet_id and m.host_id = auth.uid())
    or public.is_admin()
  );

-- ------------------------------------------------------------
--  참고
-- ------------------------------------------------------------
--
--  ▼ 특정 모임의 신청자 명단 (주최자 계정으로 실행해야 보입니다)
--  select nick, phone, memo, created_at
--  from public.meet_contacts where meet_id = 여기에모임번호
--  order by created_at;
--
--  ▼ 대시보드(운영자)에서 전체 보기
--  select m.title, c.nick, c.phone, c.created_at
--  from public.meet_contacts c join public.meets m on m.id = c.meet_id
--  order by c.created_at desc limit 50;
--
-- ------------------------------------------------------------
