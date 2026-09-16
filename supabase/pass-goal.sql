-- 월 구독 매출 목표 (2.62)
--   운영자 화면 맨 위에 "이달 구독 매출 / 목표" 가 늘 보여요. 목표는 가게마다 두고 기본 1,500만 원.
--   이 파일을 안 넣어도 앱은 목표를 기기 안에 저장해 두고 씁니다(운영자 기기마다 따로).
--
-- 실행: Supabase 대시보드 → SQL Editor 에 붙여넣고 Run. (pass.sql 다음에)
alter table public.bar_pass_settings add column if not exists goal_monthly integer not null default 15000000 check (goal_monthly >= 0);
