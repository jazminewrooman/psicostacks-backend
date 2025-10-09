import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { encryptJson, sha256Canonical } from '@/lib/crypto'
import { randomId } from '@/lib/id'

export async function POST(req: Request) {
  try {
    const { email, schemaId = 'psicostacks:v1', reportJson, summary } = await req.json()
    if (!email || !reportJson || !summary) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // encrypt & store
    const enc = encryptJson(reportJson)
    const storageKey = `reports/${randomId('r_')}.json`
    const { error: upErr } = await supabaseAdmin.storage.from('reports').upload(storageKey, Buffer.from(JSON.stringify(enc)), {
      contentType: 'application/json',
      upsert: false
    })
    if (upErr) throw upErr

    // hash (commitment)
    const commitmentHash = sha256Canonical(reportJson)

    // simulate on-chain SBT id (replace with real Clarity tx id if available)
    const sbtId = `sbt_${randomId()}`

    const expiry = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)

    const { data, error } = await supabaseAdmin
      .from('credentials')
      .insert({
        candidate_email: email,
        schema_id: schemaId,
        sbt_id: sbtId,
        commitment_hash: commitmentHash,
        summary,
        storage_key: storageKey,
        expiry_at: expiry.toISOString()
      })
      .select('id, sbt_id, commitment_hash, expiry_at')
      .single()

    if (error) throw error

    return NextResponse.json({
      credentialId: data.id,
      sbtId: data.sbt_id,
      commitmentHash: data.commitment_hash,
      expiryAt: data.expiry_at
    })
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 })
  }
}
