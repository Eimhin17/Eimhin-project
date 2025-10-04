// Add created_at column to profiles table

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
  console.error('   Please set SUPABASE_SERVICE_ROLE_KEY before running this script.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addCreatedAtColumn() {
  console.log('🚀 Adding created_at column to profiles table\n');

  try {
    // Step 1: Add the column with default value
    console.log('1️⃣ Adding created_at column...');
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE profiles
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
      `
    });

    if (addColumnError) {
      console.log('❌ Error adding column:', addColumnError.message);
      return;
    }
    console.log('✅ Column added successfully');

    // Step 2: Set created_at for existing profiles
    console.log('\n2️⃣ Setting created_at for existing profiles...');
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE profiles
        SET created_at = COALESCE(updated_at, NOW())
        WHERE created_at IS NULL;
      `
    });

    if (updateError) {
      console.log('❌ Error updating existing profiles:', updateError.message);
      return;
    }
    console.log('✅ Existing profiles updated');

    // Step 3: Make it NOT NULL
    console.log('\n3️⃣ Making column NOT NULL...');
    const { error: notNullError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE profiles
        ALTER COLUMN created_at SET NOT NULL;
      `
    });

    if (notNullError) {
      console.log('❌ Error setting NOT NULL:', notNullError.message);
      return;
    }
    console.log('✅ Column set to NOT NULL');

    // Step 4: Create an index
    console.log('\n4️⃣ Creating index...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_profiles_created_at
        ON profiles(created_at);
      `
    });

    if (indexError) {
      console.log('❌ Error creating index:', indexError.message);
      return;
    }
    console.log('✅ Index created successfully');

    // Step 5: Verify the column was added
    console.log('\n5️⃣ Verifying column...');
    const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'created_at';
      `
    });

    if (columnsError) {
      console.log('❌ Error verifying column:', columnsError.message);
      return;
    }

    if (columns && columns.length > 0) {
      console.log('✅ Column verified:');
      console.log('   - Name:', columns[0].column_name);
      console.log('   - Type:', columns[0].data_type);
      console.log('   - Default:', columns[0].column_default);
      console.log('   - Nullable:', columns[0].is_nullable);
    } else {
      console.log('❌ Column not found after creation');
    }

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

// Run the migration
addCreatedAtColumn().catch(console.error);
