-- =====================================================
-- DebsMatch COMPLETE RESET SCRIPT
-- This script will drop everything and rebuild from scratch
-- =====================================================

-- Step 1: Drop ALL tables, types, functions, etc. in public schema
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all tables in public schema
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Drop all sequences
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
    END LOOP;
    
    -- Drop all views
    FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.viewname) || ' CASCADE';
    END LOOP;
    
    -- Drop all functions
    FOR r IN (SELECT proname FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public') LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || ' CASCADE';
    END LOOP;
    
    -- Drop all triggers
    FOR r IN (SELECT tgname FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public') LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.tgname) || ' ON ALL TABLES CASCADE';
    END LOOP;
END $$;

-- Step 2: Drop ALL custom types (enums)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all custom types in public schema
    FOR r IN (SELECT typname FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typtype = 'e') LOOP
        EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
END $$;

-- Step 3: Drop ALL extensions and recreate them
DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
DROP EXTENSION IF EXISTS "pg_trgm" CASCADE;
DROP EXTENSION IF EXISTS "btree_gin" CASCADE;

-- Step 4: Recreate extensions
CREATE EXTENSION "uuid-ossp";
CREATE EXTENSION "pg_trgm";
CREATE EXTENSION "btree_gin";

-- Step 5: Verify everything is clean
SELECT 'Tables remaining: ' || COUNT(*) as status FROM pg_tables WHERE schemaname = 'public';
SELECT 'Types remaining: ' || COUNT(*) as status FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typtype = 'e';
SELECT 'Functions remaining: ' || COUNT(*) as status FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public';

-- =====================================================
-- RESET COMPLETE - Database is now completely clean
-- =====================================================

-- Now you can run the optimized-schema.sql file to create the new schema
-- The database is completely empty and ready for the new structure
