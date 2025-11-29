-- Test query to verify social links are saving correctly
-- Run this after updating your profile to check if data is persisting

-- Show all users with their social links
SELECT
    username,
    display_name,
    twitter,
    instagram,
    website,
    CASE
        WHEN twitter IS NOT NULL THEN '✅'
        ELSE '❌'
    END as has_twitter,
    CASE
        WHEN instagram IS NOT NULL THEN '✅'
        ELSE '❌'
    END as has_instagram,
    CASE
        WHEN website IS NOT NULL THEN '✅'
        ELSE '❌'
    END as has_website,
    updated_at
FROM users
ORDER BY updated_at DESC
LIMIT 10;

-- Count users with social links
SELECT
    COUNT(*) as total_users,
    COUNT(twitter) as users_with_twitter,
    COUNT(instagram) as users_with_instagram,
    COUNT(website) as users_with_website,
    ROUND(COUNT(twitter)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2) as twitter_percentage,
    ROUND(COUNT(instagram)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2) as instagram_percentage,
    ROUND(COUNT(website)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2) as website_percentage
FROM users;

-- Show your specific user (replace 'your_username' with your actual username)
-- Uncomment and replace the username to test your specific account
/*
SELECT
    username,
    display_name,
    twitter,
    instagram,
    website,
    cover_url,
    avatar_url,
    bio,
    updated_at
FROM users
WHERE username = 'your_username';
*/
