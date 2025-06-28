import { supabase, UserProfile, isSupabaseConfigured } from './supabase';

export class AuthService {
    /**
     * Register or login a user with their wallet address
     * This creates a user profile if it doesn't exist, or updates the last login if it does
     */
    static async authenticateWithWallet(walletAddress: string): Promise<UserProfile | null> {
        // Check if Supabase is configured
        if (!isSupabaseConfigured() || !supabase) {
            console.warn('Supabase is not configured. User authentication will be skipped.');
            return null;
        }

        try {
            // Check if user already exists
            const { data: existingUser, error: fetchError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('wallet_address', walletAddress)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                // PGRST116 is "not found" error, which is expected for new users
                console.error('Error fetching user:', fetchError);
                throw fetchError;
            }

            const now = new Date().toISOString();

            if (existingUser) {
                // User exists, update last login
                const { data: updatedUser, error: updateError } = await supabase
                    .from('user_profiles')
                    .update({
                        last_login: now,
                        updated_at: now
                    })
                    .eq('id', existingUser.id)
                    .select()
                    .single();

                if (updateError) {
                    console.error('Error updating user login:', updateError);
                    throw updateError;
                }

                console.log('✅ User logged in:', walletAddress);
                return updatedUser;
            } else {
                // New user, create profile
                const { data: newUser, error: createError } = await supabase
                    .from('user_profiles')
                    .insert({
                        wallet_address: walletAddress,
                        created_at: now,
                        updated_at: now,
                        last_login: now,
                        total_tokens_created: 0
                    })
                    .select()
                    .single();

                if (createError) {
                    console.error('Error creating user:', createError);
                    throw createError;
                }

                console.log('✅ New user registered:', walletAddress);
                return newUser;
            }
        } catch (error) {
            console.error('Authentication error:', error);
            return null;
        }
    }

    /**
     * Get user profile by wallet address
     */
    static async getUserProfile(walletAddress: string): Promise<UserProfile | null> {
        if (!isSupabaseConfigured() || !supabase) {
            console.warn('Supabase is not configured. User profile will be null.');
            return null;
        }

        try {
            const { data: user, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('wallet_address', walletAddress)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching user profile:', error);
                return null;
            }

            return user || null;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    }

    /**
     * Update user's token count
     */
    static async updateTokenCount(walletAddress: string, increment: number = 1): Promise<boolean> {
        try {
            const { error } = await supabase.rpc('increment_token_count', {
                wallet_addr: walletAddress,
                increment_by: increment
            });

            if (error) {
                console.error('Error updating token count:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error updating token count:', error);
            return false;
        }
    }

    /**
     * Log a token creation for a user
     */
    static async logTokenCreation(userProfile: UserProfile, tokenData: {
        mintAddress: string;
        tokenName: string;
        tokenSymbol: string;
        tokenDescription?: string;
        imageUri?: string;
        metadataUri?: string;
        transactionSignature?: string;
    }): Promise<boolean> {
        if (!isSupabaseConfigured() || !supabase) {
            console.warn('Supabase is not configured. Token creation logging will be skipped.');
            return false;
        }

        try {
            // Insert token record
            const { error: tokenError } = await supabase
                .from('user_tokens')
                .insert({
                    user_id: userProfile.id,
                    mint_address: tokenData.mintAddress,
                    token_name: tokenData.tokenName,
                    token_symbol: tokenData.tokenSymbol,
                    token_description: tokenData.tokenDescription,
                    image_uri: tokenData.imageUri,
                    metadata_uri: tokenData.metadataUri,
                    transaction_signature: tokenData.transactionSignature,
                    created_at: new Date().toISOString()
                });

            if (tokenError) {
                console.error('Error logging token creation:', tokenError);
                return false;
            }

            // Update user's total token count
            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({
                    total_tokens_created: userProfile.total_tokens_created + 1,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userProfile.id);

            if (updateError) {
                console.error('Error updating user token count:', updateError);
                return false;
            }

            console.log('✅ Token creation logged for user:', userProfile.wallet_address);
            return true;
        } catch (error) {
            console.error('Error logging token creation:', error);
            return false;
        }
    }

    /**
     * Get all tokens created by a user
     */
    static async getUserTokens(userProfile: UserProfile): Promise<any[]> {
        if (!isSupabaseConfigured() || !supabase) {
            console.warn('Supabase is not configured. User tokens will be empty.');
            return [];
        }

        try {
            const { data: tokens, error } = await supabase
                .from('user_tokens')
                .select('*')
                .eq('user_id', userProfile.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching user tokens:', error);
                return [];
            }

            return tokens || [];
        } catch (error) {
            console.error('Error fetching user tokens:', error);
            return [];
        }
    }
} 