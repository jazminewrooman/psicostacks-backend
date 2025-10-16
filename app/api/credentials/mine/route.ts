import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

/**
 * GET /api/credentials/mine?wallet=SP...
 * Returns all credentials for a given wallet address
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const wallet = searchParams.get('wallet')

  if (!wallet) {
    return NextResponse.json(
      { error: 'wallet parameter required' },
      { status: 400, headers: corsHeaders }
    )
  }

  try {
    // Try to find by wallet_address first
    let { data, error } = await supabaseAdmin
      .from('credentials')
      .select('id, blockchain_id, sbt_id, status, summary, issued_at, expiry_at, revoked')
      .eq('wallet_address', wallet)
      .order('issued_at', { ascending: false })

    // Fallback: if no results, try with old email format (temporary backward compatibility)
    if (!error && (!data || data.length === 0)) {
      const legacyEmail = `${wallet}@stacks`
      const { data: legacyData, error: legacyError } = await supabaseAdmin
        .from('credentials')
        .select('id, blockchain_id, sbt_id, status, summary, issued_at, expiry_at, revoked')
        .eq('candidate_email', legacyEmail)
        .order('issued_at', { ascending: false })
      
      if (!legacyError && legacyData) {
        data = legacyData
      }
    }

    if (error) {
      throw error
    }

    return NextResponse.json({ credentials: data || [] }, { headers: corsHeaders })
  } catch (error: any) {
    console.error('Error fetching credentials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credentials' },
      { status: 500, headers: corsHeaders }
    )
  }
}
