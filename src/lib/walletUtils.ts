/**
 * Wallet provider utilities for secure transaction signing
 * Helps resolve Phantom wallet "malicious app" warnings
 */

// Type definitions for Phantom provider
interface PhantomProvider {
    isPhantom: boolean;
    publicKey: any;
    isConnected: boolean;
    signTransaction: (transaction: any) => Promise<any>;
    signAndSendTransaction: (transaction: any) => Promise<{ signature: string }>;
    connect: () => Promise<{ publicKey: any }>;
    disconnect: () => Promise<void>;
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
 */
export function getPhantomProvider(): PhantomProvider | null {
    if (typeof window !== 'undefined' && window.phantom?.solana) {
        const provider = window.phantom.solana;
        return provider;
    }

    return null;
}

/**
 * Check if the current wallet is Phantom
 */
export function isPhantomWallet(): boolean {
    const provider = getPhantomProvider();
    return provider?.isPhantom === true;
}

/**
 * Check if the current wallet supports secure signing (signAndSendTransaction)
 */
export function supportsSecureSigning(): boolean {
    const provider = getPhantomProvider();
    return !!(provider && typeof provider.signAndSendTransaction === 'function');
}

/**
 * Get the current wallet type for logging/debugging
 */
export function getWalletType(): string {
    if (typeof window === 'undefined') {
        return 'server';
    }

    if (window.phantom?.solana?.isPhantom) {
        return 'phantom';
    }

    if (window.solflare) {
        return 'solflare';
    }

    if (window.coinbaseWalletExtension) {
        return 'coinbase';
    }

    return 'unknown';
}

/**
 * Check if we should use secure signing for the current wallet
 */
export function shouldUseSecureSigning(): boolean {
    return isPhantomWallet() && supportsSecureSigning();
}

/**
 * Log wallet detection information for debugging
 */
export function logWalletInfo(): void {
    const walletType = getWalletType();
    const isPhantom = isPhantomWallet();
    const supportsSecure = supportsSecureSigning();

    console.log('🔍 Wallet Detection Info:', {
        walletType,
        isPhantom,
        supportsSecureSigning: supportsSecure,
        shouldUseSecureSigning: shouldUseSecureSigning(),
        phantomAvailable: !!window.phantom?.solana,
        phantomConnected: window.phantom?.solana?.isConnected
    });
} 