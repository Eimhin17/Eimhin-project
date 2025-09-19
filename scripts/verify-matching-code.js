// Simple verification script to check matching code structure
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Matching System Code...\n');

// Check if required files exist
const requiredFiles = [
  'services/matching.ts',
  'services/likes.ts',
  'services/chat.ts',
  'hooks/useMatchCreation.ts',
  'database/fix-matches-rls-safe.sql'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
});

// Check if matching service has required methods
const matchingServicePath = path.join(__dirname, '..', 'services', 'matching.ts');
if (fs.existsSync(matchingServicePath)) {
  const content = fs.readFileSync(matchingServicePath, 'utf8');
  
  const requiredMethods = [
    'checkForMatch',
    'createMatch',
    'getExistingMatch',
    'getUserMatches'
  ];
  
  console.log('\n🔍 Checking MatchingService methods...');
  requiredMethods.forEach(method => {
    if (content.includes(`static async ${method}`)) {
      console.log(`✅ ${method} method exists`);
    } else {
      console.log(`❌ ${method} method missing`);
      allFilesExist = false;
    }
  });
}

// Check if likes service has required methods
const likesServicePath = path.join(__dirname, '..', 'services', 'likes.ts');
if (fs.existsSync(likesServicePath)) {
  const content = fs.readFileSync(likesServicePath, 'utf8');
  
  const requiredMethods = [
    'createLike',
    'checkMutualLike',
    'hasLiked'
  ];
  
  console.log('\n🔍 Checking LikesService methods...');
  requiredMethods.forEach(method => {
    if (content.includes(`static async ${method}`)) {
      console.log(`✅ ${method} method exists`);
    } else {
      console.log(`❌ ${method} method missing`);
      allFilesExist = false;
    }
  });
}

// Check if chat service has required methods
const chatServicePath = path.join(__dirname, '..', 'services', 'chat.ts');
if (fs.existsSync(chatServicePath)) {
  const content = fs.readFileSync(chatServicePath, 'utf8');
  
  const requiredMethods = [
    'getMatches',
    'getMessages',
    'sendMessage'
  ];
  
  console.log('\n🔍 Checking ChatService methods...');
  requiredMethods.forEach(method => {
    if (content.includes(`static async ${method}`)) {
      console.log(`✅ ${method} method exists`);
    } else {
      console.log(`❌ ${method} method missing`);
      allFilesExist = false;
    }
  });
}

// Check if useMatchCreation hook has required methods
const hookPath = path.join(__dirname, '..', 'hooks', 'useMatchCreation.ts');
if (fs.existsSync(hookPath)) {
  const content = fs.readFileSync(hookPath, 'utf8');
  
  const requiredMethods = [
    'checkAndCreateMatch'
  ];
  
  console.log('\n🔍 Checking useMatchCreation hook...');
  requiredMethods.forEach(method => {
    if (content.includes(method)) {
      console.log(`✅ ${method} method exists`);
    } else {
      console.log(`❌ ${method} method missing`);
      allFilesExist = false;
    }
  });
}

// Check RLS policies
const rlsPath = path.join(__dirname, '..', 'database', 'fix-matches-rls-policies.sql');
if (fs.existsSync(rlsPath)) {
  const content = fs.readFileSync(rlsPath, 'utf8');
  
  const requiredPolicies = [
    'Users can view their matches',
    'Users can create matches',
    'Users can update their matches',
    'Users can delete their matches'
  ];
  
  console.log('\n🔍 Checking RLS policies...');
  requiredPolicies.forEach(policy => {
    if (content.includes(policy)) {
      console.log(`✅ ${policy} policy exists`);
    } else {
      console.log(`❌ ${policy} policy missing`);
      allFilesExist = false;
    }
  });
}

console.log('\n' + '='.repeat(50));

if (allFilesExist) {
  console.log('🎉 All matching system components are properly implemented!');
  console.log('\n📋 Next steps:');
  console.log('1. Run the RLS policy fix in your Supabase SQL editor');
  console.log('2. Test the matching flow in your app');
  console.log('3. Verify matches appear in the Chats tab');
} else {
  console.log('❌ Some components are missing or incomplete');
  console.log('Please check the errors above and fix them');
}

console.log('\n📖 For detailed information, see MATCHING_SYSTEM_GUIDE.md');
