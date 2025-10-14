-- Add blockchain-related fields to credentials table
-- Run this in Supabase SQL Editor

-- FIRST: Make sbt_id nullable (it will be null until blockchain mint)
ALTER TABLE credentials 
ALTER COLUMN sbt_id DROP NOT NULL;

-- Add status column if it doesn't exist
ALTER TABLE credentials 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'minted', 'revoked'));

-- Add blockchain transaction ID
ALTER TABLE credentials 
ADD COLUMN IF NOT EXISTS blockchain_tx_id TEXT;

-- Add blockchain credential ID (the ID returned by the smart contract)
ALTER TABLE credentials 
ADD COLUMN IF NOT EXISTS blockchain_id INTEGER;

-- Add minted timestamp
ALTER TABLE credentials 
ADD COLUMN IF NOT EXISTS minted_at TIMESTAMPTZ;

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_credentials_status ON credentials(status);

-- Create index for blockchain lookups
CREATE INDEX IF NOT EXISTS idx_credentials_blockchain_id ON credentials(blockchain_id);

-- Comment on columns
COMMENT ON COLUMN credentials.status IS 'Status of the credential: pending (before mint), minted (after blockchain), revoked';
COMMENT ON COLUMN credentials.blockchain_tx_id IS 'Stacks blockchain transaction ID from the mint operation';
COMMENT ON COLUMN credentials.blockchain_id IS 'On-chain credential ID returned by the smart contract';
COMMENT ON COLUMN credentials.minted_at IS 'Timestamp when the credential was minted on blockchain';
