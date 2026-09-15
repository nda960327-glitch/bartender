-- 휴대폰 번호 · 마케팅 수신 동의 (2.46)
--
-- profiles 표는 닉네임·색을 모두가 읽을 수 있어서 번호를 거기 두면 안 됩니다.
-- 그래서 본인과 운영자(is_admin)만 읽는 표를 따로 둡니다.
--
-- 실행: Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.
-- (admin.sql 의 public.is_admin() 이 먼저 있어야 해요.)

create table if not exists public.profile_private (
  id            uuid primary key references auth.users(id) on delete cascade,
  phone         text not null check (phone ~ '^01[016789][0-9]{7,8}$'),
  marketing_ok  boolean not null default false,
  marketing_at  timestamptz,            -- 동의한 시각 (법적으로 남겨둬야 해요)
  updated_at    timestamptz not null default now()
);
comment on table public.profile_private is '가입 시 받은 휴대폰 번호와 마케팅 수신 동의. 본인과 운영자만 읽습니다.';

create or replace function public.touch_profile_private() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists profile_private_touch on public.profile_private;
create trigger profile_private_touch before update on public.profile_private
  for each row execute function public.touch_profile_private();

alter table public.profile_private enable row level security;

drop policy if exists profile_private_read   on public.profile_private;
drop policy if exists profile_private_insert on public.profile_private;
drop policy if exists profile_private_update on public.profile_private;

create policy profile_private_read   on public.profile_private for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profile_private_insert on public.profile_private for insert to authenticated
  with check (id = auth.uid());
create policy profile_private_update on public.profile_private for update to authenticated
  using (id = auth.uid());

-- ------------------------------------------------------------
-- 마케팅 발송 명단 뽑기 (운영자가 SQL Editor 에서)
--   동의한 사람만, 동의 일시와 함께. 문자 보낼 때 이 목록만 쓰세요.
-- select p.nick, v.phone, v.marketing_at
--   from public.profile_private v join public.profiles p on p.id = v.id
--  where v.marketing_ok
--  order by v.marketing_at desc;
