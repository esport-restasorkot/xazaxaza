// supabase/functions/create-operator/index.ts
// FIX: The triple-slash directive '/// <reference lib="deno.ns" />' was not recognized by the type checker.
// Using a global declaration for Deno instead to resolve errors where properties like 'env'
// are not found on the 'Deno' object.
declare const Deno: any;

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged-in user.
    // This is how we can verify that the user is an Admin.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // First, check if the current user is an admin.
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized: User not found' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
        })
    }
    
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'Admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // Now, get the data from the request body.
    const { personnelId, email, password } = await req.json()
    if (!personnelId || !email || !password) {
      return new Response(JSON.stringify({ error: 'Missing required fields: personnelId, email, password' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Create a separate Supabase client with the service role key to perform admin actions.
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Fetch the personnel record to get their unit_id.
    const { data: personnelData, error: personnelError } = await supabaseAdmin
        .from('personnel')
        .select('unit_id')
        .eq('id', personnelId)
        .single();
    
    if (personnelError || !personnelData) {
        return new Response(JSON.stringify({ error: 'Personnel record not found' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
        });
    }

    // 1. Create the new user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
    })
    
    if (authError) throw authError
    const newUserId = authData.user.id;

    // 2. Create the profile in public.profiles
    const { error: newProfileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUserId,
        role: 'Operator',
        unit_id: personnelData.unit_id,
      })
      
    if (newProfileError) {
        // If profile creation fails, we should try to clean up the created auth user.
        await supabaseAdmin.auth.admin.deleteUser(newUserId)
        throw newProfileError
    }

    // 3. Update the personnel record with the new user_id
    const { error: personnelUpdateError } = await supabaseAdmin
      .from('personnel')
      .update({ user_id: newUserId })
      .eq('id', personnelId)

    if (personnelUpdateError) {
        // If personnel update fails, clean up auth user and profile.
        await supabaseAdmin.auth.admin.deleteUser(newUserId)
        // Profile should be deleted by cascade or manually here if no cascade is set up.
        await supabaseAdmin.from('profiles').delete().eq('id', newUserId)
        throw personnelUpdateError
    }

    return new Response(JSON.stringify({ userId: newUserId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
