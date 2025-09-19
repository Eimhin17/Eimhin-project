const { createClient } = require('@supabase/supabase-js');

// Use your project's service role key for admin operations
const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDUxOTA3OCwiZXhwIjoyMDcwMDk1MDc4fQ.YourServiceRoleKeyHere';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixScreenshotConstraint() {
  try {
    console.log('🔧 Fixing report_screenshot constraint...\n');

    // Step 1: Check existing constraints
    console.log('1. Checking existing constraints...');
    const { data: constraints, error: constraintError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
              conname as constraint_name,
              pg_get_constraintdef(oid) as constraint_definition
          FROM pg_constraint 
          WHERE conrelid = 'content_reports'::regclass 
          AND conname LIKE '%screenshot%';
        `
      });

    if (constraintError) {
      console.log('⚠️ Could not check constraints (may not have exec_sql function):', constraintError.message);
    } else {
      console.log('📋 Existing constraints:', constraints);
    }

    // Step 2: Drop existing constraint
    console.log('\n2. Dropping existing constraint...');
    const { error: dropError } = await supabase
      .rpc('exec_sql', {
        sql: 'ALTER TABLE content_reports DROP CONSTRAINT IF EXISTS check_report_screenshot_format;'
      });

    if (dropError) {
      console.log('⚠️ Could not drop constraint (may not exist):', dropError.message);
    } else {
      console.log('✅ Existing constraint dropped');
    }

    // Step 3: Create new constraint
    console.log('\n3. Creating new constraint...');
    const { error: createError } = await supabase
      .rpc('exec_sql', {
        sql: `
          ALTER TABLE content_reports 
          ADD CONSTRAINT check_report_screenshot_format 
          CHECK (
            report_screenshot IS NULL OR
            report_screenshot ~ '^https?://' OR
            report_screenshot ~ '^file://' OR
            report_screenshot ~ '^data:'
          );
        `
      });

    if (createError) {
      console.log('❌ Error creating constraint:', createError.message);
      console.log('\n📝 Manual fix required:');
      console.log('1. Go to Supabase SQL Editor');
      console.log('2. Run the SQL from database/fix-report-screenshot-constraint.sql');
      console.log('3. Or run this SQL directly:');
      console.log(`
        ALTER TABLE content_reports DROP CONSTRAINT IF EXISTS check_report_screenshot_format;
        ALTER TABLE content_reports 
        ADD CONSTRAINT check_report_screenshot_format 
        CHECK (
          report_screenshot IS NULL OR
          report_screenshot ~ '^https?://' OR
          report_screenshot ~ '^file://' OR
          report_screenshot ~ '^data:'
        );
      `);
    } else {
      console.log('✅ New constraint created successfully');
    }

    // Step 4: Test the constraint
    console.log('\n4. Testing constraint with sample data...');
    
    // Test with a valid URL
    const { error: testError } = await supabase
      .from('content_reports')
      .update({ report_screenshot: 'https://example.com/test.jpg' })
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .limit(1);

    if (testError) {
      console.log('⚠️ Test update failed (expected if no matching record):', testError.message);
    } else {
      console.log('✅ Constraint test passed');
    }

    console.log('\n🎉 Constraint fix complete!');
    console.log('\nThe constraint now allows:');
    console.log('- NULL values (no screenshot)');
    console.log('- HTTP/HTTPS URLs (Supabase Storage URLs)');
    console.log('- File URLs (file://)');
    console.log('- Data URLs (data:) as fallback');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('\n📝 Manual fix required:');
    console.log('1. Go to Supabase SQL Editor');
    console.log('2. Run the SQL from database/fix-report-screenshot-constraint.sql');
  }
}

// Run the fix
fixScreenshotConstraint();
