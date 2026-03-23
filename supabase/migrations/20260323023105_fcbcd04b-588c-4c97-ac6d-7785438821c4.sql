
-- Fix storage policies: allow tenant admins to upload to avatars bucket
-- The old "Admins can upload/update/delete professional avatars" policies use the legacy user_roles table
-- We need policies that work with tenant_users via is_tenant_admin()

-- Drop legacy policies that use has_role (legacy user_roles table)
DROP POLICY IF EXISTS "Admins can upload professional avatars" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update professional avatars" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete professional avatars" ON storage.objects;

-- Create new policies using is_tenant_admin via tenant_users
-- For INSERT: allow any authenticated user who is a tenant admin in ANY tenant, or superadmin
CREATE POLICY "Tenant admins can upload to avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (
      EXISTS (
        SELECT 1 FROM public.tenant_users
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'owner')
          AND status = 'active'
      )
      OR public.is_superadmin(auth.uid())
    )
  );

-- For UPDATE
CREATE POLICY "Tenant admins can update in avatars"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      EXISTS (
        SELECT 1 FROM public.tenant_users
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'owner')
          AND status = 'active'
      )
      OR public.is_superadmin(auth.uid())
    )
  );

-- For DELETE
CREATE POLICY "Tenant admins can delete from avatars"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      EXISTS (
        SELECT 1 FROM public.tenant_users
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'owner')
          AND status = 'active'
      )
      OR public.is_superadmin(auth.uid())
    )
  );
