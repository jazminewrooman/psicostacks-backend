# Storage Key Migration

## Problem
Older credentials created before the storage system was implemented have `storage_key` values in the database, but the corresponding report files don't exist in Supabase Storage. This causes a 400 error when trying to download the report.

## Solution

### 1. Run the SQL Migration
Execute the migration to make `storage_key` nullable:

```bash
# Run in Supabase SQL Editor
cat supabase/make-storage-key-nullable.sql
```

Or directly in the SQL Editor:
```sql
ALTER TABLE credentials 
ALTER COLUMN storage_key DROP NOT NULL;
```

### 2. Optional: Clean up old storage_key values
If you want to set `storage_key` to NULL for credentials that don't have files in storage:

```sql
-- This will set storage_key to NULL for credentials where the file doesn't exist
-- You'll need to run this after verifying which credentials are affected
UPDATE credentials 
SET storage_key = NULL 
WHERE storage_key IS NOT NULL 
  AND issued_at < '2025-10-14'  -- Adjust this date based on when storage was implemented
  AND storage_key NOT IN (
    SELECT name FROM storage.objects WHERE bucket_id = 'reports'
  );
```

### 3. Verify the fix
After running the migration:
- Old credentials will continue to show the summary
- The API will show: `"note": "Full report not available (may be an older credential)"`
- No more 400 errors in the logs
- New credentials will continue to work normally with full reports

## Code Changes
The following files were updated to handle nullable `storage_key`:
- `app/api/verify/view/route.ts` - Added check before downloading from storage
