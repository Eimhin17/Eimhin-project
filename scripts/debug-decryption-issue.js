// Debug decryption issue - check what's actually in the database

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugDecryptionIssue() {
  console.log('🔍 DEBUGGING DECRYPTION ISSUE\n');
  
  try {
    // Get recent messages from database
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error fetching messages:', error);
      return;
    }

    if (!messages || messages.length === 0) {
      console.log('📝 No messages found in database');
      return;
    }

    console.log(`📝 Found ${messages.length} recent messages:`);
    console.log('');

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      console.log(`--- Message ${i + 1} ---`);
      console.log('ID:', msg.id);
      console.log('Match ID:', msg.match_id);
      console.log('Sender ID:', msg.sender_id);
      console.log('Created:', msg.created_at);
      console.log('Content length:', msg.content?.length || 0);
      console.log('Content preview:', msg.content?.substring(0, 100) + '...');
      console.log('Content type:', typeof msg.content);
      
      // Check if it looks like JSON
      try {
        const parsed = JSON.parse(msg.content);
        console.log('✅ Content is valid JSON');
        console.log('JSON keys:', Object.keys(parsed));
        if (parsed.ciphertext) {
          console.log('Ciphertext length:', parsed.ciphertext.length);
          console.log('Ciphertext preview:', parsed.ciphertext.substring(0, 50) + '...');
          
          // Try to decode the base64
          try {
            const decoded = Buffer.from(parsed.ciphertext, 'base64');
            console.log('✅ Base64 decodes successfully, length:', decoded.length);
          } catch (base64Error) {
            console.log('❌ Base64 decode error:', base64Error.message);
            console.log('Problematic characters:', parsed.ciphertext.substring(0, 100));
          }
        }
      } catch (jsonError) {
        console.log('❌ Content is not valid JSON:', jsonError.message);
        console.log('Raw content:', msg.content);
      }
      
      console.log('');
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugDecryptionIssue();
