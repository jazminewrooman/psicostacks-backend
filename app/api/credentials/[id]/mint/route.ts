import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// CORS headers to allow requests from frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Handler for preflight requests
export async function OPTIONS(req: Request) {
  return NextResponse.json({}, { headers: corsHeaders })
}

/**
 * PATCH /api/credentials/[id]/mint
 * Updates credential with blockchain transaction details after SBT mint
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { sbtId, txId, blockchainId } = await req.json()
    
    if (!sbtId || !txId) {
      return NextResponse.json(
        { error: 'Missing required fields: sbtId, txId' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Update credential with blockchain details
    const { data, error } = await supabaseAdmin
      .from('credentials')
      .update({
        sbt_id: sbtId,
        blockchain_tx_id: txId,
        blockchain_id: blockchainId, // The on-chain credential ID
        status: 'minted',
        minted_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select('id, sbt_id, blockchain_tx_id, blockchain_id, status')
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    return NextResponse.json({
      credentialId: data.id,
      sbtId: data.sbt_id,
      blockchainTxId: data.blockchain_tx_id,
      blockchainId: data.blockchain_id,
      status: data.status,
    }, { headers: corsHeaders })
  } catch (e: any) {
    console.error('Error updating credential:', e)
    return NextResponse.json(
      { error: String(e.message || e) },
      { status: 500, headers: corsHeaders }
    )
  }
}
