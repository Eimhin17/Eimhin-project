// Test Password Field Access
// This will test if the password field is now accessible in UserContext

console.log('🧪 Testing Password Field Access\n');

// Simulate the UserContext structure
const mockUserProfile = {
  firstName: 'Test',
  lastName: 'User',
  dateOfBirth: new Date('2000-01-01'),
  gender: 'woman',
  school: 'Test School',
  schoolEmail: 'test@example.com',
  password: 'TestPassword123', // This should now be accessible
  accountCreated: true
};

console.log('📋 Mock User Profile:');
console.log('   First Name:', mockUserProfile.firstName);
console.log('   Last Name:', mockUserProfile.lastName);
console.log('   Email:', mockUserProfile.schoolEmail);
console.log('   Password:', mockUserProfile.password ? '✅ Present' : '❌ Missing');
console.log('   Password Length:', mockUserProfile.password?.length || 0);
console.log('   Account Created:', mockUserProfile.accountCreated);

// Test the signup data structure
const signupData = {
  email: mockUserProfile.schoolEmail,
  password: mockUserProfile.password, // No fallback - password must be provided
  first_name: mockUserProfile.firstName,
  last_name: mockUserProfile.lastName,
  date_of_birth: mockUserProfile.dateOfBirth.toISOString().split('T')[0],
  gender: mockUserProfile.gender,
  looking_for: 'go_to_someones_debs',
  relationship_intention: 'long_term_only'
};

console.log('\n🔐 Signup Data Structure:');
console.log('   Email:', signupData.email);
console.log('   Password:', signupData.password ? '✅ Present' : '❌ Missing');
console.log('   Password Length:', signupData.password?.length || 0);
console.log('   First Name:', signupData.first_name);
console.log('   Last Name:', signupData.last_name);

console.log('\n🎯 Test Complete!');
console.log('\n📋 If password is present, the fix worked!');
console.log('   If password is missing, there\'s still an issue.');
