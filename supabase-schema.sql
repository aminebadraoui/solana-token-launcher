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

-- Create user_wallets table for multi-wallet management
CREATE TABLE IF NOT EXISTS user_wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    public_key TEXT NOT NULL UNIQUE,
    encrypted_private_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT user_wallet_name_unique UNIQUE (user_id, name, is_active),
    CONSTRAINT wallet_name_length CHECK (length(name) >= 1 AND length(name) <= 50),
    CONSTRAINT public_key_format CHECK (length(public_key) >= 32)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet_address ON user_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_mint_address ON user_tokens(mint_address);
CREATE INDEX IF NOT EXISTS idx_user_tokens_created_at ON user_tokens(created_at);
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_public_key ON user_wallets(public_key);
CREATE INDEX IF NOT EXISTS idx_user_wallets_active ON user_wallets(user_id, is_active);

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

CREATE TRIGGER update_user_wallets_updated_at 
    BEFORE UPDATE ON user_wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to enforce wallet limit (max 10 active wallets per user)
CREATE OR REPLACE FUNCTION check_wallet_limit()
RETURNS TRIGGER AS $$
DECLARE
    wallet_count INTEGER;
BEGIN
    -- Only check on INSERT and when is_active is true
    IF TG_OP = 'INSERT' AND NEW.is_active = true THEN
        SELECT COUNT(*) INTO wallet_count
        FROM user_wallets
        WHERE user_id = NEW.user_id
        AND is_active = true;
        
        IF wallet_count >= 10 THEN
            RAISE EXCEPTION 'Maximum wallet limit (10) reached for user %', NEW.user_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for wallet limit enforcement
CREATE TRIGGER enforce_wallet_limit 
    BEFORE INSERT ON user_wallets 
    FOR EACH ROW 
    EXECUTE FUNCTION check_wallet_limit();

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;

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

-- Create RLS policies for user_wallets
-- Users can read their own wallets
CREATE POLICY "Users can view own wallets" ON user_wallets
    FOR SELECT USING (true); -- Allow read access to all for now

-- Users can insert their own wallets
CREATE POLICY "Users can insert own wallets" ON user_wallets
    FOR INSERT WITH CHECK (true); -- Allow insert for all for now

-- Users can update their own wallets
CREATE POLICY "Users can update own wallets" ON user_wallets
    FOR UPDATE USING (true); -- Allow update for all for now

-- Users can delete their own wallets
CREATE POLICY "Users can delete own wallets" ON user_wallets
    FOR DELETE USING (true); -- Allow delete for all for now

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
GRANT ALL ON user_wallets TO anon, authenticated;
GRANT SELECT ON user_stats TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_token_count TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_wallet_limit TO anon, authenticated;

-- Success message
SELECT 'Moonrush Token Creator database schema created successfully!' as status; 