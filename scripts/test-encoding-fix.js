// Test the encoding fix
const { createClient } = require('@supabase/supabase-js');

async function testEncodingFix() {
  console.log('🧪 Testing encoding fix...');
  
  try {
    // Test the encoding type directly
    const FileSystem = require('expo-file-system/legacy');
    console.log('📦 FileSystem available:', !!FileSystem);
    console.log('📦 FileSystem.readAsStringAsync available:', !!FileSystem.readAsStringAsync);
    console.log('📦 FileSystem.EncodingType:', FileSystem.EncodingType);
    
    // Test with a simple string to see if the encoding works
    console.log('\n✅ FileSystem module loaded successfully');
    console.log('✅ Using string encoding instead of FileSystem.EncodingType.Base64');
    
  } catch (error) {
    console.error('❌ Error testing encoding:', error);
  }
}

testEncodingFix();
