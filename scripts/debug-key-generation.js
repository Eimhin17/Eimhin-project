// Debug key generation to understand the issue

const crypto = require('crypto');

function debugKeyGeneration() {
  console.log('🔍 DEBUGGING KEY GENERATION\n');
  
  const SECRET_KEY = 'debsmatch-military-grade-key-2024-ultra-secure';
  const user1Id = 'user-123-abc';
  const user2Id = 'user-456-def';
  
  // Step 1: Create conversation ID
  const combined = user1Id < user2Id ? `${user1Id}_${user2Id}` : `${user2Id}_${user1Id}`;
  console.log('1. Combined conversation ID:', combined);
  
  // Step 2: Create salt
  const conversationHash = crypto.createHash('sha256').update(combined).digest('hex');
  const secretHash = crypto.createHash('sha256').update(SECRET_KEY).digest('hex');
  const salt = crypto.createHash('sha256').update(conversationHash + secretHash).digest('hex');
  console.log('2. Salt length:', salt.length);
  console.log('2. Salt:', salt);
  
  // Step 3: PBKDF2
  const derivedKey = crypto.pbkdf2Sync(SECRET_KEY, salt, 100000, 32, 'sha256');
  const keyString = derivedKey.toString('hex');
  console.log('3. Derived key length:', keyString.length);
  console.log('3. Derived key:', keyString);
  
  // Step 4: Check if we need padding
  if (keyString.length < 64) {
    console.log('4. Key too short, adding padding...');
    const additionalKey = crypto.pbkdf2Sync(keyString + SECRET_KEY, salt, 1000, 32, 'sha256');
    const finalKey = (keyString + additionalKey.toString('hex')).substring(0, 64);
    console.log('4. Final key length:', finalKey.length);
    console.log('4. Final key:', finalKey);
  } else {
    const finalKey = keyString.substring(0, 64);
    console.log('4. Final key length:', finalKey.length);
    console.log('4. Final key:', finalKey);
  }
  
  console.log('\n✅ Key generation debug complete');
}

debugKeyGeneration();
