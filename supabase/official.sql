-- ============================================================
--  바텐톡 — 공식 계정 & 콘텐츠 예약 발행
--
--  Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 실행하세요.
--  여러 번 실행해도 안전합니다 (idempotent).
--
--  ⚠️ schema.sql 과 admin.sql 을 먼저 실행한 프로젝트에 추가하는 파일입니다.
--
--  이 파일이 하는 일
--   1. 운영 계정에 "공식" 표시를 달 수 있게 합니다.
--   2. 공식 표시는 서버가 찍습니다. 앱을 조작해도 위조할 수 없습니다.
--   3. 미리 써둔 글을 검토 → 승인 → 예약 시각에 자동 발행하는 큐를 만듭니다.
--   4. 발행은 반드시 공식 계정으로만 나갑니다. 일반 계정으로는 발행 자체가 막힙니다.
--
--  설계 원칙
--   · 자동 발행되는 글은 전부 사람이 미리 읽고 승인한 것만 나갑니다 (draft → approved).
--   · 실제 사용자의 글에 자동으로 공감을 누르는 기능은 의도적으로 넣지 않았습니다.
--   · 켜기 전까지는 아무것도 발행되지 않습니다 (content_settings.enabled 기본값 false).
-- ============================================================

-- ------------------------------------------------------------
--  0. 선행 조건 확인
-- ------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.is_admin()') is null then
    raise exception '먼저 supabase/admin.sql 을 실행해 주세요. (is_admin 함수가 없습니다)';
  end if;
  if to_regclass('public.posts') is null then
    raise exception '먼저 supabase/schema.sql 을 실행해 주세요. (posts 테이블이 없습니다)';
  end if;
end $$;


-- ------------------------------------------------------------
--  1. 프로필: 공식 계정 표시
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists is_official    boolean not null default false,
  add column if not exists official_label text;

comment on column public.profiles.is_official is
  '공식(운영) 계정 여부. 대시보드에서만 켤 수 있고 앱에서는 절대 바꿀 수 없습니다.';
comment on column public.profiles.official_label is
  '글 옆에 붙는 뱃지 문구. 비우면 "공식" 으로 나갑니다. 예: 운영팀, 위스키 에디터';


-- 앱에서 스스로 공식 계정이 되는 것을 막습니다.
--
-- RLS 만으로는 부족해요. profiles_update 정책이 "본인 행"을 허용하기 때문에
-- 정책만 믿으면 사용자가 자기 행의 is_official 을 true 로 바꿀 수 있습니다.
-- 그래서 트리거로 값 자체를 되돌립니다. 앱 코드를 어떻게 조작해도 통과 못 합니다.
--
-- 판정 기준은 "지금 어떤 DB 롤로 들어왔는가" 입니다.
--   authenticated → 앱에서 온 요청           (공식 플래그 변경 불가)
--   service_role  → 서버 함수 / 운영 스크립트 (변경 가능)
--   postgres      → 대시보드 SQL Editor       (변경 가능)
--
-- ⚠️ 이 함수는 일부러 security definer 가 아닙니다.
--    security definer 로 만들면 current_user 가 함수 소유자(postgres)로 바뀌어서
--    "누가 불렀는지" 판별이 무조건 통과해 버립니다. 반드시 invoker 로 두세요.
create or replace function public.guard_profile_flags() returns trigger
language plpgsql set search_path = public as $$
declare
  privileged boolean := current_user in ('service_role', 'postgres', 'supabase_admin');
begin
  if privileged then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.is_official    := false;
    new.official_label := null;
    new.banned_until   := null;
    return new;
  end if;

  -- 앱에서 들어온 수정: 공식 표시는 무조건 원래 값 유지
  new.is_official    := old.is_official;
  new.official_label := old.official_label;

  -- 이용 정지도 마찬가지. 관리자만 건드릴 수 있어야 합니다.
  -- (기존 profiles_update 정책은 WITH CHECK 가 없어서 본인이 자기 정지를
  --  풀어버릴 수 있었어요. 여기서 같이 막습니다.)
  if not public.is_admin() then
    new.banned_until := old.banned_until;
  end if;

  return new;
end $$;

drop trigger if exists profiles_guard_trg on public.profiles;
create trigger profiles_guard_trg
  before insert or update on public.profiles
  for each row execute function public.guard_profile_flags();


