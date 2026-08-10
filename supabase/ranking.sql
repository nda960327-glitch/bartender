-- ============================================================
--  랭킹
--
--  schema.sql 다음에 실행하세요. official.sql 과는 무관합니다.
--
--  포인트는 원래 각자 기기에만 쌓였습니다. 그래서 비교할 방법이 없었어요.
--  여기서는 딱 두 가지만 서버에 둡니다 — 닉네임 옆에 붙일 점수와 색.
--  활동 내역은 올리지 않아요.
--
--  ⚠️ 점수는 앱이 보내는 값이라 마음먹으면 조작할 수 있습니다.
--     상금이 걸린 순위가 아니라 "얼마나 열심히 했나" 정도의 장치로만 쓰세요.
--     아래 bump_my_points 가 한 번에 올릴 수 있는 폭을 제한해 두었습니다.
-- ============================================================

alter table public.profiles
  add column if not exists points        integer     not null default 0 check (points >= 0),
  add column if not exists points_at     timestamptz,
  add column if not exists rank_opt_out  boolean     not null default false;

comment on column public.profiles.points is
  '커뮤니티 활동 점수. 앱이 올려 보냅니다 — 정확한 회계가 아니라 순위 표시용입니다.';
comment on column public.profiles.rank_opt_out is
  '순위표에 나오고 싶지 않은 사람. 켜면 top_bartenders 에서 빠집니다.';

create index if not exists profiles_points_idx
  on public.profiles (points desc)
  where not rank_opt_out;


-- ------------------------------------------------------------
--  내 점수 올리기
--
--  값을 통째로 덮어쓰지 않고 "올려도 되는 만큼만" 올립니다.
--    · 내려가는 건 허용 (기기를 새로 잡았을 때 0 으로 리셋되면 곤란하므로 무시)
--    · 한 번에 5000 점 넘게 오르는 건 자릅니다
--    · 하루에 20000 점 넘게 오르는 것도 자릅니다
-- ------------------------------------------------------------
create or replace function public.bump_my_points(p_points integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  cur      integer;
  last_at  timestamptz;
  target   integer;
  step_cap constant integer := 5000;
  day_cap  constant integer := 20000;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;
  if p_points is null or p_points < 0 then
    raise exception '점수가 올바르지 않습니다.';
  end if;

  select points, points_at into cur, last_at
    from public.profiles where id = auth.uid();
  if not found then
    return 0;                                  -- 프로필이 아직 없습니다
  end if;

  target := least(p_points, cur + step_cap);

  -- 같은 날 안에서는 하루 상한도 함께 봅니다.
  if last_at is not null and last_at::date = now()::date then
    target := least(target, cur + day_cap);
  end if;

  if target <= cur then
    return cur;                                -- 내려가거나 그대로면 두고 봅니다
  end if;

  update public.profiles
     set points = target, points_at = now()
   where id = auth.uid();

  return target;
end $$;

revoke all on function public.bump_my_points(integer) from public;
revoke all on function public.bump_my_points(integer) from anon;
grant execute on function public.bump_my_points(integer) to authenticated;


-- ------------------------------------------------------------
--  순위표
--
--  닉네임·색·점수만 나갑니다. 이메일이나 uuid 는 내보내지 않아요.
--  내 줄만 me = true 로 표시해서 앱이 강조할 수 있게 합니다.
-- ------------------------------------------------------------
create or replace function public.top_bartenders(p_limit int default 50)
returns table (
  rank   integer,
  nick   text,
  color  smallint,
  points integer,
  me     boolean
)
language sql
security definer
set search_path = public
as $$
  select
    row_number() over (order by p.points desc, p.id)::integer,
    coalesce(nullif(btrim(p.nick), ''), '익명'),
    coalesce(p.color, 0)::smallint,
    p.points,
    p.id = auth.uid()
  from public.profiles p
  where not p.rank_opt_out
    and p.points > 0
    and (p.banned_until is null or p.banned_until < now())   -- 정지된 계정은 빼요
  order by p.points desc, p.id
  limit least(greatest(p_limit, 1), 100);
$$;

revoke all on function public.top_bartenders(int) from public;
grant execute on function public.top_bartenders(int) to anon;
grant execute on function public.top_bartenders(int) to authenticated;
