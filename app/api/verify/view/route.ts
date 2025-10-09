import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { decryptJson } from '@/lib/crypto'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token') || ''
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const { data: vt, error: e1 } = await supabaseAdmin
    .from('view_tokens')
    .select('token, expires_at, credential_id')
    .eq('token', token)
    .single()
  if (e1 || !vt) return NextResponse.json({ error: 'invalid token' }, { status: 400 })
  if (new Date(vt.expires_at).getTime() < Date.now()) return NextResponse.json({ error: 'expired' }, { status: 400 })

  // fetch credential to get storage key + summary
  const { data: cred, error: e2 } = await supabaseAdmin
    .from('credentials')
    .select('storage_key, summary, revoked, expiry_at')
    .eq('id', vt.credential_id)
    .single()
  if (e2 || !cred) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (cred.revoked || new Date(cred.expiry_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'revoked_or_expired' }, { status: 400 })
  }

  // read encrypted blob
  const { data: file, error: dlErr } = await supabaseAdmin.storage.from('reports').download(cred.storage_key)
  if (dlErr || !file) return NextResponse.json({ error: 'blob_missing' }, { status: 500 })
  const enc = JSON.parse(await file.text())
  const json = decryptJson(enc)

  return NextResponse.json({ summary: cred.summary, report: json })
}
