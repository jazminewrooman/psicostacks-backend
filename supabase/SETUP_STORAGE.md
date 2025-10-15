# Setup Supabase Storage

## Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Click "Create new bucket"
3. Name: `reports`
4. Settings:
   - **Public bucket**: ❌ NO (keep private)
   - **File size limit**: 50 MB
   - **Allowed MIME types**: application/json

5. Click "Create bucket"

## Verify Setup

After creating the bucket, the system should be able to:
- Upload encrypted reports when credentials are created
- Download reports when employers verify credentials

## RLS Policies (Optional)

For added security, you can set RLS policies:

```sql
-- Allow service role (backend) full access
CREATE POLICY "Service role full access"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'reports');
```

Service role already has full access by default, so this is optional.
