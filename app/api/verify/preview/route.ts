import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

/**
 * POST /api/verify/preview
 * Returns basic credential info (blockchain_id, band) without revealing full details
 * Employer needs this to call the smart contract for payment
 */
export async function POST(req: Request) {
  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400, headers: corsHeaders })

  // Lookup verify token
  const { data: vtok, error: e1 } = await supabaseAdmin
    .from('verify_tokens')
    .select('token, used, expires_at, credential_id')
    .eq('token', token)
    .single()
  
  if (e1 || !vtok) return NextResponse.json({ error: 'invalid token' }, { status: 400, headers: corsHeaders })
  if (vtok.used) return NextResponse.json({ error: 'token already used' }, { status: 400, headers: corsHeaders })
  if (new Date(vtok.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'token expired' }, { status: 400, headers: corsHeaders })
  }

  // Fetch credential
  const { data: cred, error: e2 } = await supabaseAdmin
    .from('credentials')
    .select('blockchain_id, candidate_email, summary, expiry_at, revoked')
    .eq('id', vtok.credential_id)
    .single()
  
  if (e2 || !cred) return NextResponse.json({ error: 'not found' }, { status: 404, headers: corsHeaders })
  
  // Check if revoked
  if (cred.revoked) {
    return NextResponse.json({ 
      error: 'credential_revoked',
      message: 'This credential has been revoked by the candidate and is no longer valid'
    }, { status: 400, headers: corsHeaders })
  }
  
  // Check if expired
  if (new Date(cred.expiry_at).getTime() < Date.now()) {
    return NextResponse.json({ 
      error: 'credential_expired',
      message: 'This credential has expired'
    }, { status: 400, headers: corsHeaders })
  }

  return NextResponse.json({
    blockchain_id: cred.blockchain_id,
    candidate_email: cred.candidate_email,
    summary: cred.summary,
    expiry_at: cred.expiry_at,
    revoked: cred.revoked,
    note: cred.blockchain_id ? null : 'Credential pending blockchain confirmation'
  }, { headers: corsHeaders })
}
