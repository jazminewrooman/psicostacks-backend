import { supabaseAdmin } from './supabaseAdmin'
import { encryptJson, sha256Canonical } from './crypto'
import { randomId } from './id'

/**
 * Creates a verifiable credential from assessment report data
 * @param walletAddress Candidate's Stacks wallet address (more private than email)
 * @param reportJson Complete report data (will be encrypted and stored)
 * @param summary Summary/result data (band, bullets, etc.)
 * @param schemaId Schema identifier (default: 'psicostacks:v1')
 * @returns Credential metadata (id, sbtId, commitmentHash, expiryAt)
 */
export async function createCredential({
  walletAddress,
  reportJson,
  summary,
  schemaId = 'psicostacks:v1',
}: {
  walletAddress: string
  reportJson: any
  summary: any
  schemaId?: string
}) {
  // Encrypt and store report in Supabase Storage
  const enc = encryptJson(reportJson)
  // Don't include 'reports/' prefix since that's the bucket name
  const storageKey = `${randomId('r_')}.json`
  
  const { error: upErr } = await supabaseAdmin.storage
    .from('reports')
    .upload(storageKey, Buffer.from(JSON.stringify(enc)), {
      contentType: 'application/json',
      upsert: false,
    })
  
  if (upErr) {
    throw new Error(`Storage error: ${upErr.message}`)
  }

  // Generate commitment hash for verification
  const commitmentHash = sha256Canonical(reportJson)

  // Set expiry to 180 days from now
  const expiry = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)

  // Store credential metadata in database (without SBT ID yet - pending blockchain mint)
  const { data, error } = await supabaseAdmin
    .from('credentials')
    .insert({
      wallet_address: walletAddress,
      schema_id: schemaId,
      sbt_id: null, // Will be updated after blockchain mint
      commitment_hash: commitmentHash,
      summary,
      storage_key: storageKey,
      expiry_at: expiry.toISOString(),
      status: 'pending', // pending | minted | revoked
    })
    .select('id, commitment_hash, expiry_at')
    .single()

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  return {
    id: data.id,
    commitmentHash: data.commitment_hash,
    expiryAt: data.expiry_at,
    status: 'pending',
  }
}
