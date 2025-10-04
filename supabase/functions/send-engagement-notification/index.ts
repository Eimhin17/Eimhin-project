import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to send push notification
async function sendPushNotification(
  supabase: any,
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
) {
  const { error } = await supabase.functions.invoke('send-push-notification', {
    body: {
      userId,
      title,
      body,
      data,
      sound: 'default',
      priority: 'high',
    }
  })
  return !error
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { userId, type } = await req.json()

    if (!userId || !type) {
      return new Response(
        JSON.stringify({ error: 'userId and type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let sent = false

    if (type === 'daily') {
      // Daily engagement notification - prioritized
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      // 1. Check unread messages
      const { data: matches } = await supabase
        .from('matches')
        .select('id')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

      if (matches && matches.length > 0) {
        const { data: unreadMessages } = await supabase
          .from('messages')
          .select('id, match_id')
          .in('match_id', matches.map(m => m.id))
          .eq('is_read', false)
          .neq('sender_id', userId)

        if (unreadMessages && unreadMessages.length > 0) {
          const uniqueMatches = new Set(unreadMessages.map(m => m.match_id)).size
          const message = uniqueMatches === 1
            ? 'You have an unread message!'
            : `You have unread messages from ${uniqueMatches} matches!`

          sent = await sendPushNotification(supabase, userId, '💬 Unread Messages', message, { type: 'unread_messages_reminder' })
          if (sent) {
            return new Response(JSON.stringify({ success: true, type: 'unread_messages' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }
        }
      }

      // 2. Check unopened likes
      const { data: likes } = await supabase
        .from('likes')
        .select('liker_id')
        .eq('liked_user_id', userId)

      if (likes && likes.length > 0) {
        const { data: swipes } = await supabase
          .from('swipes')
          .select('swiped_user_id')
          .eq('swiper_id', userId)
          .in('swiped_user_id', likes.map(l => l.liker_id))

        const swipedUserIds = new Set(swipes?.map(s => s.swiped_user_id) || [])
        const unopenedLikes = likes.filter(like => !swipedUserIds.has(like.liker_id))

        if (unopenedLikes.length > 0) {
          const message = unopenedLikes.length === 1
            ? '1 person likes you! Check them out'
            : `${unopenedLikes.length} people like you! Check them out`

          sent = await sendPushNotification(supabase, userId, '💖 You Have Likes!', message, { type: 'unopened_likes_reminder' })
          if (sent) {
            return new Response(JSON.stringify({ success: true, type: 'unopened_likes' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }
        }
      }

      // 3. Check new profiles
      const { data: recentSwipes } = await supabase
        .from('swipes')
        .select('id')
        .eq('swiper_id', userId)
        .gte('created_at', oneDayAgo)

      if (!recentSwipes || recentSwipes.length === 0) {
        const { count: profileCount } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('profile_completed', true)
          .eq('status', 'active')
          .neq('id', userId)

        if (profileCount && profileCount > 0) {
          sent = await sendPushNotification(
            supabase,
            userId,
            '✨ New Profiles Available!',
            `${profileCount} people are waiting to meet you!`,
            { type: 'new_profiles_reminder' }
          )
        }
      }
    } else if (type === 'weekly') {
      // Weekly summary
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [likesReceived, matches, messages] = await Promise.all([
        supabase.from('likes').select('id', { count: 'exact', head: true }).eq('liked_user_id', userId).gte('created_at', oneWeekAgo),
        supabase.from('matches').select('id', { count: 'exact', head: true }).or(`user1_id.eq.${userId},user2_id.eq.${userId}`).gte('matched_at', oneWeekAgo),
        supabase.from('messages').select('id', { count: 'exact', head: true }).eq('sender_id', userId).gte('created_at', oneWeekAgo)
      ])

      const likesCount = likesReceived.count || 0
      const matchesCount = matches.count || 0
      const messagesCount = messages.count || 0

      if (likesCount > 0 || matchesCount > 0) {
        const parts = []
        if (likesCount > 0) parts.push(`${likesCount} like${likesCount > 1 ? 's' : ''}`)
        if (matchesCount > 0) parts.push(`${matchesCount} match${matchesCount > 1 ? 'es' : ''}`)
        if (messagesCount > 0) parts.push(`${messagesCount} message${messagesCount > 1 ? 's' : ''}`)

        sent = await sendPushNotification(
          supabase,
          userId,
          '✨ Your Weekly Update',
          `📊 Your Week: ${parts.join(', ')}!`,
          { type: 'weekly_summary', likes: likesCount, matches: matchesCount, messages: messagesCount }
        )
      }
    } else if (type === 're_engagement') {
      // Re-engagement for inactive users
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

      const [swipes, messages] = await Promise.all([
        supabase.from('swipes').select('id').eq('swiper_id', userId).gte('created_at', threeDaysAgo).limit(1),
        supabase.from('messages').select('id').eq('sender_id', userId).gte('created_at', threeDaysAgo).limit(1)
      ])

      if ((!swipes.data || swipes.data.length === 0) && (!messages.data || messages.data.length === 0)) {
        const { data: likes } = await supabase.from('likes').select('id').eq('liked_user_id', userId).limit(1)

        const message = likes && likes.length > 0
          ? 'Someone likes you! Come back and see who it is 👀'
          : 'New people joined! Come see who you might match with ✨'

        sent = await sendPushNotification(supabase, userId, '💫 We Miss You!', message, { type: 're_engagement' })
      }
    } else if (type === 'prime_time') {
      // Prime time notification (7-10 PM)
      const now = new Date()
      const hour = now.getHours()

      if (hour >= 19 && hour <= 22) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

        const { data: recentActivity } = await supabase
          .from('swipes')
          .select('id')
          .eq('swiper_id', userId)
          .gte('created_at', oneHourAgo)
          .limit(1)

        if (!recentActivity || recentActivity.length === 0) {
          sent = await sendPushNotification(
            supabase,
            userId,
            '🔥 Peak Time!',
            'Most users are online right now. Perfect time to swipe!',
            { type: 'prime_time' }
          )
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
