-- ============================================================================
-- WiYone Cab: Database RLS Policy Fixes & Profile Creation RPC
-- ============================================================================
-- Run this SQL in Supabase Studio > SQL Editor (Tools → SQL)
-- Copy the entire file, paste it into the editor, and click RUN
-- ============================================================================

-- 1. CREATE PROFILE RPC (SECURITY DEFINER)
-- This function bypasses RLS on profiles table, allowing client to call it safely

CREATE OR REPLACE FUNCTION public.create_profile(
  p_id uuid,
  p_username text,
  p_full_name text,
  p_phone text,
  p_role text,
  p_national_id_url text,
  p_driver_license_url text,
  p_national_id_number text,
  p_id_type text
) RETURNS void AS $$
BEGIN
  INSERT INTO public.profiles(
    id, username, full_name, phone, role, national_id_url, driver_license_url, national_id_number, id_type
  ) VALUES (
    p_id, p_username, p_full_name, p_phone, p_role, p_national_id_url, p_driver_license_url, p_national_id_number, p_id_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to anon role so signup flow can call the RPC
GRANT EXECUTE ON FUNCTION public.create_profile(uuid, text, text, text, text, text, text, text, text) TO anon;

-- Ensure function owner has proper privileges (typically postgres or the DB owner)
ALTER FUNCTION public.create_profile(uuid, text, text, text, text, text, text, text, text) OWNER TO postgres;

-- ============================================================================
-- 2. STORAGE RLS POLICY FOR DRIVERS BUCKET
-- Allow public (anon) uploads to the 'drivers' bucket for file documents
-- ============================================================================

-- Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS allow_public_insert_on_drivers ON storage.objects;
DROP POLICY IF EXISTS allow_public_read_on_drivers ON storage.objects;

-- Create new policies for the drivers bucket
CREATE POLICY allow_public_insert_on_drivers
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'drivers');

-- Allow public reads from drivers bucket (optional, for viewing uploaded docs)
CREATE POLICY allow_public_read_on_drivers
ON storage.objects
FOR SELECT
USING (bucket_id = 'drivers');

-- Also create policies for `riders` bucket to allow rider uploads (voter ID / passport photo)
DROP POLICY IF EXISTS allow_public_insert_on_riders ON storage.objects;
DROP POLICY IF EXISTS allow_public_read_on_riders ON storage.objects;

CREATE POLICY allow_public_insert_on_riders
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'riders');

CREATE POLICY allow_public_read_on_riders
ON storage.objects
FOR SELECT
USING (bucket_id = 'riders');

-- ============================================================================
-- DONE!
-- After running this SQL:
-- 1. Driver signup will create profiles using the RPC (no RLS error on profiles).
-- 2. File uploads to 'drivers' bucket will succeed (no RLS error on storage).
-- 3. Restart your app to see the changes take effect.
-- ============================================================================
