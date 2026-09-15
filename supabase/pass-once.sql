-- "이번 한 번만" 결제 할증 (2.59)
--   카드 자동결제(정기 구독)가 정가이고, 한 번만 내는 결제는 n% 더 받습니다. 기본 20%.
--   원데이·3개월권처럼 원래 1회인 상품에는 붙지 않아요. 가게마다 상품·설정에서 바꿀 수 있어요.
--
-- 실행: Supabase 대시보드 → SQL Editor 에 붙여넣고 Run. (pass.sql 다음에)
alter table public.bar_pass_settings add column if not exists once_markup_pct smallint not null default 20 check (once_markup_pct between 0 and 100);
