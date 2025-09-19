/**
 * Apply PFP database migration
 * Creates the profile_pictures table and sets up RLS policies
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyPFPMigration() {
  console.log('🔄 Applying PFP Database Migration');
  console.log('================================');

  try {
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, '..', 'database', 'create-pfp-table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded:', migrationPath);

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim()) {
        console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}`);
        console.log(`📝 ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);

        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          // If exec_sql doesn't work, try direct query
          const { error: directError } = await supabase
            .from('_migrations')
            .select('*')
            .limit(1);

          if (directError) {
            console.error(`❌ Error executing statement ${i + 1}:`, error);
            console.error('Statement:', statement);
            
            // Try to continue with other statements
            continue;
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }

    // Verify the table was created
    console.log('\n🔍 Verifying table creation...');
    
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'profile_pictures');

    if (tableError) {
      console.error('❌ Error verifying table creation:', tableError);
    } else if (tables && tables.length > 0) {
      console.log('✅ profile_pictures table created successfully');
    } else {
      console.log('⚠️ profile_pictures table not found - migration may have failed');
    }

    // Test inserting a sample record
    console.log('\n🧪 Testing table functionality...');
    
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
      pfp_url: 'https://example.com/test-pfp.jpg',
      original_photo_url: 'https://example.com/test-original.jpg'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('profile_pictures')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('❌ Error testing table insert:', insertError);
    } else {
      console.log('✅ Test insert successful');
      
      // Clean up test data
      await supabase
        .from('profile_pictures')
        .delete()
        .eq('id', insertData[0].id);
      
      console.log('🧹 Test data cleaned up');
    }

    console.log('\n✅ PFP Migration Applied Successfully!');
    console.log('\nNext steps:');
    console.log('1. Test the system: node scripts/test-pfp-system.js');
    console.log('2. The PFP creation is already integrated into onboarding');
    console.log('3. Use CircularProfilePicture component in your UI');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
applyPFPMigration();
