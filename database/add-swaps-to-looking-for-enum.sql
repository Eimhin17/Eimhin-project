-- Add 'swaps' to the looking_for_type enum
-- This allows users to select "Swaps" as their debs preference

-- Add the new enum value
ALTER TYPE looking_for_type ADD VALUE 'swaps';

-- Verify the enum now has all three values
-- Expected values: 'go_to_someones_debs', 'bring_someone_to_my_debs', 'swaps'
SELECT unnest(enum_range(NULL::looking_for_type)) as enum_values;
