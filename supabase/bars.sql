-- ============================================================
--  바 좋아요 · 별점 · 댓글
--
--  Supabase > SQL Editor 에 붙여넣고 Run 하세요.
--  여러 번 실행해도 안전합니다.
--
--  ⚠️ 가게를 무엇으로 알아보나
--     바 목록(js/seed-bars.js)은 카카오에서 받아 만든 파일이라
--     다시 받으면 번호(id)가 통째로 바뀝니다. 번호로 묶어두면
--     목록을 갱신하는 순간 "르챔버에 달린 댓글"이 엉뚱한 가게로 갑니다.
--     그래서 가게 이름 + 주소로 만든 글자 열쇠(bar_key)를 씁니다.
-- ============================================================

-- ------------------------------------------------------------
--  1. 별점 · 댓글
--     한 사람이 한 가게에 여러 번 쓸 수 있어요 (댓글이니까요).
--     별점은 안 줘도 됩니다 — 그냥 한마디만 남길 수 있게.
-- ------------------------------------------------------------
create table if not exists public.bar_reviews (
  id         bigint primary key,
  bar_key    text not null check (char_length(bar_key) between 1 and 200),
  bar_name   text not null default '',
  author_id  uuid not null references auth.users(id) on delete cascade,
  stars      smallint check (stars between 1 and 5),
  text       text not null default '' check (char_length(text) <= 1000),
  color      smallint not null default 2,
  created_at timestamptz not null default now()
);

create index if not exists bar_reviews_key_idx    on public.bar_reviews (bar_key, created_at desc);
create index if not exists bar_reviews_author_idx on public.bar_reviews (author_id);

-- ------------------------------------------------------------
--  2. 좋아요 (한 사람당 한 가게에 하나)
-- ------------------------------------------------------------
create table if not exists public.bar_likes (
  bar_key    text not null check (char_length(bar_key) between 1 and 200),
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (bar_key, user_id)
);

create index if not exists bar_likes_user_idx on public.bar_likes (user_id);

