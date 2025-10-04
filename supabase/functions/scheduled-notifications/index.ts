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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { type = 'daily' } = await req.json()

    // Get all active users with notifications enabled
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, push_notifications_enabled')
      .eq('profile_completed', true)
      .eq('status', 'active')
      .eq('push_notifications_enabled', true)

    if (usersError) {
      throw usersError
    }

    console.log(`Processing ${type} notifications for ${users?.length || 0} users`)

    const results = {
      total: users?.length || 0,
      sent: 0,
      failed: 0,
    }

    // Process each user
    for (const user of users || []) {
      try {
        let sent = false

        if (type === 'daily') {
          // Call the edge function for daily engagement
          const { error } = await supabase.functions.invoke('send-engagement-notification', {
            body: { userId: user.id, type: 'daily' }
          })
          if (!error) sent = true
        } else if (type === 'weekly') {
          // Weekly summary (only on specific day)
          const { error } = await supabase.functions.invoke('send-engagement-notification', {
            body: { userId: user.id, type: 'weekly' }
          })
          if (!error) sent = true
        } else if (type === 're_engagement') {
          // Re-engagement check
          const { error } = await supabase.functions.invoke('send-engagement-notification', {
            body: { userId: user.id, type: 're_engagement' }
          })
          if (!error) sent = true
        } else if (type === 'prime_time') {
          // Prime time notification
          const { error } = await supabase.functions.invoke('send-engagement-notification', {
            body: { userId: user.id, type: 'prime_time' }
          })
          if (!error) sent = true
        }

        if (sent) {
          results.sent++
        }
      } catch (err) {
        console.error(`Failed to process user ${user.id}:`, err)
        results.failed++
      }
    }

    console.log('Notification processing complete:', results)

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in scheduled notifications:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
