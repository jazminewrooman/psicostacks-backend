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
 * GET /api/credentials/mine?email=user@example.com
 * Returns all credentials for a given candidate email
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json(
      { error: 'email parameter required' },
      { status: 400, headers: corsHeaders }
    )
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('credentials')
      .select('id, blockchain_id, sbt_id, status, summary, issued_at, expiry_at, revoked')
      .eq('candidate_email', email)
      .order('issued_at', { ascending: false })

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
