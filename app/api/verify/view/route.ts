import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { decryptJson } from '@/lib/crypto'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token') || ''
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400, headers: corsHeaders })

  const { data: vt, error: e1 } = await supabaseAdmin
    .from('view_tokens')
    .select('token, expires_at, credential_id')
    .eq('token', token)
    .single()
  if (e1 || !vt) return NextResponse.json({ error: 'invalid token' }, { status: 400, headers: corsHeaders })
  if (new Date(vt.expires_at).getTime() < Date.now()) return NextResponse.json({ error: 'expired' }, { status: 400, headers: corsHeaders })

  // fetch credential to get storage key + summary
  const { data: cred, error: e2 } = await supabaseAdmin
    .from('credentials')
    .select('storage_key, summary, revoked, expiry_at')
    .eq('id', vt.credential_id)
    .single()
  if (e2 || !cred) return NextResponse.json({ error: 'not found' }, { status: 404, headers: corsHeaders })
  if (cred.revoked || new Date(cred.expiry_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'revoked_or_expired' }, { status: 400, headers: corsHeaders })
  }

  // read encrypted blob (if available)
  let fullReport = null
  
  // Only attempt download if storage_key exists (older credentials may not have it)
  if (cred.storage_key) {
    console.log('Attempting to download report from storage:', cred.storage_key)
    
    const { data: file, error: dlErr } = await supabaseAdmin.storage.from('reports').download(cred.storage_key)
    
    if (!dlErr && file) {
      try {
        console.log('Report file downloaded successfully, size:', file.size)
        const enc = JSON.parse(await file.text())
        fullReport = decryptJson(enc)
        console.log('Report decrypted successfully')
      } catch (decryptErr) {
        console.error('Error decrypting report:', decryptErr)
        // Continue without full report if decryption fails
      }
    } else {
      console.error('Report blob not found in storage!')
      console.error('Storage key:', cred.storage_key)
      console.error('Error:', dlErr)
      // Continue with just summary if blob is missing
    }
  } else {
    console.log('No storage key found - older credential without full report')
  }

  return NextResponse.json({ 
    summary: cred.summary, 
    report: fullReport,
    note: fullReport ? null : 'Full report not available (may be an older credential)'
  }, { headers: corsHeaders })
}
