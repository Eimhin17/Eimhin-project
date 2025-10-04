const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDUxOTA3OCwiZXhwIjoyMDcwMDk1MDc4fQ.v9KqFIXBU5KTmJlEE5kOKj_1TGkHaC4pEP8SK6GD06k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConstraints() {
  console.log('🔍 Checking profiles table constraints...\n');

  // Check foreign key constraints on profiles table
  const { data: constraints, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'profiles'
      ORDER BY tc.constraint_name;
    `
  });

  if (error) {
    console.error('❌ Error:', error);

    // Try alternative query without RPC
    console.log('\n🔄 Trying alternative query...\n');
    const query = `
      SELECT
        conname as constraint_name,
        conrelid::regclass as table_name,
        confrelid::regclass as foreign_table_name,
        a.attname as column_name,
        af.attname as foreign_column_name
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
      JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
      WHERE c.contype = 'f'
        AND conrelid::regclass::text = 'profiles'
      ORDER BY conname;
    `;

    console.log('Query:', query);
    return;
  }

  console.log('✅ Foreign key constraints on profiles table:');
  console.log(JSON.stringify(constraints, null, 2));
}

checkConstraints();
