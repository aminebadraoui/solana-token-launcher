import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only create Supabase client if both URL and key are provided
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
    return !!(supabaseUrl && supabaseAnonKey);
};

// Database types for TypeScript
export interface UserProfile {
    id: string;
    wallet_address: string;
    created_at: string;
    updated_at: string;
    total_tokens_created: number;
    last_login: string;
    username?: string;
    email?: string;
}

export interface UserToken {
    id: string;
    user_id: string;
    mint_address: string;
    token_name: string;
    token_symbol: string;
    token_description?: string;
    image_uri?: string;
    metadata_uri?: string;
    created_at: string;
    transaction_signature?: string;
}

export interface UserWallet {
    id: string;
    user_id: string;
    name: string;
    public_key: string;
    encrypted_private_key: string;
    created_at: string;
    updated_at: string;
    is_active: boolean;
} 