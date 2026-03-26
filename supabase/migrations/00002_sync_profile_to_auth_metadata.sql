-- ============================================================
-- Sync profiles.role and profiles.tenant_id to auth.users raw_app_meta_data
--
-- Fires on INSERT or UPDATE of the profiles table. Whenever a
-- profile row references an auth.users record (same id), this
-- trigger patches raw_app_meta_data with { role, tenant_id,
-- profile_id } so that RLS policies relying on
-- auth.jwt()->'app_metadata' work without manual SQL fixes.
--
-- For kid profiles (who have no auth.users row) the UPDATE
-- silently affects zero rows — no error.
-- ============================================================

CREATE OR REPLACE FUNCTION sync_profile_to_auth_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object(
      'role', NEW.role,
      'tenant_id', NEW.tenant_id::text,
      'profile_id', NEW.id::text
    )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_profile_metadata_on_insert
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_auth_metadata();

CREATE TRIGGER sync_profile_metadata_on_update
  AFTER UPDATE OF role, tenant_id ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_auth_metadata();
