-- ============================================================
--  댓글 공감 하트
--
--  글에만 있던 하트를 댓글에도 답니다.
--
--  개수를 매번 세지 않고 comments.like_count 에 적어둡니다.
--  댓글 수백 개짜리 글에서 하트를 하나하나 세면 목록이 느려져요.
--  세는 일은 트리거가 대신하므로 앱이 개수를 조작할 수 없습니다.
--
--  Supabase > SQL Editor 에 붙여넣고 Run 하세요. 여러 번 실행해도 안전합니다.
-- ============================================================

alter table public.comments
  add column if not exists like_count integer not null default 0;

create table if not exists public.comment_likes (
  comment_id bigint not null references public.comments(id) on delete cascade,
  user_id    uuid   not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index if not exists comment_likes_user_idx
  on public.comment_likes (user_id);

alter table public.comment_likes enable row level security;

-- 누가 눌렀는지는 모두가 볼 수 있어요. 개수를 보여주려면 필요합니다.
-- 다만 익명 앱이라 화면에는 숫자만 나옵니다.
drop policy if exists "comment likes read" on public.comment_likes;
create policy "comment likes read" on public.comment_likes
  for select using (true);

-- 내 하트만 누르고 뺄 수 있어요. 남의 이름으로 누를 수 없습니다.
drop policy if exists "comment likes insert own" on public.comment_likes;
create policy "comment likes insert own" on public.comment_likes
  for insert with check (auth.uid() = user_id);

drop policy if exists "comment likes delete own" on public.comment_likes;
create policy "comment likes delete own" on public.comment_likes
  for delete using (auth.uid() = user_id);

-- 개수는 서버가 셉니다.
create or replace function public.bump_comment_like_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.comments set like_count = like_count + 1 where id = new.comment_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.comments set like_count = greatest(0, like_count - 1) where id = old.comment_id;
    return old;
  end if;
  return null;
end $$;

drop trigger if exists comment_likes_count on public.comment_likes;
create trigger comment_likes_count
  after insert or delete on public.comment_likes
  for each row execute function public.bump_comment_like_count();

-- 이미 눌린 하트가 있다면 개수를 한 번 맞춰둡니다.
update public.comments c
   set like_count = coalesce(x.n, 0)
  from (select comment_id, count(*)::int as n from public.comment_likes group by comment_id) x
 where c.id = x.comment_id and c.like_count <> x.n;

-- 실시간으로 하트가 오르내리게
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'comment_likes'
  ) then
    alter publication supabase_realtime add table public.comment_likes;
  end if;
end $$;
