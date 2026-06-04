-- Fix the recursive RLS policy on agent_profiles that's blocking the dashboard login.
-- The current state returns PG error 42P17 ("infinite recursion detected in policy
-- for relation \"agent_profiles\"") when any authenticated user (or anon) tries to
-- read a row — the dashboard then shows "No agent profile found".

-- 1) Drop every existing policy on the table. We rebuild from scratch.
do $$
declare
  pol record;
begin
  for pol in
    select policyname
      from pg_policies
     where schemaname = 'public'
       and tablename  = 'agent_profiles'
  loop
    execute format('drop policy %I on public.agent_profiles;', pol.policyname);
  end loop;
end $$;

-- 2) Make sure RLS is on (no-op if already enabled).
alter table public.agent_profiles enable row level security;

-- 3) Authenticated users can read their own row.
--    This is what the dashboard login needs: it queries
--      from('agent_profiles').select('role').eq('email', email).single()
--    after sign-in. With auth.uid() = id the user reads their own row, no recursion.
create policy "Authenticated users read own profile"
  on public.agent_profiles
  for select
  to authenticated
  using ( auth.uid() = id );

-- 4) Authenticated users can update their own profile (name, etc.) but NOT
--    change their role to admin. Role changes require service-role from a
--    server-side admin endpoint.
create policy "Authenticated users update own profile"
  on public.agent_profiles
  for update
  to authenticated
  using ( auth.uid() = id )
  with check ( auth.uid() = id and role = (select role from public.agent_profiles where id = auth.uid()) );

-- 5) No INSERT or DELETE for end-users — these stay service-role only.
--    The /dashboard/users admin page already uses an API route with the
--    service-role key, which bypasses RLS, so it's unaffected by these
--    restrictions.

-- Verify (run the line below to inspect; not required for the fix):
-- select policyname, cmd, qual, with_check from pg_policies where tablename = 'agent_profiles';
