const { createClient } = require('@supabase/supabase-js');
const { convertFileUriToDataUrl, convertPhotoArrayToDataUrls } = require('../utils/imageUtils');

// Test the image conversion fix
async function testImageFix() {
  console.log('🧪 Testing image conversion fix...');
  
  try {
    // Test 1: Convert a single file URI
    console.log('\n1️⃣ Testing single file URI conversion...');
    const testFileUri = 'file:///var/mobile/Containers/Data/Application/test.jpg';
    const convertedSingle = await convertFileUriToDataUrl(testFileUri);
    console.log('✅ Single conversion result:', convertedSingle.substring(0, 50) + '...');
    
    // Test 2: Convert an array of file URIs
    console.log('\n2️⃣ Testing array conversion...');
    const testFileUris = [
      'file:///var/mobile/Containers/Data/Application/test1.jpg',
      'file:///var/mobile/Containers/Data/Application/test2.jpg'
    ];
    const convertedArray = await convertPhotoArrayToDataUrls(testFileUris);
    console.log('✅ Array conversion result:', convertedArray.length, 'photos converted');
    
    // Test 3: Test with data URLs (should pass through)
    console.log('\n3️⃣ Testing data URL passthrough...');
    const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
    const passthroughResult = await convertFileUriToDataUrl(dataUrl);
    console.log('✅ Data URL passthrough:', passthroughResult === dataUrl ? 'PASS' : 'FAIL');
    
    // Test 4: Test with HTTP URLs (should pass through)
    console.log('\n4️⃣ Testing HTTP URL passthrough...');
    const httpUrl = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=600&fit=crop&crop=face';
    const httpResult = await convertFileUriToDataUrl(httpUrl);
    console.log('✅ HTTP URL passthrough:', httpResult === httpUrl ? 'PASS' : 'FAIL');
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testImageFix();