-- ------------------------------------------------------------
--  2. 글·댓글에 공식 표시 찍기
-- ------------------------------------------------------------
-- 앱은 글 목록을 가져올 때 profiles 를 조인하지 않아요 (nick/color 를 글에 복사해 둡니다).
-- 그래서 공식 여부도 글에 함께 찍어둡니다. 대신 이 값은 클라이언트가 보낸 걸
-- 쓰지 않고 트리거가 profiles 를 보고 매번 새로 계산합니다. → 위조 불가.
alter table public.posts
  add column if not exists official       boolean not null default false,
  add column if not exists official_label text;

alter table public.comments
  add column if not exists official       boolean not null default false,
  add column if not exists official_label text,
  add column if not exists official_nick  text;

comment on column public.comments.official_nick is
  '공식 계정 댓글에만 채워지는 표시용 이름. 일반 사용자 댓글은 항상 익명으로 남습니다.';

create or replace function public.stamp_official() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  prof record;
begin
  select p.is_official, p.official_label, p.nick
    into prof
    from public.profiles p
   where p.id = new.author_id;

  if coalesce(prof.is_official, false) then
    new.official       := true;
    new.official_label := coalesce(nullif(btrim(prof.official_label), ''), '공식');
    if tg_table_name = 'comments' then
      new.official_nick := coalesce(nullif(btrim(prof.nick), ''), '운영');
    end if;
  else
    new.official       := false;
    new.official_label := null;
    if tg_table_name = 'comments' then
      new.official_nick := null;
    end if;
  end if;

  return new;
end $$;

drop trigger if exists posts_official_trg on public.posts;
create trigger posts_official_trg
  before insert or update on public.posts
  for each row execute function public.stamp_official();

drop trigger if exists comments_official_trg on public.comments;
create trigger comments_official_trg
  before insert or update on public.comments
  for each row execute function public.stamp_official();


-- ------------------------------------------------------------
--  3. 발행 설정 (한 줄짜리 표. 여기가 전체 스위치입니다)
-- ------------------------------------------------------------
create table if not exists public.content_settings (
  id          smallint primary key default 1 check (id = 1),
  enabled     boolean  not null default false,          -- ⛔ 기본은 꺼짐
  tz          text     not null default 'Asia/Seoul',
  daily_cap   smallint not null default 4  check (daily_cap  between 0 and 50),
  quiet_from  smallint not null default 2  check (quiet_from between 0 and 23),
  quiet_to    smallint not null default 9  check (quiet_to   between 0 and 23),
  min_gap_min smallint not null default 90 check (min_gap_min between 0 and 1440),
  updated_at  timestamptz not null default now()
);

comment on table public.content_settings is
  '자동 발행 스위치. enabled 를 false 로 두면 예약된 글이 있어도 나가지 않습니다.';
comment on column public.content_settings.quiet_from is
  '조용한 시간 시작 (현지 시각). quiet_from ~ quiet_to 사이에는 발행하지 않습니다. 자정을 넘겨도 됩니다.';
comment on column public.content_settings.min_gap_min is
  '직전 발행으로부터 최소 몇 분은 비워둘지. 글이 우르르 몰려 올라가는 걸 막아요.';

insert into public.content_settings (id) values (1) on conflict (id) do nothing;


-- ------------------------------------------------------------
--  4. 콘텐츠 큐
-- ------------------------------------------------------------
create table if not exists public.content_queue (
  id                bigint generated always as identity primary key,
  kind              text not null check (kind in ('post', 'comment')),
  status            text not null default 'draft'
                    check (status in ('draft', 'approved', 'published', 'rejected', 'failed')),

  -- 어느 공식 계정으로 나갈지
  author_id         uuid not null references auth.users(id) on delete cascade,

  -- kind = 'post'
  cat               text check (cat in ('free', 'promo', 'hot')),
  title             text,
  body              text,
  emoji             text,
  img               text,

  -- kind = 'comment'
  target_post_id    bigint references public.posts(id)    on delete cascade,
  parent_comment_id bigint references public.comments(id) on delete cascade,
  text              text,

  -- 예약
  publish_after     timestamptz not null default now(),

  -- 운영
  source            text,          -- 어디서 만든 초안인지. 예: whisky:203, cocktail:102, manual
  dedupe_key        text unique,   -- 같은 소재로 두 번 나가는 걸 막습니다
  note              text,          -- 검토 메모
  attempts          smallint not null default 0,
  last_error        text,
  published_id      bigint,        -- 실제로 만들어진 posts/comments 의 id
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint content_queue_post_shape check (
    kind <> 'post' or (
      title is not null
      and char_length(title) between 1 and 200
      and char_length(coalesce(body, '')) <= 5000
    )
  ),
  constraint content_queue_comment_shape check (
    kind <> 'comment' or (
      target_post_id is not null
      and text is not null
      and char_length(text) between 1 and 1000
    )
  )
);

