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
 * GET /api/credentials/[id]
 * Retrieves credential details by ID
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('credentials')
      .select('*')
      .eq('id', params.id)
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

    return NextResponse.json(data, { headers: corsHeaders })
  } catch (e: any) {
    console.error('Error fetching credential:', e)
    return NextResponse.json(
      { error: String(e.message || e) },
      { status: 500, headers: corsHeaders }
    )
  }
}
