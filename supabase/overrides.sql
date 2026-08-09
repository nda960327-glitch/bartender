-- ============================================================
--  바텐톡 — 내장 콘텐츠 덮어쓰기 (운영자 전용)
--
--  앱에 내장된 도감 569종은 웹사이트 파일 안에 있어서 SQL 로 못 고칩니다.
--  대신 이 표에 "고칠 부분"만 적어두면, 앱이 내장 데이터 위에 얹어서 보여줍니다.
--  → 코드 배포 없이 오타·도수·가격·설명을 즉시 수정할 수 있어요.
--
--  SQL Editor 에 붙여넣고 실행하세요. 여러 번 실행해도 안전합니다.
-- ============================================================

create table if not exists public.content_overrides (
  kind       text   not null check (kind in ('spirit', 'job')),
  ref_id     bigint not null,
  patch      jsonb  not null default '{}'::jsonb,   -- 바꿀 항목만 담음
  hidden     boolean not null default false,        -- true 면 목록에서 감춤
  updated_by uuid   references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (kind, ref_id)
);

comment on table public.content_overrides is
  '앱에 내장된 도감·채용 항목을 운영자가 수정하기 위한 덮어쓰기 표. patch 에 담긴 필드만 교체됩니다.';

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

-- 읽기는 모두 (수정 내용이 모든 사용자에게 보여야 하니까)
create policy overrides_read on public.content_overrides
  for select to authenticated using (true);

-- 쓰기는 운영자만
create policy overrides_insert on public.content_overrides
  for insert to authenticated with check (public.is_admin() and updated_by = auth.uid());

create policy overrides_update on public.content_overrides
  for update to authenticated using (public.is_admin());

create policy overrides_delete on public.content_overrides
  for delete to authenticated using (public.is_admin());

-- 실시간 반영 (운영자가 고치면 접속 중인 사용자 화면에 바로 적용)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'content_overrides'
  ) then
    alter publication supabase_realtime add table public.content_overrides;
  end if;
end $$;

-- ============================================================
--  사용 예 (앱에서 하는 게 편하지만, 대시보드에서도 가능)
-- ============================================================
--
--  ▼ 특정 도감 항목의 도수와 설명 고치기
--  insert into content_overrides (kind, ref_id, patch, updated_by)
--  values ('spirit', 101, '{"abv": 43, "note": "고친 설명"}'::jsonb, auth.uid())
--  on conflict (kind, ref_id) do update
--    set patch = content_overrides.patch || excluded.patch,
--        updated_at = now();
--
--  ▼ 항목 감추기
--  insert into content_overrides (kind, ref_id, hidden, updated_by)
--  values ('spirit', 101, true, auth.uid())
--  on conflict (kind, ref_id) do update set hidden = true, updated_at = now();
--
--  ▼ 수정 되돌리기 (원래 내장 내용으로 복귀)
--  delete from content_overrides where kind = 'spirit' and ref_id = 101;
--
--  ▼ 현재 수정된 항목 전체 보기
--  select kind, ref_id, hidden, patch, updated_at from content_overrides order by updated_at desc;
-- ============================================================
