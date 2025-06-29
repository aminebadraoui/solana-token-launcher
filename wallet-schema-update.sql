-- Wallet Management Schema Update
-- Run this if you already have the basic user_profiles and user_tokens tables

-- Create user_wallets table for multi-wallet management (only if it doesn't exist)
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

-- Create indexes for user_wallets (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_public_key ON user_wallets(public_key);
CREATE INDEX IF NOT EXISTS idx_user_wallets_active ON user_wallets(user_id, is_active);

-- Create trigger for user_wallets updated_at (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_wallets_updated_at') THEN
        CREATE TRIGGER update_user_wallets_updated_at 
            BEFORE UPDATE ON user_wallets
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create function to enforce wallet limit (replace if exists)
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
$$ LANGUAGE plpgsql;

-- Create trigger for wallet limit enforcement (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'enforce_wallet_limit') THEN
        CREATE TRIGGER enforce_wallet_limit
            BEFORE INSERT ON user_wallets
            FOR EACH ROW
            EXECUTE FUNCTION check_wallet_limit();
    END IF;
END $$;

-- Enable Row Level Security for user_wallets (only if not already enabled)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'user_wallets' 
        AND n.nspname = 'public' 
        AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policies for user_wallets (drop existing policies first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own wallets" ON user_wallets;
DROP POLICY IF EXISTS "Users can insert own wallets" ON user_wallets;
DROP POLICY IF EXISTS "Users can update own wallets" ON user_wallets;
DROP POLICY IF EXISTS "Users can delete own wallets" ON user_wallets;

-- Create new RLS policies
CREATE POLICY "Users can view own wallets" ON user_wallets
    FOR SELECT USING (true); -- Allow read access to all for now

CREATE POLICY "Users can insert own wallets" ON user_wallets
    FOR INSERT WITH CHECK (true); -- Allow insert for all for now

CREATE POLICY "Users can update own wallets" ON user_wallets
    FOR UPDATE USING (true); -- Allow update for all for now

CREATE POLICY "Users can delete own wallets" ON user_wallets
    FOR DELETE USING (true); -- Allow delete for all for now

-- Grant permissions for user_wallets
GRANT ALL ON user_wallets TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_wallet_limit TO anon, authenticated;

-- Success message
SELECT 'Wallet management schema update completed successfully!' as status; 