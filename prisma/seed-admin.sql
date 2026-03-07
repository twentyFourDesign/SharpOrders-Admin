-- Test admin account (for local/dev only — remove or change in production)
-- Email: admin@sharporder.test
-- Password: admin123

INSERT INTO admins (
  id,
  email,
  password_hash,
  name,
  is_super_admin,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@sharporder.test',
  '$2a$12$4N75EnUwOHLSKY8YhaMSEOYOHf2TRqE4LyFCrzwcEAc3gSoWxmqji',
  'Test Admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
