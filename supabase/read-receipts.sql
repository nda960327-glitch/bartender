-- ============================================================
--  채팅 읽음 표시
--
--  "언제까지 읽었는지"(conversation_reads)는 지금까지 본인만 볼 수
--  있었습니다. 상대가 내 메시지를 읽었는지 보여주려면, 같은 대화의
--  참여자끼리는 서로의 읽은 시각을 볼 수 있어야 해요.
--
--  메시지 내용이 아니라 "시각" 하나만 열립니다. 제3자는 대화의
--  참여자가 아니므로 여전히 아무것도 못 봅니다.
--
--  Supabase > SQL Editor 에 붙여넣고 Run 하세요. 여러 번 실행해도 안전합니다.
-- ============================================================

drop policy if exists read_own on public.conversation_reads;
create policy read_own on public.conversation_reads
  for select to authenticated using (
    user_id = auth.uid()
    or exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

-- 읽은 시각이 실시간으로 상대 화면에 반영되도록
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversation_reads'
  ) then
    alter publication supabase_realtime add table public.conversation_reads;
  end if;
end $$;
