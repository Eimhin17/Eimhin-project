-- =====================================================
-- NUCLEAR OPTION: Force remove ALL foreign keys and recreate
-- =====================================================

-- 1. Get list of ALL foreign key constraints on profiles
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.profiles'::regclass
        AND contype = 'f'
    LOOP
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname) || ' CASCADE';
        RAISE NOTICE 'Dropped constraint: %', r.conname;
    END LOOP;
END $$;

-- 2. Verify all foreign keys are gone
SELECT
    conname as constraint_name,
    confrelid::regclass as foreign_table_name
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
    AND contype = 'f';

-- 3. Add ONLY the correct foreign key
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Verify it's correct
SELECT
    conname as constraint_name,
    confrelid::regclass as foreign_table_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
    AND contype = 'f';

-- 5. Success!
SELECT '✅ ALL FOREIGN KEYS REMOVED AND CORRECT ONE ADDED!' as status;