comment on table public.content_queue is
  '예약 발행 대기열. draft(초안) → approved(사람이 검토·승인) → published(발행됨).';

create index if not exists content_queue_due_idx
  on public.content_queue (publish_after) where status = 'approved';
create index if not exists content_queue_status_idx
  on public.content_queue (status, created_at desc);
create index if not exists content_queue_published_idx
  on public.content_queue (published_at desc) where status = 'published';

drop trigger if exists content_queue_touch_trg on public.content_queue;
create trigger content_queue_touch_trg before update on public.content_queue
  for each row execute function public.touch_updated_at();


-- ------------------------------------------------------------
--  5. 발행 함수
-- ------------------------------------------------------------
-- 크론이 주기적으로 이 함수를 부릅니다. 실제로 발행할지는 함수가 판단해요.
--
--   · enabled 가 꺼져 있으면       → 아무것도 안 함
--   · 조용한 시간이면              → 아무것도 안 함
--   · 직전 발행 후 min_gap 이내면  → 아무것도 안 함
--   · 오늘 daily_cap 을 채웠으면   → 아무것도 안 함
--
-- FOR UPDATE SKIP LOCKED 를 쓰기 때문에 크론이 겹쳐서 두 번 돌아도
-- 같은 글이 두 번 올라가지 않습니다.
--
-- 한 건이 실패해도 나머지는 계속 진행하고, 실패한 건은 10분 뒤 재시도합니다.
-- 3번 실패하면 status = 'failed' 로 빠지고 더는 시도하지 않아요.
-- 큐 한 건을 실제로 발행합니다. 크론과 운영자 화면이 이 함수를 함께 씁니다.
-- 시각·상한 같은 판단은 하지 않아요. "지금 이걸 내보내라"만 합니다.
create or replace function public.publish_queue_item(p_id bigint)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  q      public.content_queue%rowtype;
  prof   public.profiles%rowtype;
  new_id bigint;
  tries  int := 0;
begin
  select * into q from public.content_queue where id = p_id for update;
  if not found then
    raise exception '큐 항목을 찾을 수 없습니다 (%)', p_id;
  end if;
  if q.status = 'published' then
    raise exception '이미 발행된 항목입니다 (%)', p_id;
  end if;

  select * into prof from public.profiles where id = q.author_id;
  if not found then
    raise exception '작성자 프로필이 없습니다 (%)', q.author_id;
  end if;

  -- 이 파이프라인은 공식 계정으로만 발행할 수 있습니다.
  -- 실수로 일반 사용자 계정이 큐에 들어가도 여기서 막힙니다.
  if not prof.is_official then
    raise exception '공식 계정이 아닙니다 (%). profiles.is_official 을 먼저 켜주세요.', q.author_id;
  end if;

  -- 앱과 같은 방식의 시간 기반 ID: Date.now() * 1000 + 난수
  loop
    tries  := tries + 1;
    new_id := (floor(extract(epoch from clock_timestamp()) * 1000)::bigint) * 1000
              + floor(random() * 1000)::bigint;
    begin
      if q.kind = 'post' then
        insert into public.posts (id, author_id, cat, title, body, color, nick, emoji, img)
        values (new_id, q.author_id, coalesce(q.cat, 'free'), q.title, coalesce(q.body, ''),
                prof.color, coalesce(nullif(btrim(prof.nick), ''), '운영'), q.emoji, q.img);
      else
        insert into public.comments (id, post_id, parent_id, author_id, color, text)
        values (new_id, q.target_post_id, q.parent_comment_id, q.author_id, prof.color, q.text);
      end if;
      exit;
    exception when unique_violation then
      if tries >= 5 then
        raise;
      end if;
    end;
  end loop;

  update public.content_queue
     set status       = 'published',
         published_id = new_id,
         published_at = now(),
         attempts     = attempts + 1,
         last_error   = null
   where id = q.id;

  return new_id;
