-- ============================================================
--  FCM 기기 주소 보관함
--
--  schema.sql, push.sql 다음에 실행하세요.
--
--  안드로이드 앱이 켜질 때 자기 FCM 토큰을 주소에 실어 보내고,
--  웹이 그걸 받아 여기에 등록합니다. 누구의 기기인지는 로그인한
--  웹만 알기 때문에 이런 방식이에요.
--
--  웹푸시(push_subs)와 따로 둡니다. 같은 사람이 웹과 앱을 둘 다 쓰면
--  양쪽에 하나씩 생기고, 발송할 때 중복은 서버가 걸러요.
-- ============================================================

create table if not exists public.fcm_tokens (
  token      text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  platform   text not null default 'android',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.fcm_tokens is
  '안드로이드 앱의 알림 주소. 앱을 다시 깔면 토큰이 바뀌므로 옛것은 발송 실패 시 지웁니다.';

create index if not exists fcm_tokens_user_idx on public.fcm_tokens (user_id);

alter table public.fcm_tokens enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
            where schemaname = 'public' and tablename = 'fcm_tokens'
  loop
    execute format('drop policy %I on public.fcm_tokens', r.policyname);
  end loop;
end $$;

-- 본인 것만 넣고 지울 수 있습니다. 읽기는 서버(service_role)만 해요 —
-- 남의 기기 주소를 앱에서 볼 이유가 없습니다.
create policy fcm_insert on public.fcm_tokens
  for insert to authenticated with check (user_id = auth.uid());
create policy fcm_update on public.fcm_tokens
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy fcm_delete on public.fcm_tokens
  for delete to authenticated using (user_id = auth.uid());


-- 앱이 켜질 때마다 부릅니다. 있으면 시각만 새로 찍어요.
create or replace function public.save_fcm_token(p_token text, p_platform text default 'android')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;
  if p_token is null or btrim(p_token) = '' or char_length(p_token) > 512 then
    raise exception '토큰이 올바르지 않습니다.';
  end if;

  insert into public.fcm_tokens (token, user_id, platform, updated_at)
  values (btrim(p_token), auth.uid(), coalesce(nullif(btrim(p_platform), ''), 'android'), now())
  on conflict (token) do update
    set user_id    = excluded.user_id,     -- 기기를 남에게 넘긴 경우
        platform   = excluded.platform,
        updated_at = now();
end $$;

revoke all on function public.save_fcm_token(text, text) from public;
revoke all on function public.save_fcm_token(text, text) from anon;
grant execute on function public.save_fcm_token(text, text) to authenticated;


-- 발송 서버가 씁니다. 특정 사람들의 기기 주소를 한 번에 가져와요.
create or replace function public.fcm_tokens_for(p_users uuid[])
returns table (token text, user_id uuid)
language sql
security definer
set search_path = public
as $$
  select t.token, t.user_id
    from public.fcm_tokens t
   where t.user_id = any(p_users);
$$;

revoke all on function public.fcm_tokens_for(uuid[]) from public;
revoke all on function public.fcm_tokens_for(uuid[]) from anon;
revoke all on function public.fcm_tokens_for(uuid[]) from authenticated;
grant execute on function public.fcm_tokens_for(uuid[]) to service_role;


-- 죽은 토큰 치우기 (발송이 실패하면 서버가 부릅니다)
create or replace function public.drop_fcm_token(p_token text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.fcm_tokens where token = p_token;
$$;

revoke all on function public.drop_fcm_token(text) from public;
revoke all on function public.drop_fcm_token(text) from anon;
revoke all on function public.drop_fcm_token(text) from authenticated;
grant execute on function public.drop_fcm_token(text) to service_role;
