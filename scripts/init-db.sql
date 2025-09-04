-- Database initialization script
-- This runs when the PostgreSQL container first starts up

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE ratemy_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ratemy_db');

-- Connect to the database
\c ratemy_db;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Database ratemy_db initialized successfully at %', NOW();
END
$$;