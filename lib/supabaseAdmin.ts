import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable')
}

if (!supabaseServiceRole) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE environment variable')
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRole,
  { auth: { persistSession: false } }
)
