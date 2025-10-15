-- Make storage_key nullable for backward compatibility
-- Older credentials may not have reports stored in Supabase Storage
-- Run this in Supabase SQL Editor

ALTER TABLE credentials 
ALTER COLUMN storage_key DROP NOT NULL;

COMMENT ON COLUMN credentials.storage_key IS 'Storage key for encrypted report blob. May be null for older credentials created before storage was implemented.';