-- ------------------------------------------------------------
--  3. 가게별 합계
--     목록에 하트 수와 별점을 보여주려면 필요합니다.
--     3천 곳을 하나하나 세면 목록이 멈춰요. 서버가 미리 세어둡니다.
--     활동이 있는 가게만 줄이 생기므로 표는 작습니다.
-- ------------------------------------------------------------
create table if not exists public.bar_stats (
  bar_key    text primary key,
  bar_name   text not null default '',
  likes      integer not null default 0,
  rated      integer not null default 0,   -- 별점을 준 사람 수
  stars_sum  integer not null default 0,   -- 별점 합계 (평균 = stars_sum / rated)
  comments   integer not null default 0,   -- 글이 있는 댓글 수
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
--  4. 합계는 서버가 셉니다 (앱이 숫자를 조작할 수 없게)
-- ------------------------------------------------------------
create or replace function public.bar_stats_touch(k text, nm text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.bar_stats (bar_key, bar_name)
  values (k, coalesce(nm, ''))
  on conflict (bar_key) do update
    set bar_name = case when public.bar_stats.bar_name = '' then excluded.bar_name
                        else public.bar_stats.bar_name end;
end $$;

create or replace function public.bump_bar_like() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    perform public.bar_stats_touch(new.bar_key, '');
    update public.bar_stats
       set likes = likes + 1, updated_at = now()
     where bar_key = new.bar_key;
    return new;
  else
    update public.bar_stats
       set likes = greatest(0, likes - 1), updated_at = now()
     where bar_key = old.bar_key;
    return old;
  end if;
end $$;

drop trigger if exists bar_likes_count on public.bar_likes;
create trigger bar_likes_count
  after insert or delete on public.bar_likes
  for each row execute function public.bump_bar_like();

create or replace function public.bump_bar_review() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    perform public.bar_stats_touch(new.bar_key, new.bar_name);
    update public.bar_stats
       set rated     = rated     + (case when new.stars is null then 0 else 1 end),
           stars_sum = stars_sum + coalesce(new.stars, 0),
           comments  = comments  + (case when new.text = '' then 0 else 1 end),
           updated_at = now()
     where bar_key = new.bar_key;
    return new;
  else
    update public.bar_stats
       set rated     = greatest(0, rated     - (case when old.stars is null then 0 else 1 end)),
           stars_sum = greatest(0, stars_sum - coalesce(old.stars, 0)),
           comments  = greatest(0, comments  - (case when old.text = '' then 0 else 1 end)),
           updated_at = now()
     where bar_key = old.bar_key;
    return old;
  end if;
end $$;

drop trigger if exists bar_reviews_count on public.bar_reviews;
create trigger bar_reviews_count
  after insert or delete on public.bar_reviews
  for each row execute function public.bump_bar_review();

-- ------------------------------------------------------------
--  5. 접근 권한
-- ------------------------------------------------------------
alter table public.bar_reviews enable row level security;
alter table public.bar_likes   enable row level security;
alter table public.bar_stats   enable row level security;

drop policy if exists bar_reviews_read   on public.bar_reviews;
drop policy if exists bar_reviews_insert on public.bar_reviews;
drop policy if exists bar_reviews_delete on public.bar_reviews;

create policy bar_reviews_read on public.bar_reviews
  for select to authenticated using (true);
create policy bar_reviews_insert on public.bar_reviews
  for insert to authenticated with check (author_id = auth.uid());
-- 내 댓글은 내가, 남의 댓글은 운영자가 지울 수 있어요.
create policy bar_reviews_delete on public.bar_reviews
  for delete to authenticated using (author_id = auth.uid() or public.is_admin());

drop policy if exists bar_likes_read   on public.bar_likes;
drop policy if exists bar_likes_insert on public.bar_likes;
drop policy if exists bar_likes_delete on public.bar_likes;

create policy bar_likes_read on public.bar_likes
  for select to authenticated using (true);
create policy bar_likes_insert on public.bar_likes
  for insert to authenticated with check (user_id = auth.uid());
create policy bar_likes_delete on public.bar_likes
  for delete to authenticated using (user_id = auth.uid());

-- 합계는 읽기만. 쓰기는 위 트리거(security definer)만 합니다.
drop policy if exists bar_stats_read on public.bar_stats;
create policy bar_stats_read on public.bar_stats
  for select to authenticated using (true);

-- ------------------------------------------------------------
--  6. 이미 쌓인 게 있다면 합계를 한 번 맞춰둡니다
--     (다시 실행했을 때 숫자가 어긋나 있으면 여기서 바로잡혀요)
-- ------------------------------------------------------------
insert into public.bar_stats (bar_key, bar_name)
select distinct bar_key, '' from public.bar_likes
on conflict (bar_key) do nothing;

insert into public.bar_stats (bar_key, bar_name)
select bar_key, min(bar_name) from public.bar_reviews group by bar_key
on conflict (bar_key) do nothing;

update public.bar_stats s set
  likes     = coalesce(l.n, 0),
  rated     = coalesce(r.rated, 0),
  stars_sum = coalesce(r.ssum, 0),
  comments  = coalesce(r.cmts, 0)
from
  (select bar_key, count(*)::int n from public.bar_likes group by bar_key) l
  full join
  (select bar_key,
          count(*) filter (where stars is not null)::int rated,
          coalesce(sum(stars), 0)::int                  ssum,
          count(*) filter (where text <> '')::int       cmts
     from public.bar_reviews group by bar_key) r
  on l.bar_key = r.bar_key
where s.bar_key = coalesce(l.bar_key, r.bar_key);

-- ------------------------------------------------------------
--  7. 실시간 (다른 사람이 누른 하트가 바로 보이게)
-- ------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['bar_reviews', 'bar_likes', 'bar_stats'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
