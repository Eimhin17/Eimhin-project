SELECT id, username, photos FROM profiles WHERE photos IS NOT NULL AND array_length(photos, 1) > 0 LIMIT 3;
