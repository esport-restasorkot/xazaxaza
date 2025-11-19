// supabase/functions/delete-unit/index.ts
declare const Deno: any;

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    // Create a client to verify the user is an admin.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authorization } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized: User not found' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
        });
    }

    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'Admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }
    
    // Get the unitId from the request body.
    const { unitId } = await req.json();
    if (!unitId) {
      return new Response(JSON.stringify({ error: 'Missing unitId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    // Create a service role client to perform checks and deletion.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check for personnel dependencies.
    const { data: personnelCheck, error: personnelCheckError } = await supabaseAdmin.from('personnel').select('id').eq('unit_id', unitId).limit(1);
    if (personnelCheckError) throw personnelCheckError;
    if (personnelCheck && personnelCheck.length > 0) {
      return new Response(JSON.stringify({ error: 'Gagal menghapus: Unit ini masih memiliki personil terdaftar. Pindahkan personil terlebih dahulu.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 409, // Conflict
      });
    }
    
    // Check for report dependencies.
    const { data: reportsCheck, error: reportsCheckError } = await supabaseAdmin.from('reports').select('id').eq('assigned_unit_id', unitId).limit(1);
    if (reportsCheckError) throw reportsCheckError;
    if (reportsCheck && reportsCheck.length > 0) {
       return new Response(JSON.stringify({ error: 'Gagal menghapus: Unit ini masih memiliki laporan yang ditugaskan. Pindahkan laporan terlebih dahulu.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 409, // Conflict
      });
    }

    // If no dependencies, proceed with deletion.
    const { error: unitError } = await supabaseAdmin.from('units').delete().eq('id', unitId);
    if (unitError) throw unitError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});