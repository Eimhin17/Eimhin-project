-- Create the missing user profile for the existing Supabase Auth user
-- This will fix the login issue

-- First, let's get the Supabase Auth user ID
DO $$
DECLARE
    auth_user_id UUID;
    auth_user_email TEXT;
BEGIN
    -- Get the auth user details
    SELECT id, email INTO auth_user_id, auth_user_email
    FROM auth.users 
    WHERE email = '19-0120@stkieranscollege.ie';
    
    IF auth_user_id IS NOT NULL THEN
        -- Insert the user profile
        INSERT INTO users (
            id,
            email,
            school_email,
            school_email_verified,
            first_name,
            last_name,
            date_of_birth,
            gender,
            looking_for,
            relationship_intention,
            bio,
            discovery_source,
            push_notifications_enabled,
            privacy_policy_accepted,
            onboarding_completed,
            status,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            auth_user_id,
            auth_user_email,
            auth_user_email,
            false, -- school_email_verified
            'Test', -- first_name (placeholder)
            'User', -- last_name (placeholder)
            '2000-01-01', -- date_of_birth (placeholder)
            'woman', -- gender (placeholder)
            'go_to_someones_debs', -- looking_for (placeholder)
            'short_term_only', -- relationship_intention (placeholder)
            'Test bio', -- bio (placeholder)
            'manual_creation', -- discovery_source
            true, -- push_notifications_enabled
            false, -- privacy_policy_accepted
            false, -- onboarding_completed
            'active', -- status
            true, -- is_active
            NOW(), -- created_at
            NOW() -- updated_at
        );
        
        RAISE NOTICE 'User profile created successfully for auth user: %', auth_user_id;
    ELSE
        RAISE NOTICE 'No auth user found with email: 19-0120@stkieranscollege.ie';
    END IF;
END $$;

-- Verify the user profile was created
SELECT 
    id,
    email,
    first_name,
    last_name,
    created_at,
    status,
    is_active,
    school_email,
    school_email_verified
FROM users 
WHERE email = '19-0120@stkieranscollege.ie';
