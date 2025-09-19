-- Master Script: Populate All Schools
-- This script runs all the school population scripts in the correct order
-- Run this after creating the schools table

-- First, create the schools table
\i create-schools-table.sql

-- Then populate with schools by county
\i populate-schools-carlow-cavan-clare.sql
\i populate-schools-cork.sql
\i populate-schools-remaining-counties.sql
\i populate-schools-final-counties.sql

-- Verify the data
SELECT 
    county,
    COUNT(*) as school_count
FROM schools 
GROUP BY county 
ORDER BY county;

-- Show total count
SELECT COUNT(*) as total_schools FROM schools;

-- Show sample data
SELECT * FROM schools LIMIT 10;



























