-- ============================================================
--  물방울 색을 사람에게 붙이기
--
--  지금까지 색은 글·댓글마다 따로 적혀 있었습니다. 쓴 순간의 색이
--  박제되는 구조라, 프로필 색을 바꿔도 예전 글은 옛 색 그대로였어요.
--  같은 사람이 글마다 다른 색으로 보이면 익명 커뮤니티에서 "누가
--  누군지" 알아볼 방법이 사라집니다.
--
--  이제 색의 주인은 profiles 한 곳입니다. 앱이 글을 그릴 때 그 사람의
--  지금 색을 찾아 씁니다. 그래서 색을 바꾸면 예전 글·댓글까지 함께
--  바뀝니다. (글에 적힌 색은 서버가 없을 때를 위한 대비책으로 남겨둡니다)
--
--  여기서 하는 일은 하나 — 색이 바뀌면 접속 중인 사람들 화면에도
--  바로 반영되도록 profiles 를 실시간 목록에 넣습니다.
--
--  Supabase > SQL Editor 에 붙여넣고 Run 하세요. 여러 번 실행해도 안전합니다.
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;
