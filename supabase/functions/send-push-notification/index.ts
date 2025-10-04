import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Expo Push API endpoint
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface PushNotificationPayload {
  to: string | string[]
  title: string
  body: string
  data?: Record<string, any>
  sound?: 'default' | null
  badge?: number
  priority?: 'default' | 'normal' | 'high'
  channelId?: string
}

async function sendExpoNotification(payload: PushNotificationPayload) {
  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Expo Push API error: ${errorText}`)
  }

  return await response.json()
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      userId,
      userIds,
      title,
      body,
      data,
      sound = 'default',
      badge,
      priority = 'high',
    } = await req.json()

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'Title and body are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!userId && !userIds) {
      return new Response(
        JSON.stringify({ error: 'Either userId or userIds must be provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get push tokens for the user(s)
    let query = supabase
      .from('push_tokens')
      .select('push_token, user_id')
      .eq('is_active', true)

    if (userId) {
      query = query.eq('user_id', userId)
    } else if (userIds && Array.isArray(userIds)) {
      query = query.in('user_id', userIds)
    }

    const { data: tokens, error: tokenError } = await query

    if (tokenError) {
      console.error('Error fetching push tokens:', tokenError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens', details: tokenError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!tokens || tokens.length === 0) {
      console.log('No active push tokens found for user(s)')
      return new Response(
        JSON.stringify({ success: true, message: 'No active push tokens found', sent: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Prepare push notification payload
    const pushTokens = tokens.map(t => t.push_token)
    const payload: PushNotificationPayload = {
      to: pushTokens,
      title,
      body,
      data: data || {},
      sound,
      priority,
      channelId: 'default',
    }

    if (badge !== undefined) {
      payload.badge = badge
    }

    // Send notification via Expo Push API
    console.log(`Sending notification to ${pushTokens.length} device(s)`)
    const result = await sendExpoNotification(payload)

    console.log('Notification sent successfully:', result)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification sent successfully',
        sent: pushTokens.length,
        result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
