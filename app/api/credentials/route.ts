import { NextResponse } from 'next/server'
import { createCredential } from '@/lib/credentials'

/**
 * POST /api/credentials
 * Creates a verifiable credential from provided assessment data
 * Use case: When tests are taken on the platform (not PDF upload)
 */
export async function POST(req: Request) {
  try {
    const { email, schemaId, reportJson, summary } = await req.json()
    
    if (!email || !reportJson || !summary) {
      return NextResponse.json({ error: 'Missing required fields: email, reportJson, summary' }, { status: 400 })
    }

    const credential = await createCredential({
      email,
      reportJson,
      summary,
      schemaId,
    })

    return NextResponse.json({
      credentialId: credential.id,
      sbtId: credential.sbtId,
      commitmentHash: credential.commitmentHash,
      expiryAt: credential.expiryAt,
    })
  } catch (e: any) {
    console.error('Error creating credential:', e)
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 })
  }
}
