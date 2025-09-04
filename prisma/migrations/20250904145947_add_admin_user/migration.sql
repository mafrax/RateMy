-- Add admin user for easy login
INSERT INTO users (
  id,
  email,
  username,
  password,
  "firstName",
  "lastName",
  "createdAt",
  "updatedAt"
) VALUES (
  'admin_user_id_001',
  'admin@ratemy.com',
  'admin',
  '$2a$10$qLQgD73NHYjIpSE0WoV/suAfjfRX1Ms8eyyJAG9gnJbDfwlNAiCt.',
  'Admin',
  'User',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;