-- Add isAdmin field to users table
ALTER TABLE "users" ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Set the existing admin user as admin
UPDATE "users" SET "isAdmin" = true WHERE email = 'admin@ratemy.com';