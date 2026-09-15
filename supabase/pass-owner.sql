-- 운영자 추가 — 같은 닉네임이 여러 명일 때 골라서 지정 (2.56.3)
-- (phone.sql 의 profile_private 표가 있어야 이름·번호가 가려진 채로 나와요. 없으면 빈칸.)
--
-- 기존 pass_add_owner(닉네임) 은 같은 닉네임이 있으면 먼저 가입한 사람을 잡아 엉뚱한 사람이 운영자가 될 수 있어요.
-- 그래서 (1) 닉네임으로 후보를 찾고 (2) 고른 사람의 계정 번호로 지정하는 함수 두 개를 더합니다.
--
-- 실행: Supabase 대시보드 → SQL Editor 에 붙여넣고 Run. (pass.sql 다음에)

-- 0) 비공개 표에 이름 칸 (phone.sql 을 넣은 서버만)
do $$
begin
  if to_regclass('public.profile_private') is not null then
    alter table public.profile_private add column if not exists name text not null default '';
  end if;
end $$;

-- 1) 닉네임으로 후보 찾기 — 닉네임·물방울 색·가입일·쓴 글 수 + 가린 이름·번호 (김*수 · 010-****-5678)
--    가게 운영자나 관리자만 부를 수 있어요. 이름·번호를 통째로 보여주면 남의 개인정보가 새니까 가운데를 가립니다.
create or replace function public.pass_find_nick(p_nick text) returns json
language plpgsql stable security definer set search_path = public as $fn$
begin
  if auth.uid() is null then raise exception '로그인이 필요해요.'; end if;
  if not (public.is_admin() or exists (select 1 from public.bar_owners where user_id = auth.uid())) then
    raise exception '가게 운영자만 찾을 수 있어요.';
  end if;
  if nullif(btrim(coalesce(p_nick, '')), '') is null then return '[]'::json; end if;
  return (
    select coalesce(json_agg(json_build_object(
      'id', p.id, 'nick', p.nick, 'color', p.color, 'joined', p.created_at::date,
      'posts', (select count(*) from public.posts where author_id = p.id),
      'bars', (select count(*) from public.bar_owners where user_id = p.id),
      'name_masked', (select case when char_length(v.name) <= 1 then v.name
                                  when char_length(v.name) = 2 then left(v.name, 1) || '*'
                                  else left(v.name, 1) || repeat('*', char_length(v.name) - 2) || right(v.name, 1) end
                        from public.profile_private v where v.id = p.id),
      'phone_masked', (select case when char_length(v.phone) >= 8 then left(v.phone, 3) || '-****-' || right(v.phone, 4) else null end
                         from public.profile_private v where v.id = p.id)
    ) order by p.created_at), '[]'::json)
    from (select * from public.profiles where btrim(nick) = btrim(p_nick) order by created_at limit 10) p
  );
end $fn$;
revoke all on function public.pass_find_nick(text) from public;
grant execute on function public.pass_find_nick(text) to authenticated;

-- 2) 계정 번호로 운영자 지정 (기존 운영자·관리자만)
create or replace function public.pass_add_owner_id(p_bar text, p_bar_name text, p_user uuid) returns json
language plpgsql security definer set search_path = public as $fn$
declare target_nick text;
begin
  if not (public.is_admin() or public.is_bar_owner(p_bar)) then raise exception '운영자나 관리자만 지정할 수 있어요.'; end if;
  select nick into target_nick from public.profiles where id = p_user;
  if target_nick is null then raise exception '그 계정을 찾을 수 없어요.'; end if;
  insert into public.bar_owners (bar_key, user_id, bar_name) values (p_bar, p_user, coalesce(p_bar_name, ''))
    on conflict do nothing;
  insert into public.bar_pass_settings (bar_key, bar_name) values (p_bar, coalesce(p_bar_name, ''))
    on conflict (bar_key) do nothing;
  return json_build_object('user_id', p_user, 'nick', target_nick);
end $fn$;
revoke all on function public.pass_add_owner_id(text, text, uuid) from public;
grant execute on function public.pass_add_owner_id(text, text, uuid) to authenticated;
