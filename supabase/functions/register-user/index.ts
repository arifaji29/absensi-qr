// supabase/functions/register-user/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, name } = await req.json()

    // Logika validasi untuk format email 'gurutpq'/'admintpq'
    if (!email.includes("gurutpq") && !email.includes("admintpq")) {
      throw new Error("Anda bukan guru atau admin, silahkan hubungi admin untuk proses register");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: { user }, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: name }
    })

    // ==========================================================
    // PERBAIKAN UTAMA ADA DI SINI
    // ==========================================================
    if (error) {
      // Kita periksa bagian pesan yang paling unik dan konsisten
      if (error.message.includes("already been registered")) {
        throw new Error("Email ini sudah digunakan pengguna lain");
      }
      // Jika error lain, lempar error aslinya
      throw error;
    }

    return new Response(JSON.stringify({ user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})