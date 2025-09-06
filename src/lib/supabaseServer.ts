// lib/supabaseServer.ts
import { createClient } from '@supabase/supabase-js'

// Ambil dari environment variables (gunakan SERVICE_ROLE_KEY, jangan diekspos di frontend!)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey)
