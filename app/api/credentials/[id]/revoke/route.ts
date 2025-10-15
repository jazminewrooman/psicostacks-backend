import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

/**
 * PATCH /api/credentials/[id]/revoke
 * Marks a credential as revoked after blockchain transaction
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { txId } = await req.json()

    if (!txId) {
      return NextResponse.json(
        { error: 'Missing transaction ID' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Update credential status
    const { data, error } = await supabaseAdmin
      .from('credentials')
      .update({
        revoked: true,
        status: 'revoked',
        // Optionally store the revoke transaction ID
        // revoke_tx_id: txId, // You'd need to add this column
      })
      .eq('id', params.id)
      .select('id, revoked, status')
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
      success: true,
      credentialId: data.id,
      revoked: data.revoked,
      status: data.status,
    }, { headers: corsHeaders })
  } catch (e: any) {
    console.error('Error revoking credential:', e)
    return NextResponse.json(
      { error: String(e.message || e) },
      { status: 500, headers: corsHeaders }
    )
  }
}
