-- Fix Storage RLS for reports bucket
-- Run this in Supabase SQL Editor

-- First, check if bucket exists and create if needed
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('reports', 'reports', false, 52428800, ARRAY['application/json'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/json'];

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can upload reports" ON storage.objects;
DROP POLICY IF EXISTS "Service role can read reports" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete reports" ON storage.objects;

-- Create policies for service role
CREATE POLICY "Service role can upload reports"
ON storage.objects FOR INSERT
TO authenticated, service_role
WITH CHECK (bucket_id = 'reports');

CREATE POLICY "Service role can read reports"
ON storage.objects FOR SELECT
TO authenticated, service_role
USING (bucket_id = 'reports');

CREATE POLICY "Service role can delete reports"
ON storage.objects FOR DELETE
TO authenticated, service_role
USING (bucket_id = 'reports');

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
