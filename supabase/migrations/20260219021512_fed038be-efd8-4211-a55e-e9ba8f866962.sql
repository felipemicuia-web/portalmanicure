
-- FIX 1: Allow new users to self-register into a tenant
-- Currently only admins can insert into tenant_users (via ALL policy)
CREATE POLICY "Users can self-register into tenant"
  ON public.tenant_users FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- FIX 2: Allow new users to create their own profile
-- The current INSERT policy requires get_user_tenant_id() which fails
-- for brand new users who don't have a tenant_users row yet.
-- We need a permissive policy that allows creating a profile with matching user_id.
DROP POLICY IF EXISTS "Users can create own profile in tenant" ON public.profiles;
CREATE POLICY "Users can create own profile in tenant"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
