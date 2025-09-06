// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// Ambil dari environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
