-- ============================================================
--  바텐톡 — 도감 공동 편집 (나무위키식)
--
--  SQL Editor 에 붙여넣고 실행하세요. 여러 번 실행해도 안전합니다.
--  schema.sql · admin.sql · overrides.sql 을 실행한 뒤에 넣어주세요.
--
--  이 파일이 하는 일
--   1) 로그인한 사람은 누구나 도감을 고칠 수 있게 엽니다 (즉시 반영)
--   2) 누가 언제 무엇을 바꿨는지 전부 기록합니다
--   3) 이상하면 그 시점으로 되돌릴 수 있게 합니다
--
--  잠가두는 것 (이건 계속 운영자만)
--   · 항목을 목록에서 감추기 / 완전히 지우기
--   · 이용 정지된 사람은 아예 수정 불가
-- ============================================================

-- ------------------------------------------------------------
--  1. 이용 정지 여부 판정
--     (정지된 사람이 도감을 훼손하고 다니면 정지가 의미가 없어요)
-- ------------------------------------------------------------
create or replace function public.is_banned() returns boolean
language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and banned_until is not null and banned_until > now()
  );
$fn$;

revoke all on function public.is_banned() from public;
grant execute on function public.is_banned() to authenticated;

-- ------------------------------------------------------------
--  2. 수정 기록
--
--   before : 바뀌기 전 값 (되돌리기에 씁니다)
--   after  : 바뀐 값
--   기록은 아무도 못 지웁니다. 지울 수 있으면 기록이 아니니까요.
-- ------------------------------------------------------------
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

-- 기록은 누구나 볼 수 있어야 합니다. 훼손을 막는 건 감시의 눈이에요.
create policy edits_read on public.content_edits
  for select to authenticated using (true);

-- 남길 수 있는 건 "내가 한 수정"뿐. 정지된 사람은 못 남깁니다(=수정도 못 함).
create policy edits_insert on public.content_edits
  for insert to authenticated
  with check (editor_id = auth.uid() and not public.is_banned());

-- update/delete 정책 없음 → 기록은 고칠 수도 지울 수도 없습니다.

-- ------------------------------------------------------------
--  3. 도감 덮어쓰기를 모두에게 열기
--
--  앱 내장 도감 569종은 파일 안에 있어서, "바꿀 부분"만 이 표에 쌓입니다.
--  (표 자체는 overrides.sql 에서 만들어요)
-- ------------------------------------------------------------
drop policy if exists overrides_insert on public.content_overrides;
drop policy if exists overrides_update on public.content_overrides;
drop policy if exists overrides_delete on public.content_overrides;

create policy overrides_insert on public.content_overrides
  for insert to authenticated
  with check (updated_by = auth.uid() and not public.is_banned());

create policy overrides_update on public.content_overrides
  for update to authenticated
  using (not public.is_banned());

-- 통째로 지우는 것(= 앱 원본으로 복귀)은 운영자만.
-- 일반 사용자의 '되돌리기'는 지우는 게 아니라 새 수정으로 처리합니다.
create policy overrides_delete on public.content_overrides
  for delete to authenticated using (public.is_admin());

-- 감추기(hidden)는 운영자 전용입니다.
-- 정책만으로는 "이 칸만 못 바꾸게"를 표현하기 어려워서 방아쇠로 막아요.
create or replace function public.guard_override() returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  if public.is_banned() then
    raise exception '이용이 제한된 계정이에요.';
  end if;
  if not public.is_admin() then
    -- 운영자가 감춰둔 것을 일반 사용자가 풀거나, 마음대로 감추지 못하게
    -- (insert 일 때는 old 가 없으므로 나눠서 봐야 합니다)
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

-- ------------------------------------------------------------
--  4. 사용자가 직접 올린 도감 항목도 함께 고칠 수 있게
--
--  내장 569종만 열어두면 "내가 등록한 술"은 아무도 못 고쳐서
--  도감이 반쪽만 자랍니다. 대신 지우는 건 올린 사람과 운영자만.
-- ------------------------------------------------------------
drop policy if exists spirits_update on public.spirits;
create policy spirits_update on public.spirits
  for update to authenticated using (not public.is_banned());

drop policy if exists spirits_delete on public.spirits;
create policy spirits_delete on public.spirits
  for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- 남의 항목을 고칠 때 작성자를 자기로 바꿔치기하지 못하게 막아요.
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

-- ------------------------------------------------------------
--  5. 편집 기록을 실시간으로 (다른 사람이 고치면 바로 보이게)
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'content_edits'
  ) then
    alter publication supabase_realtime add table public.content_edits;
  end if;
end $$;

-- ------------------------------------------------------------
--  6. 운영자용 — 훼손 감시
-- ------------------------------------------------------------
--
--  ▼ 최근 수정 50건
--  select created_at, editor_nick, kind, ref_id, title, fields
--  from public.content_edits order by created_at desc limit 50;
--
--  ▼ 한 사람이 오늘 몇 건이나 고쳤나 (도배 의심)
--  select editor_nick, editor_id, count(*)
--  from public.content_edits
--  where created_at > now() - interval '1 day'
--  group by 1, 2 order by 3 desc;
--
--  ▼ 특정 항목의 수정 내역
--  select created_at, editor_nick, fields, before, after
--  from public.content_edits
--  where kind = 'spirit' and ref_id = 101 order by created_at desc;
--
--  ▼ 이 항목을 앱 원본으로 완전히 복귀 (모든 수정 취소)
--  delete from public.content_overrides where kind = 'spirit' and ref_id = 101;
--
--  ▼ 훼손한 사람 정지 (기록의 editor_id 를 넣으세요)
--  update public.profiles set banned_until = now() + interval '7 days'
--  where id = '여기에-이용자-번호';
--
-- ------------------------------------------------------------
