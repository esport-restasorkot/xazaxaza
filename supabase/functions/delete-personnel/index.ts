// supabase/functions/delete-personnel/index.ts
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

    // Create a Supabase client with the Auth context of the logged-in user to verify they are an admin.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authorization } } }
    )

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

    // Get personnelId from the request body.
    const { personnelId } = await req.json()
    if (!personnelId) {
      return new Response(JSON.stringify({ error: 'Missing required field: personnelId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Create a service role client to perform privileged admin actions.
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Find the personnel record to get their user_id before deleting it.
    const { data: personnelData, error: personnelError } = await supabaseAdmin
        .from('personnel')
        .select('user_id')
        .eq('id', personnelId)
        .single();
    
    if (personnelError && personnelError.code !== 'PGRST116') {
        // Throw any error except for 'not found'. If not found, we can proceed as it might be already deleted.
        throw personnelError;
    }

    // Delete all assignments for this personnel from the junction table.
    const { error: assignmentError } = await supabaseAdmin
        .from('assigned_personnel')
        .delete()
        .eq('personnel_id', personnelId);
    
    if (assignmentError) throw assignmentError;

    // Delete the personnel record itself.
    const { error: deletePersonnelError } = await supabaseAdmin
        .from('personnel')
        .delete()
        .eq('id', personnelId);
    
    if (deletePersonnelError) throw deletePersonnelError;

    // If the personnel had a user account, delete it.
    if (personnelData && personnelData.user_id) {
        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(personnelData.user_id);

        // It's possible the user was already deleted, so we ignore 'User not found' errors.
        // Any other error should be thrown.
        if (deleteUserError && deleteUserError.message !== 'User not found') {
            console.error(`Failed to delete user ${personnelData.user_id} after deleting personnel ${personnelId}:`, deleteUserError);
        }
    }

    return new Response(JSON.stringify({ success: true, message: 'Personnel deleted successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in delete-personnel function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})