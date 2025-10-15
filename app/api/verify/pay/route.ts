import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { randomId } from '@/lib/id'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(req: Request) {
  const { token, employer = 'Employer' } = await req.json()
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400, headers: corsHeaders })

  // lookup token
  const { data: vtok, error: e1 } = await supabaseAdmin
    .from('verify_tokens')
    .select('token, used, expires_at, credential_id')
    .eq('token', token)
    .single()
  if (e1 || !vtok) return NextResponse.json({ error: 'invalid token' }, { status: 400, headers: corsHeaders })
  if (vtok.used) return NextResponse.json({ error: 'token used' }, { status: 400, headers: corsHeaders })
  if (new Date(vtok.expires_at).getTime() < Date.now()) return NextResponse.json({ error: 'token expired' }, { status: 400, headers: corsHeaders })

  // mark used
  await supabaseAdmin.from('verify_tokens').update({ used: true }).eq('token', token)

  // log access and create 60s view token
  const vt = `view_${randomId()}`
  const viewExp = new Date(Date.now() + 60 * 1000)
  await supabaseAdmin.from('view_tokens').insert({ token: vt, credential_id: vtok.credential_id, expires_at: viewExp.toISOString() })

  await supabaseAdmin.from('access_logs').insert({ credential_id: vtok.credential_id, employer })

  const url = `${process.env.NEXT_PUBLIC_APP_URL || ''}/verify/view?token=${vt}`
  return NextResponse.json({ viewUrl: url, expiresAt: viewExp.toISOString() }, { headers: corsHeaders })
}
