-- Moonrush Token Creator - Supabase Database Schema
-- Run this script in your Supabase SQL editor to set up the required tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_address TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_tokens_created INTEGER DEFAULT 0,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    username TEXT,
    email TEXT,
    CONSTRAINT wallet_address_format CHECK (length(wallet_address) >= 32)
);

-- Create user_tokens table
CREATE TABLE IF NOT EXISTS user_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    mint_address TEXT NOT NULL,
    token_name TEXT NOT NULL,
    token_symbol TEXT NOT NULL,
    token_description TEXT,
    image_uri TEXT,
    metadata_uri TEXT,
    transaction_signature TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT mint_address_format CHECK (length(mint_address) >= 32)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet_address ON user_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_mint_address ON user_tokens(mint_address);
CREATE INDEX IF NOT EXISTS idx_user_tokens_created_at ON user_tokens(created_at);

-- Create a function to increment token count
CREATE OR REPLACE FUNCTION increment_token_count(wallet_addr TEXT, increment_by INTEGER DEFAULT 1)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE user_profiles 
    SET total_tokens_created = total_tokens_created + increment_by,
        updated_at = NOW()
    WHERE wallet_address = wallet_addr;
END;
$$;

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (true); -- Allow read access to all for now, can be restricted later

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (true); -- Allow insert for all for now

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (true); -- Allow update for all for now

-- Create RLS policies for user_tokens
-- Users can read their own tokens
CREATE POLICY "Users can view own tokens" ON user_tokens
    FOR SELECT USING (true); -- Allow read access to all for now

-- Users can insert their own tokens
CREATE POLICY "Users can insert own tokens" ON user_tokens
    FOR INSERT WITH CHECK (true); -- Allow insert for all for now

-- Create a view for user statistics
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    up.id,
    up.wallet_address,
    up.username,
    up.created_at as user_since,
    up.last_login,
    up.total_tokens_created,
    COUNT(ut.id) as actual_token_count,
    COALESCE(SUM(CASE WHEN ut.created_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END), 0) as tokens_last_7_days,
    COALESCE(SUM(CASE WHEN ut.created_at >= NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END), 0) as tokens_last_30_days
FROM user_profiles up
LEFT JOIN user_tokens ut ON up.id = ut.user_id
GROUP BY up.id, up.wallet_address, up.username, up.created_at, up.last_login, up.total_tokens_created;

-- Insert some example data (optional - remove in production)
-- INSERT INTO user_profiles (wallet_address, username) VALUES 
-- ('11111111111111111111111111111112', 'example_user');

-- Grant necessary permissions (adjust as needed for your security model)
-- These are permissive for development - tighten for production
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON user_profiles TO anon, authenticated;
GRANT ALL ON user_tokens TO anon, authenticated;
GRANT SELECT ON user_stats TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_token_count TO anon, authenticated;

-- Success message
SELECT 'Moonrush Token Creator database schema created successfully!' as status; 