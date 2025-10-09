import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { randomId } from '@/lib/id'

export async function POST(req: Request) {
  const { credentialId, ttlSec = 120 } = await req.json()
  if (!credentialId) return NextResponse.json({ error: 'credentialId required' }, { status: 400 })
  const token = `v_${randomId()}`
  const expires = new Date(Date.now() + Math.max(30, ttlSec) * 1000)

  const { error } = await supabaseAdmin
    .from('verify_tokens')
    .insert({ token, credential_id: credentialId, expires_at: expires.toISOString() })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const url = `${process.env.NEXT_PUBLIC_APP_URL || ''}/verify?token=${token}`
  return NextResponse.json({ token, expiresAt: expires.toISOString(), url })
}
