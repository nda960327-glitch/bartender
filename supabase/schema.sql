-- ============================================================
--  바텐톡 데이터베이스 스키마
--  Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 실행하세요.
--  두 번 실행해도 안전합니다 (idempotent).
-- ============================================================

-- ------------------------------------------------------------
--  0. 공통
-- ------------------------------------------------------------

-- 앱은 익명 로그인(auth.signInAnonymously)을 사용해요.
-- Supabase 대시보드 > Authentication > Providers 에서
-- "Anonymous sign-ins" 를 반드시 켜주세요.

create extension if not exists "pgcrypto";

-- 앱의 ID는 클라이언트가 만드는 시간 기반 정수(bigint)예요.
-- 서버가 생성하지 않으므로 오프라인에서 만든 글도 그대로 올라갑니다.

-- ------------------------------------------------------------
--  1. 프로필
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  nick         text not null default '익명',
  color        smallint not null default 2,
  biz_name     text,
  biz_type     text,
  banned_until timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is '기기별 익명 계정. 닉네임은 본인에게만 보이고 글은 익명으로 게시됩니다.';

-- ------------------------------------------------------------
--  2. 게시글
-- ------------------------------------------------------------
create table if not exists public.posts (
  id            bigint primary key,
  author_id     uuid not null references auth.users(id) on delete cascade,
  cat           text not null default 'free' check (cat in ('free', 'promo', 'hot')),
  title         text not null check (char_length(title) between 1 and 200),
  body          text not null default '' check (char_length(body) <= 5000),
  color         smallint not null default 2,
  nick          text not null default '익명',
  biz           text,
  contact       text,
  img           text,
  emoji         text,
  views         integer not null default 0,
  edited        boolean not null default false,
  boost_until   timestamptz,
  like_count    integer not null default 0,
  comment_count integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_cat_idx     on public.posts (cat, created_at desc);
create index if not exists posts_author_idx  on public.posts (author_id);

-- ------------------------------------------------------------
--  3. 댓글 (대댓글은 parent_id 로 1단계까지)
-- ------------------------------------------------------------
create table if not exists public.comments (
  id         bigint primary key,
  post_id    bigint not null references public.posts(id) on delete cascade,
  parent_id  bigint references public.comments(id) on delete cascade,
  author_id  uuid not null references auth.users(id) on delete cascade,
  color      smallint not null default 2,
  text       text not null check (char_length(text) between 1 and 1000),
  img        text,
  created_at timestamptz not null default now()
);

create index if not exists comments_post_idx on public.comments (post_id, created_at);

-- ------------------------------------------------------------
--  4. 공감 (사용자당 글 1회)
-- ------------------------------------------------------------
create table if not exists public.likes (
  post_id    bigint not null references public.posts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- ------------------------------------------------------------
--  5. 모임
-- ------------------------------------------------------------
create table if not exists public.meets (
  id          bigint primary key,
  host_id     uuid not null references auth.users(id) on delete cascade,
  region      text not null,
  title       text not null check (char_length(title) between 1 and 100),
  descr       text not null default '',
  place       text not null default '',
  meet_at     timestamptz not null,
  max_people  smallint not null default 4 check (max_people between 2 and 50),
  host_color  smallint not null default 2,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists meets_when_idx on public.meets (meet_at);

create table if not exists public.meet_participants (
  meet_id    bigint not null references public.meets(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (meet_id, user_id)
);

create table if not exists public.meet_comments (
  id         bigint primary key,
  meet_id    bigint not null references public.meets(id) on delete cascade,
  author_id  uuid not null references auth.users(id) on delete cascade,
  color      smallint not null default 2,
  text       text not null check (char_length(text) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists meet_comments_idx on public.meet_comments (meet_id, created_at);

-- ------------------------------------------------------------
--  6. 술도감 (사용자 등록분만. 기본 수록 데이터는 앱에 내장)
-- ------------------------------------------------------------
create table if not exists public.spirits (
  id         bigint primary key,
  author_id  uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('spirit', 'cocktail')),
  name       text not null check (char_length(name) between 2 and 60),
  emoji      text not null default '🥃',
  abv        numeric(4,1) not null default 0 check (abv >= 0 and abv <= 99),
  cat        text,          -- 술: 분류
  base       text,          -- 칵테일: 베이스
  price      text,
  ings       text,
  recipe     text,
  note       text default '',
  img        text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists spirits_kind_idx on public.spirits (kind, created_at desc);

-- 리뷰는 앱 내장 도감 항목에도 달리므로 spirits 를 참조하지 않고
-- 항목 ID를 그대로 보관해요. (내장 항목 id 는 작은 정수)
create table if not exists public.reviews (
  id         bigint primary key,
  spirit_id  bigint not null,
  author_id  uuid not null references auth.users(id) on delete cascade,
  stars      smallint not null check (stars between 1 and 5),
  text       text not null default '' check (char_length(text) <= 1000),
  color      smallint not null default 2,
  img        text,
  created_at timestamptz not null default now(),
  unique (spirit_id, author_id)
);

create index if not exists reviews_spirit_idx on public.reviews (spirit_id, created_at desc);

-- ------------------------------------------------------------
--  7. 신고 (운영자만 조회. 대시보드에서 확인하세요)
-- ------------------------------------------------------------
create table if not exists public.reports (
  id           bigint generated always as identity primary key,
  reporter_id  uuid not null references auth.users(id) on delete cascade,
  target_type  text not null check (target_type in ('post', 'comment', 'spirit', 'meet', 'user')),
  target_id    bigint,
  target_user  uuid,
  title        text,
  reason       text not null,
  status       text not null default '접수' check (status in ('접수', '처리중', '완료', '기각')),
  created_at   timestamptz not null default now()
);

create index if not exists reports_status_idx on public.reports (status, created_at desc);

-- ------------------------------------------------------------
--  8. 차단 (본인만 조회)
-- ------------------------------------------------------------
create table if not exists public.blocks (
  user_id    uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, blocked_id),
  check (user_id <> blocked_id)
);

-- ============================================================
--  트리거: 공감/댓글 수 자동 집계
-- ============================================================
create or replace function public.bump_like_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update public.posts set like_count = greatest(0, like_count - 1) where id = old.post_id;
  end if;
  return null;
end $$;

drop trigger if exists likes_count_trg on public.likes;
create trigger likes_count_trg
  after insert or delete on public.likes
  for each row execute function public.bump_like_count();

create or replace function public.bump_comment_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update public.posts set comment_count = greatest(0, comment_count - 1) where id = old.post_id;
  end if;
  return null;
end $$;

drop trigger if exists comments_count_trg on public.comments;
create trigger comments_count_trg
  after insert or delete on public.comments
  for each row execute function public.bump_comment_count();

-- updated_at 자동 갱신
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists posts_touch_trg on public.posts;
create trigger posts_touch_trg before update on public.posts
  for each row execute function public.touch_updated_at();

drop trigger if exists meets_touch_trg on public.meets;
create trigger meets_touch_trg before update on public.meets
  for each row execute function public.touch_updated_at();

drop trigger if exists spirits_touch_trg on public.spirits;
create trigger spirits_touch_trg before update on public.spirits
  for each row execute function public.touch_updated_at();

-- 가입 시 프로필 자동 생성
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
--  RLS (Row Level Security)
--  기본 원칙: 읽기는 로그인한 사용자 모두, 쓰기는 본인 것만.
-- ============================================================
alter table public.profiles          enable row level security;
alter table public.posts             enable row level security;
alter table public.comments          enable row level security;
alter table public.likes             enable row level security;
alter table public.meets             enable row level security;
alter table public.meet_participants enable row level security;
alter table public.meet_comments     enable row level security;
alter table public.spirits           enable row level security;
alter table public.reviews           enable row level security;
alter table public.reports           enable row level security;
alter table public.blocks            enable row level security;

-- 정책을 다시 만들기 전에 기존 것 제거 (재실행 대비)
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles','posts','comments','likes','meets','meet_participants',
                        'meet_comments','spirits','reviews','reports','blocks')
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- 프로필: 모두 읽기 / 본인만 수정
create policy profiles_read   on public.profiles for select to authenticated using (true);
create policy profiles_insert on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid());

-- 게시글
create policy posts_read   on public.posts for select to authenticated using (true);
create policy posts_insert on public.posts for insert to authenticated with check (author_id = auth.uid());
create policy posts_update on public.posts for update to authenticated using (author_id = auth.uid());
create policy posts_delete on public.posts for delete to authenticated using (author_id = auth.uid());

-- 댓글
create policy comments_read   on public.comments for select to authenticated using (true);
create policy comments_insert on public.comments for insert to authenticated with check (author_id = auth.uid());
create policy comments_delete on public.comments for delete to authenticated using (author_id = auth.uid());

-- 공감
create policy likes_read   on public.likes for select to authenticated using (true);
create policy likes_insert on public.likes for insert to authenticated with check (user_id = auth.uid());
create policy likes_delete on public.likes for delete to authenticated using (user_id = auth.uid());

-- 모임
create policy meets_read   on public.meets for select to authenticated using (true);
create policy meets_insert on public.meets for insert to authenticated with check (host_id = auth.uid());
create policy meets_update on public.meets for update to authenticated using (host_id = auth.uid());
create policy meets_delete on public.meets for delete to authenticated using (host_id = auth.uid());

create policy mp_read   on public.meet_participants for select to authenticated using (true);
create policy mp_insert on public.meet_participants for insert to authenticated with check (user_id = auth.uid());
create policy mp_delete on public.meet_participants for delete to authenticated using (user_id = auth.uid());

create policy mc_read   on public.meet_comments for select to authenticated using (true);
create policy mc_insert on public.meet_comments for insert to authenticated with check (author_id = auth.uid());
create policy mc_delete on public.meet_comments for delete to authenticated using (author_id = auth.uid());

-- 술도감
create policy spirits_read   on public.spirits for select to authenticated using (true);
create policy spirits_insert on public.spirits for insert to authenticated with check (author_id = auth.uid());
create policy spirits_update on public.spirits for update to authenticated using (author_id = auth.uid());
create policy spirits_delete on public.spirits for delete to authenticated using (author_id = auth.uid());

create policy reviews_read   on public.reviews for select to authenticated using (true);
create policy reviews_insert on public.reviews for insert to authenticated with check (author_id = auth.uid());
create policy reviews_update on public.reviews for update to authenticated using (author_id = auth.uid());
create policy reviews_delete on public.reviews for delete to authenticated using (author_id = auth.uid());

-- 신고: 접수만 가능. 열람은 대시보드(service_role)에서.
create policy reports_insert on public.reports for insert to authenticated with check (reporter_id = auth.uid());

-- 차단: 본인 것만 보이고 본인만 조작
create policy blocks_read   on public.blocks for select to authenticated using (user_id = auth.uid());
create policy blocks_insert on public.blocks for insert to authenticated with check (user_id = auth.uid());
create policy blocks_delete on public.blocks for delete to authenticated using (user_id = auth.uid());

-- ============================================================
--  실시간 (Realtime) 발행
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$
declare t text;
begin
  foreach t in array array['posts','comments','likes','meets','meet_participants','meet_comments','spirits','reviews']
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
--  Storage: 사진 버킷
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 3145728,
      allowed_mime_types = array['image/jpeg','image/png','image/webp'];

do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname in ('photos_read','photos_insert','photos_delete')
  loop
    execute format('drop policy %I on storage.objects', r.policyname);
  end loop;
end $$;

-- 누구나 볼 수 있고, 업로드는 본인 폴더(uid/...)에만
create policy photos_read on storage.objects
  for select using (bucket_id = 'photos');

create policy photos_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy photos_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
--  운영용 조회 (대시보드 SQL Editor 에서 사용)
-- ============================================================
-- 미처리 신고 목록:
--   select * from reports where status = '접수' order by created_at desc;
--
-- 신고 많은 작성자:
--   select p.author_id, count(*) from reports r
--   join posts p on p.id = r.target_id
--   where r.target_type = 'post' group by 1 order by 2 desc;
--
-- 사용자 정지 (7일):
--   update profiles set banned_until = now() + interval '7 days' where id = '<uuid>';
