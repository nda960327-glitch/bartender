-- ============================================================
--  입장권 — 가게별 후카 가격 (2026-10)
--  bar_pass_settings 에 두 칸을 더합니다. 비어 있으면 앱·서버가 기본값을 써요.
--    hookah_price      후카 1대 값 (인원과 무관)             기본 28,000
--    hookah_set_price  1인 + 후카 1대 세트 값 (비우면 할인 없음) 기본 57,000
--  여러 번 돌려도 안전합니다.
-- ============================================================
alter table public.bar_pass_settings add column if not exists hookah_price int
  check (hookah_price is null or (hookah_price >= 0 and hookah_price <= 1000000));
alter table public.bar_pass_settings add column if not exists hookah_set_price int
  check (hookah_set_price is null or (hookah_set_price >= 0 and hookah_set_price <= 2000000));
