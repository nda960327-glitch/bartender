-- ============================================================
--  앱을 꺼둬도 오는 알림 (웹 푸시)
--
--  기기마다 브라우저가 발급한 "우편함 주소"를 여기에 보관합니다.
--  메시지를 보낼 때 서버 함수가 상대의 주소로 알림을 쏴요.
--
--  주소는 기기당 하나이고 재설치하면 바뀝니다. 그래서 endpoint 가 열쇠예요.
--  주소가 죽으면(앱 삭제·알림 차단) 발송 서버가 410 을 주고, 그때 지웁니다.
--
--  Supabase > SQL Editor 에 붙여넣고 Run 하세요. 여러 번 실행해도 안전합니다.
-- ============================================================

create table if not exists public.push_subscriptions (
  endpoint    text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  p256dh      text not null,
  auth        text not null,
  ua          text,
  created_at  timestamptz not null default now(),
  last_ok     timestamptz
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- 내 주소만 넣고 빼고 볼 수 있어요.
-- 남의 주소를 읽을 수 있으면 누가 이 앱을 쓰는지 훑을 수 있게 됩니다.
-- 발송 서버는 service_role 로 붙으므로 이 정책을 지나갑니다.
drop policy if exists "push own select" on public.push_subscriptions;
create policy "push own select" on public.push_subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "push own insert" on public.push_subscriptions;
create policy "push own insert" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

drop policy if exists "push own update" on public.push_subscriptions;
create policy "push own update" on public.push_subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "push own delete" on public.push_subscriptions;
create policy "push own delete" on public.push_subscriptions
  for delete using (auth.uid() = user_id);
