/**
 * Wallet provider utilities for secure transaction signing
 * Following Phantom's official example patterns
 * Helps resolve Phantom wallet "malicious app" warnings
 */

import { PublicKey } from '@solana/web3.js';

// Type definitions for Phantom provider (matching official example)
export interface PhantomProvider {
    isPhantom: boolean;
    publicKey: PublicKey | null;
    isConnected: boolean;
    signTransaction: (transaction: any) => Promise<any>;
    signAndSendTransaction: (transaction: any) => Promise<{ signature: string }>;
    signAllTransactions: (transactions: any[]) => Promise<any[]>;
    signMessage: (message: Uint8Array | string) => Promise<{ signature: Uint8Array; publicKey: PublicKey }>;
    connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
    disconnect: () => Promise<void>;
    on: (event: string, callback: (...args: any[]) => void) => void;
    removeListener: (event: string, callback: (...args: any[]) => void) => void;
}

declare global {
    interface Window {
        phantom?: {
            solana?: PhantomProvider;
        };
        solflare?: any;
        coinbaseWalletExtension?: any;
    }
}

/**
 * Get the Phantom wallet provider if available
 * Following Phantom's official example pattern
 */
export function getProvider(): PhantomProvider | null {
    if (typeof window !== 'undefined' && window.phantom?.solana) {
        return window.phantom.solana;
    }
    return null;
}

/**
 * Check if Phantom wallet is available
 */
export function isPhantomAvailable(): boolean {
    return !!getProvider();
}

/**
 * Check if the current wallet is Phantom and connected
 */
export function isPhantomConnected(): boolean {
    const provider = getProvider();
    return provider?.isConnected === true;
}

/**
 * Check if the current wallet supports secure signing (signAndSendTransaction)
 */
export function supportsSecureSigning(): boolean {
    const provider = getProvider();
    return !!(provider && typeof provider.signAndSendTransaction === 'function');
}

/**
 * Check if we should use secure signing for the current wallet
 */
export function shouldUseSecureSigning(): boolean {
    const provider = getProvider();
    return provider?.isPhantom === true && provider?.isConnected === true && supportsSecureSigning();
}

/**
 * Get the Phantom wallet provider (alias for compatibility)
 */
export const getPhantomProvider = getProvider;

/**
 * Check if the current wallet is Phantom (alias for compatibility)
 */
export function isPhantomWallet(): boolean {
    return isPhantomAvailable();
}

/**
 * Get the current wallet type for logging/debugging
 */
export function getWalletType(): string {
    if (typeof window === 'undefined') return 'server';

    if (window.phantom?.solana?.isPhantom) {
        return 'phantom';
    } else if (window.solflare) {
        return 'solflare';
    } else if (window.coinbaseWalletExtension) {
        return 'coinbase';
    }
    return 'unknown';
}

/**
 * Log wallet detection information for debugging
 * Following Phantom's official example logging patterns
 */
export function logWalletInfo(): void {
    const provider = getProvider();

    console.log('🔍 Wallet Detection Info:', {
        walletType: getWalletType(),
        phantomAvailable: isPhantomAvailable(),
        phantomConnected: isPhantomConnected(),
        supportsSecureSigning: supportsSecureSigning(),
        shouldUseSecureSigning: shouldUseSecureSigning(),
        publicKey: provider?.publicKey?.toString() || 'Not connected'
    });
}

/**
 * Setup Phantom wallet event listeners (following official example)
 * Call this in your app initialization
 */
export function setupPhantomEventListeners(
    onConnect?: (publicKey: PublicKey) => void,
    onDisconnect?: () => void,
    onAccountChanged?: (publicKey: PublicKey | null) => void
): () => void {
    const provider = getProvider();

    if (!provider) {
        console.warn('⚠️ Phantom provider not available for event listeners');
        return () => { }; // Return empty cleanup function
    }

    // Event handlers
    const handleConnect = (publicKey: PublicKey) => {
        console.log('✅ Phantom connected:', publicKey.toString());
        onConnect?.(publicKey);
    };

    const handleDisconnect = () => {
        console.log('👋 Phantom disconnected');
        onDisconnect?.();
    };

    const handleAccountChanged = (publicKey: PublicKey | null) => {
        if (publicKey) {
            console.log('🔄 Phantom account changed:', publicKey.toString());
        } else {
            console.log('🔄 Phantom account changed: attempting to reconnect...');
            // Attempt to reconnect as per official example
            provider.connect({ onlyIfTrusted: true }).catch(() => {
                console.log('❌ Failed to reconnect to Phantom');
            });
        }
        onAccountChanged?.(publicKey);
    };

    // Register event listeners
    provider.on('connect', handleConnect);
    provider.on('disconnect', handleDisconnect);
    provider.on('accountChanged', handleAccountChanged);

    // Return cleanup function
    return () => {
        provider.removeListener('connect', handleConnect);
        provider.removeListener('disconnect', handleDisconnect);
        provider.removeListener('accountChanged', handleAccountChanged);
    };
}

/**
 * Attempt to connect to Phantom wallet
 * Following official example patterns
 */
export async function connectPhantom(onlyIfTrusted = false): Promise<PublicKey | null> {
    const provider = getProvider();

    if (!provider) {
        throw new Error('Phantom wallet not found. Please install Phantom wallet extension.');
    }

    try {
        const response = await provider.connect({ onlyIfTrusted });
        console.log('✅ Connected to Phantom:', response.publicKey.toString());
        return response.publicKey;
    } catch (error: any) {
        console.error('❌ Failed to connect to Phantom:', error.message);
        throw error;
    }
}

/**
 * Disconnect from Phantom wallet
 */
export async function disconnectPhantom(): Promise<void> {
    const provider = getProvider();

    if (!provider) {
        return; // Already disconnected
    }

    try {
        await provider.disconnect();
        console.log('👋 Disconnected from Phantom');
    } catch (error: any) {
        console.error('❌ Failed to disconnect from Phantom:', error.message);
        throw error;
    }
} 