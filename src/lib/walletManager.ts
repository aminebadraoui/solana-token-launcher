import { Keypair } from '@solana/web3.js';
import CryptoJS from 'crypto-js';
import { supabase, UserWallet } from './supabase';

// Environment variable for encryption key (should be set in .env.local)
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_WALLET_ENCRYPTION_KEY || 'default-key-change-in-production';

export interface ManagedWallet extends UserWallet {
    // Additional client-side properties can be added here if needed
}

export interface WalletCreationData {
    name: string;
    importPrivateKey?: string; // Optional for importing existing wallet
}

export class WalletManager {
    /**
     * Get user ID from wallet address
     */
    static async getUserIdFromWalletAddress(walletAddress: string): Promise<string | null> {
        if (!supabase) {
            console.warn('Supabase client not available. Cannot get user ID.');
            return null;
        }

        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('wallet_address', walletAddress)
                .single();

            if (error) {
                console.error('Error getting user ID:', error);
                return null;
            }

            return data?.id || null;
        } catch (error) {
            console.error('Error in getUserIdFromWalletAddress:', error);
            return null;
        }
    }

    /**
     * Generate a new Solana keypair
     */
    static generateKeypair(): Keypair {
        return Keypair.generate();
    }

    /**
     * Encrypt a private key using AES-256
     */
    static encryptPrivateKey(privateKeyArray: Uint8Array): string {
        try {
            const privateKeyString = JSON.stringify(Array.from(privateKeyArray));
            const encrypted = CryptoJS.AES.encrypt(privateKeyString, ENCRYPTION_KEY).toString();
            return encrypted;
        } catch (error) {
            console.error('Error encrypting private key:', error);
            throw new Error('Failed to encrypt private key');
        }
    }

    /**
     * Decrypt a private key from encrypted string
     */
    static decryptPrivateKey(encryptedPrivateKey: string): Uint8Array {
        try {
            const decryptedBytes = CryptoJS.AES.decrypt(encryptedPrivateKey, ENCRYPTION_KEY);
            const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);
            const privateKeyArray = JSON.parse(decryptedString);
            return new Uint8Array(privateKeyArray);
        } catch (error) {
            console.error('Error decrypting private key:', error);
            throw new Error('Failed to decrypt private key');
        }
    }

    /**
     * Create a new wallet for a user
     */
    static async createWallet(userWalletAddress: string, walletData: WalletCreationData): Promise<ManagedWallet | null> {
        if (!supabase) {
            console.warn('Supabase not configured. Creating wallet locally only.');

            // Generate keypair locally
            let keypair: Keypair;
            if (walletData.importPrivateKey) {
                try {
                    const privateKeyArray = JSON.parse(walletData.importPrivateKey);
                    keypair = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
                } catch (error) {
                    throw new Error('Invalid private key format');
                }
            } else {
                keypair = this.generateKeypair();
            }

            // Return a local wallet object (not persisted)
            const localWallet: ManagedWallet = {
                id: `local-${Date.now()}`,
                user_id: 'local-user',
                name: walletData.name,
                public_key: keypair.publicKey.toString(),
                encrypted_private_key: this.encryptPrivateKey(keypair.secretKey),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_active: true
            };

            return localWallet;
        }

        try {
            // Get user ID from wallet address
            const userId = await this.getUserIdFromWalletAddress(userWalletAddress);
            if (!userId) {
                throw new Error('User not found');
            }

            // Check if user has reached the limit (10 wallets)
            const { count, error: countError } = await supabase
                .from('user_wallets')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('is_active', true);

            if (countError) {
                console.error('Error checking wallet count:', countError);
                throw countError;
            }

            if (count && count >= 10) {
                throw new Error('Maximum wallet limit (10) reached');
            }

            // Check if wallet name already exists for this user
            const { data: existingWallets, error: nameCheckError } = await supabase
                .from('user_wallets')
                .select('id')
                .eq('user_id', userId)
                .eq('name', walletData.name)
                .eq('is_active', true);

            if (nameCheckError) {
                console.error('Error checking wallet name:', nameCheckError);
                throw nameCheckError;
            }

            if (existingWallets && existingWallets.length > 0) {
                throw new Error('Wallet with this name already exists');
            }

            let keypair: Keypair;

            // Generate or import keypair
            if (walletData.importPrivateKey) {
                try {
                    // Parse the imported private key
                    const privateKeyArray = JSON.parse(walletData.importPrivateKey);
                    keypair = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
                } catch (error) {
                    throw new Error('Invalid private key format');
                }
            } else {
                keypair = this.generateKeypair();
            }

            // Encrypt the private key
            const encryptedPrivateKey = this.encryptPrivateKey(keypair.secretKey);

            // Store in Supabase
            const { data, error } = await supabase
                .from('user_wallets')
                .insert({
                    user_id: userId,
                    name: walletData.name,
                    public_key: keypair.publicKey.toString(),
                    encrypted_private_key: encryptedPrivateKey,
                    is_active: true
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating wallet:', error);
                throw error;
            }

            return data as ManagedWallet;

        } catch (error) {
            console.error('Error in createWallet:', error);
            throw error;
        }
    }

    /**
     * Get all wallets for a user
     */
    static async getUserWallets(userWalletAddress: string): Promise<ManagedWallet[]> {
        if (!supabase) {
            console.warn('Supabase client not available. Cannot retrieve wallets.');
            return [];
        }

        try {
            // Get user ID from wallet address
            const userId = await this.getUserIdFromWalletAddress(userWalletAddress);
            if (!userId) {
                return [];
            }

            const { data, error } = await supabase
                .from('user_wallets')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching wallets:', error);
                throw error;
            }

            return data as ManagedWallet[];

        } catch (error) {
            console.error('Error in getUserWallets:', error);
            throw error;
        }
    }

    /**
     * Delete a wallet (soft delete by setting is_active to false)
     */
    static async deleteWallet(userWalletAddress: string, walletId: string): Promise<boolean> {
        if (!supabase) {
            console.warn('Supabase client not available. Cannot delete wallet.');
            return false;
        }

        try {
            // Get user ID from wallet address
            const userId = await this.getUserIdFromWalletAddress(userWalletAddress);
            if (!userId) {
                return false;
            }

            const { error } = await supabase
                .from('user_wallets')
                .update({ is_active: false, updated_at: new Date().toISOString() })
                .eq('id', walletId)
                .eq('user_id', userId);

            if (error) {
                console.error('Error deleting wallet:', error);
                throw error;
            }

            return true;

        } catch (error) {
            console.error('Error in deleteWallet:', error);
            throw error;
        }
    }

    /**
     * Get a wallet's private key (decrypted)
     */
    static async getWalletPrivateKey(userWalletAddress: string, walletId: string): Promise<Uint8Array | null> {
        if (!supabase) {
            console.warn('Supabase client not available. Cannot retrieve private key.');
            return null;
        }

        try {
            // Get user ID from wallet address
            const userId = await this.getUserIdFromWalletAddress(userWalletAddress);
            if (!userId) {
                return null;
            }

            const { data, error } = await supabase
                .from('user_wallets')
                .select('encrypted_private_key')
                .eq('id', walletId)
                .eq('user_id', userId)
                .eq('is_active', true)
                .single();

            if (error) {
                console.error('Error fetching wallet private key:', error);
                throw error;
            }

            return this.decryptPrivateKey(data.encrypted_private_key);

        } catch (error) {
            console.error('Error in getWalletPrivateKey:', error);
            throw error;
        }
    }

    /**
     * Export wallet data (without private key for security)
     */
    static async exportWalletData(userWalletAddress: string, walletId: string): Promise<any> {
        if (!supabase) {
            console.warn('Supabase client not available. Cannot export wallet.');
            return null;
        }

        try {
            // Get user ID from wallet address
            const userId = await this.getUserIdFromWalletAddress(userWalletAddress);
            if (!userId) {
                return null;
            }

            const { data, error } = await supabase
                .from('user_wallets')
                .select('name, public_key, created_at')
                .eq('id', walletId)
                .eq('user_id', userId)
                .eq('is_active', true)
                .single();

            if (error) {
                console.error('Error exporting wallet:', error);
                throw error;
            }

            return {
                name: data.name,
                publicKey: data.public_key,
                createdAt: data.created_at,
                exportedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error in exportWalletData:', error);
            throw error;
        }
    }

    /**
     * Update wallet name
     */
    static async updateWalletName(userWalletAddress: string, walletId: string, newName: string): Promise<boolean> {
        if (!supabase) {
            console.warn('Supabase client not available. Cannot update wallet.');
            return false;
        }

        try {
            // Get user ID from wallet address
            const userId = await this.getUserIdFromWalletAddress(userWalletAddress);
            if (!userId) {
                return false;
            }

            // Check if name already exists for this user
            const { data: existingWallets, error: nameCheckError } = await supabase
                .from('user_wallets')
                .select('id')
                .eq('user_id', userId)
                .eq('name', newName)
                .eq('is_active', true)
                .neq('id', walletId);

            if (nameCheckError) {
                console.error('Error checking wallet name:', nameCheckError);
                throw nameCheckError;
            }

            if (existingWallets && existingWallets.length > 0) {
                throw new Error('Wallet with this name already exists');
            }

            const { error } = await supabase
                .from('user_wallets')
                .update({ name: newName, updated_at: new Date().toISOString() })
                .eq('id', walletId)
                .eq('user_id', userId);

            if (error) {
                console.error('Error updating wallet name:', error);
                throw error;
            }

            return true;

        } catch (error) {
            console.error('Error in updateWalletName:', error);
            throw error;
        }
    }

    /**
     * Validate wallet limit for a user
     */
    static async canCreateWallet(userWalletAddress: string): Promise<{ canCreate: boolean; currentCount: number; maxCount: 10 }> {
        // Try to use Supabase directly instead of relying on isSupabaseConfigured check
        if (!supabase) {
            console.warn('Supabase client not available');
            return { canCreate: false, currentCount: 0, maxCount: 10 };
        }

        try {
            // Get user ID from wallet address
            const userId = await this.getUserIdFromWalletAddress(userWalletAddress);
            if (!userId) {
                return { canCreate: false, currentCount: 0, maxCount: 10 };
            }

            const { count, error } = await supabase
                .from('user_wallets')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('is_active', true);

            if (error) {
                console.error('Error checking wallet limit:', error);
                throw error;
            }

            const currentCount = count || 0;
            const maxCount = 10;

            return {
                canCreate: currentCount < maxCount,
                currentCount,
                maxCount
            };

        } catch (error) {
            console.error('Error in canCreateWallet:', error);
            return { canCreate: false, currentCount: 0, maxCount: 10 };
        }
    }
} 