end $$;

revoke all on function public.publish_queue_item(bigint) from public;
revoke all on function public.publish_queue_item(bigint) from anon;
revoke all on function public.publish_queue_item(bigint) from authenticated;
grant execute on function public.publish_queue_item(bigint) to service_role;


create or replace function public.publish_due_content(p_limit int default 1)
returns table (
  queue_id     bigint,
  kind         text,
  published_id bigint,
  result       text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg       public.content_settings%rowtype;
  q         public.content_queue%rowtype;
  cur_hour  int;
  quiet     boolean := false;
  last_at   timestamptz;
  today_cnt int;
  room      int;
  new_id    bigint;
begin
  select * into cfg from public.content_settings where id = 1;
  if not found or not cfg.enabled then
    return;
  end if;

  cur_hour := extract(hour from (now() at time zone cfg.tz))::int;

  if cfg.quiet_from <> cfg.quiet_to then
    if cfg.quiet_from < cfg.quiet_to then
      quiet := cur_hour >= cfg.quiet_from and cur_hour < cfg.quiet_to;
    else
      -- 자정을 넘어가는 구간 (예: 23시 ~ 8시)
      quiet := cur_hour >= cfg.quiet_from or cur_hour < cfg.quiet_to;
    end if;
  end if;
  if quiet then
    return;
  end if;

  select max(cq.published_at) into last_at
    from public.content_queue cq
   where cq.status = 'published';

  if last_at is not null
     and now() - last_at < make_interval(mins => cfg.min_gap_min::int) then
    return;
  end if;

  select count(*) into today_cnt
    from public.content_queue cq
   where cq.status = 'published'
     and (cq.published_at at time zone cfg.tz)::date = (now() at time zone cfg.tz)::date;

  -- min_gap 은 호출 사이의 간격입니다. p_limit 을 1 로 두는 걸 권장해요.
  room := least(greatest(p_limit, 0), greatest(cfg.daily_cap::int - today_cnt, 0));
  if room <= 0 then
    return;
  end if;

  for q in
    select * from public.content_queue cq
     where cq.status = 'approved'
       and cq.publish_after <= now()
     order by cq.publish_after
     limit room
     for update skip locked
  loop
    begin
      new_id := public.publish_queue_item(q.id);

      queue_id     := q.id;
      kind         := q.kind;
      published_id := new_id;
      result       := 'published';
      return next;

    exception when others then
      update public.content_queue
         set attempts      = attempts + 1,
             last_error    = left(sqlerrm, 500),
             status        = case when attempts + 1 >= 3 then 'failed' else 'approved' end,
             publish_after = case when attempts + 1 >= 3
                                  then publish_after
                                  else now() + interval '10 minutes' end
       where id = q.id;

      queue_id     := q.id;
      kind         := q.kind;
      published_id := null;
      result       := 'error: ' || left(sqlerrm, 200);
      return next;
    end;
  end loop;

  return;
end $$;

-- 이 함수는 크론(서버)만 부를 수 있습니다. 앱에서는 호출 자체가 막혀요.
revoke all on function public.publish_due_content(int) from public;
revoke all on function public.publish_due_content(int) from anon;
revoke all on function public.publish_due_content(int) from authenticated;
grant execute on function public.publish_due_content(int) to service_role;


-- ------------------------------------------------------------
--  5-2. 운영자가 앱에서 직접 조작하는 기능
-- ------------------------------------------------------------
-- 관리자 화면(앱)에서 봇을 다루기 위한 함수들입니다.
-- 전부 is_admin() 을 먼저 확인하고, 공식 계정으로만 동작합니다.

-- 예약을 기다리지 않고 지금 바로 내보냅니다. (조용한 시간·상한 무시)
create or replace function public.admin_publish_now(p_queue_id bigint)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id  bigint;
  q_kind  text;
  q_title text;
begin
  if not public.is_admin() then
    raise exception '관리자만 사용할 수 있습니다.';
  end if;

  select kind, coalesce(title, left(text, 60))
    into q_kind, q_title
    from public.content_queue where id = p_queue_id;

  new_id := public.publish_queue_item(p_queue_id);

  insert into public.admin_actions (admin_id, action, target_type, target_id, title, reason)
  values (auth.uid(), '봇 즉시 발행', q_kind, new_id, coalesce(q_title, ''), 'queue #' || p_queue_id);

  return new_id;
end $$;


-- 운영자가 봇 계정으로 글을 씁니다.
-- p_at 이 비었거나 지금보다 과거면 즉시 발행, 미래면 그 시각에 예약합니다.
create or replace function public.admin_post_as(
  p_author uuid,
  p_title  text,
  p_body   text default '',
  p_cat    text default 'free',
  p_emoji  text default null,
  p_at     timestamptz default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  prof   public.profiles%rowtype;
  qid    bigint;
  new_id bigint;
begin
  if not public.is_admin() then
    raise exception '관리자만 사용할 수 있습니다.';
  end if;

  select * into prof from public.profiles where id = p_author;
  if not found or not prof.is_official then
    raise exception '공식 계정이 아닙니다.';
  end if;
  if p_title is null or btrim(p_title) = '' then
    raise exception '제목을 입력해 주세요.';
  end if;

  insert into public.content_queue
    (kind, status, author_id, cat, title, body, emoji, publish_after, source, note)
  values
    ('post', 'approved', p_author, coalesce(p_cat, 'free'), btrim(p_title),
     coalesce(p_body, ''), p_emoji, coalesce(p_at, now()), 'manual', '운영자 작성')
  returning id into qid;

  -- 미래 시각이면 큐에 두고 크론이 가져가게 합니다.
  if p_at is not null and p_at > now() then
    return jsonb_build_object('mode', 'scheduled', 'queue_id', qid, 'at', p_at);
  end if;

  new_id := public.publish_queue_item(qid);

  insert into public.admin_actions (admin_id, action, target_type, target_id, title, reason)
  values (auth.uid(), '봇 글 작성', 'post', new_id, btrim(p_title), prof.nick);

  return jsonb_build_object('mode', 'published', 'queue_id', qid, 'post_id', new_id);
end $$;


-- 운영자가 봇 계정으로 댓글을 답니다. 이건 항상 즉시 등록돼요.
-- (실제 사용자 글에 빠르게 답하는 게 이 기능의 목적입니다)
create or replace function public.admin_comment_as(
  p_author  uuid,
  p_post_id bigint,
  p_text    text,
  p_parent  bigint default null
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  prof   public.profiles%rowtype;
  qid    bigint;
  new_id bigint;
begin
  if not public.is_admin() then
    raise exception '관리자만 사용할 수 있습니다.';
  end if;

  select * into prof from public.profiles where id = p_author;
  if not found or not prof.is_official then
    raise exception '공식 계정이 아닙니다.';
  end if;
  if p_text is null or btrim(p_text) = '' then
    raise exception '내용을 입력해 주세요.';
  end if;
  if not exists (select 1 from public.posts where id = p_post_id) then
    raise exception '글을 찾을 수 없습니다.';
  end if;

  insert into public.content_queue
    (kind, status, author_id, target_post_id, parent_comment_id, text, publish_after, source, note)
  values
    ('comment', 'approved', p_author, p_post_id, p_parent, btrim(p_text), now(), 'manual', '운영자 댓글')
  returning id into qid;

  new_id := public.publish_queue_item(qid);

  insert into public.admin_actions (admin_id, action, target_type, target_id, title, reason)
  values (auth.uid(), '봇 댓글 작성', 'comment', new_id, left(btrim(p_text), 60), prof.nick);

  return new_id;
end $$;


revoke all on function public.admin_publish_now(bigint) from public;
revoke all on function public.admin_post_as(uuid, text, text, text, text, timestamptz) from public;
revoke all on function public.admin_comment_as(uuid, bigint, text, bigint) from public;

grant execute on function public.admin_publish_now(bigint) to authenticated;
grant execute on function public.admin_post_as(uuid, text, text, text, text, timestamptz) to authenticated;
grant execute on function public.admin_comment_as(uuid, bigint, text, bigint) to authenticated;


-- 운영자가 앱에서 큐를 고칠 때의 안전장치.
-- 승인·취소·시각 변경·문구 수정은 되지만, "발행됨" 으로 직접 바꿔치기 하거나
-- 작성 계정을 갈아끼우는 건 막습니다.
create or replace function public.guard_queue_edit() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  if old.status = 'published' then
    raise exception '이미 발행된 항목은 수정할 수 없습니다.';
  end if;
  if new.status not in ('draft', 'approved', 'rejected') then
    raise exception '앱에서는 초안·예약·버림 상태만 지정할 수 있습니다.';
  end if;

  new.author_id    := old.author_id;
  new.kind         := old.kind;
  new.published_id := old.published_id;
  new.published_at := old.published_at;
  new.dedupe_key   := old.dedupe_key;
  return new;
end $$;

drop trigger if exists content_queue_guard_trg on public.content_queue;
create trigger content_queue_guard_trg
  before update on public.content_queue
  for each row execute function public.guard_queue_edit();


-- ------------------------------------------------------------
--  6. RLS
-- ------------------------------------------------------------
alter table public.content_queue    enable row level security;
alter table public.content_settings enable row level security;

do $$
declare r record;
begin
  for r in
    select tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('content_queue', 'content_settings')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- 큐는 관리자만 다룰 수 있습니다.
-- insert 정책은 일부러 없습니다 — 큐에 새로 넣는 건 service_role(도구·서버)만.
-- update 는 허용하되 위 guard_queue_edit 트리거가 위험한 변경을 되돌립니다.
create policy cq_read on public.content_queue
  for select to authenticated using (public.is_admin());
create policy cq_update on public.content_queue
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- 설정은 관리자가 앱에서도 끌 수 있게 열어둡니다 (비상 정지용).
create policy cs_read on public.content_settings
  for select to authenticated using (public.is_admin());
create policy cs_update on public.content_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());


-- ------------------------------------------------------------
--  7. 기존 데이터 보정
-- ------------------------------------------------------------
-- 이미 올라가 있는 글 중 공식 계정이 쓴 것에 뱃지를 소급 적용합니다.
update public.posts p
   set official = true
  from public.profiles pr
 where pr.id = p.author_id
   and pr.is_official
   and p.official is distinct from true;

update public.comments c
   set official = true
  from public.profiles pr
 where pr.id = c.author_id
   and pr.is_official
   and c.official is distinct from true;


-- 새로 만든 함수·컬럼을 REST API 가 바로 알아보게 합니다.
notify pgrst, 'reload schema';


-- ============================================================
--  운영 쿼리 모음 (SQL Editor 에서 복사해 쓰세요)
-- ============================================================
--
-- ▸ 익명 계정 목록 보기 (어느 계정을 공식으로 쓸지 고를 때)
--     select p.id, p.nick, p.created_at,
--            (select count(*) from posts where author_id = p.id) as posts
--       from profiles p
--      order by p.created_at
--      limit 30;
--
-- ▸ 공식 계정으로 지정하기
--     update profiles
--        set is_official = true, nick = '바텐톡 위스키', official_label = '공식'
--      where id = '여기에-uuid';
--
-- ▸ 공식 계정 목록
--     select id, nick, official_label from profiles where is_official order by nick;
--
-- ▸ 공식 해제 (뱃지도 같이 내려갑니다 — 아래 두 줄을 함께 실행)
--     update profiles set is_official = false where id = '여기에-uuid';
--     update posts set official = false where author_id = '여기에-uuid';
--
-- ▸ 자동 발행 켜기 / 끄기
--     update content_settings set enabled = true  where id = 1;
--     update content_settings set enabled = false where id = 1;   -- 비상 정지
--
-- ▸ 발행 속도 조절 (하루 3건, 새벽 2~10시 쉬고, 최소 2시간 간격)
--     update content_settings
--        set daily_cap = 3, quiet_from = 2, quiet_to = 10, min_gap_min = 120
--      where id = 1;
--
-- ▸ 큐 상태 요약
--     select status, count(*) from content_queue group by 1 order by 1;
--
-- ▸ 다음에 나갈 글
--     select id, publish_after, title from content_queue
--      where status = 'approved' order by publish_after limit 10;
--
-- ▸ 실패한 건 확인
--     select id, attempts, last_error, title from content_queue where status = 'failed';
--
-- ▸ 실패한 건 되살리기
--     update content_queue
--        set status = 'approved', attempts = 0, last_error = null, publish_after = now()
--      where id = 123;
--
-- ▸ 지금 당장 한 건 발행 (테스트)
--     select * from publish_due_content(1);
--
-- ▸ 발행된 글 되돌리기 (글 삭제 + 큐 상태 복구)
--     delete from posts where id = (select published_id from content_queue where id = 123);
--     update content_queue set status = 'rejected' where id = 123;
