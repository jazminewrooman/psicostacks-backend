-- Create the 'reports' storage bucket for encrypted credential reports
-- This bucket stores encrypted JSON files containing psychometric assessment data

-- Insert the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the reports bucket
-- Only service role can upload (backend only)
CREATE POLICY "Service role can upload reports"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'reports');

-- Only service role can read reports
CREATE POLICY "Service role can read reports"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'reports');

-- Only service role can delete reports (for cleanup/expiry)
CREATE POLICY "Service role can delete reports"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'reports');
