create table if not exists public.student_plans (
 user_id uuid primary key references auth.users(id) on delete cascade,
 saved jsonb not null default '[]'::jsonb check (jsonb_typeof(saved) = 'array'),
 plans jsonb not null default '{}'::jsonb check (jsonb_typeof(plans) = 'object'),
 updated_at timestamptz not null default now()
);
alter table public.student_plans enable row level security;
revoke all on public.student_plans from anon;
grant select, insert, update, delete on public.student_plans to authenticated;
create policy "Students read their own plan" on public.student_plans for select to authenticated using ((select auth.uid()) = user_id);
create policy "Students insert their own plan" on public.student_plans for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Students update their own plan" on public.student_plans for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Students delete their own plan" on public.student_plans for delete to authenticated using ((select auth.uid()) = user_id);
