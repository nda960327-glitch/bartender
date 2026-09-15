-- 커뮤니티 게시판 확장 (2.45)
--   자유(free) / 사장님(owner) / 바텐더(staff) / 홍보(promo)
--   누구나 어느 게시판에나 글을 쓸 수 있어요. 사장님이 바텐더 게시판에 써도 됩니다.
--
-- 실행: Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.
-- 이걸 안 넣으면 사장님·바텐더 게시판 글이 서버에 저장되지 않습니다
-- (posts.cat 의 check 제약이 free/promo/hot 만 허용해요).

alter table public.posts drop constraint if exists posts_cat_check;
alter table public.posts
  add constraint posts_cat_check check (cat in ('free', 'owner', 'staff', 'promo', 'hot'));

-- 공식 콘텐츠 큐도 같은 게시판을 쓸 수 있게 (official.sql 을 넣은 서버만)
do $$
begin
  if to_regclass('public.content_queue') is not null then
    alter table public.content_queue drop constraint if exists content_queue_cat_check;
    alter table public.content_queue
      add constraint content_queue_cat_check check (cat in ('free', 'owner', 'staff', 'promo', 'hot'));
  end if;
end $$;

-- ------------------------------------------------------------
-- (선택) 커뮤니티 글 전부 지우기
--   앱의 예시 글은 2.45 부터 자동으로 정리되지만, 진짜 사용자가 쓴 글까지
--   싹 비우고 새로 시작하려면 아래 줄의 주석을 풀고 실행하세요. 되돌릴 수 없어요.
-- delete from public.posts;
