-- Create view_tokens table for temporary 60-second access tokens
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS view_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  credential_id UUID NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
  employer_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_view_tokens_token ON view_tokens(token);
CREATE INDEX IF NOT EXISTS idx_view_tokens_credential ON view_tokens(credential_id);
CREATE INDEX IF NOT EXISTS idx_view_tokens_expires ON view_tokens(expires_at);

-- Create access_logs table to track who accessed credentials
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
  employer_address TEXT,
  accessed_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT
);

-- Create index for access logs
CREATE INDEX IF NOT EXISTS idx_access_logs_credential ON access_logs(credential_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_accessed_at ON access_logs(accessed_at);

-- Add column to track how many times a credential has been accessed
ALTER TABLE credentials 
ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0;
