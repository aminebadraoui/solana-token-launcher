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

// Cache for wallet detection results to avoid repeated calls
let walletDetectionCache: {
    provider: PhantomProvider | null;
    walletType: string;
    isPhantom: boolean;
    supportsSecure: boolean;
    timestamp: number;
} | null = null;

const CACHE_DURATION = 1000; // 1 second cache

/**
 * Get cached wallet detection results or compute them fresh
 */
function getWalletDetection() {
    const now = Date.now();

    // Return cached results if still valid
    if (walletDetectionCache && (now - walletDetectionCache.timestamp) < CACHE_DURATION) {
        return walletDetectionCache;
    }

    // Compute fresh results
    const provider = (typeof window !== 'undefined' && window.phantom?.solana)
        ? window.phantom.solana
        : null;

    let walletType = 'unknown';
    if (typeof window !== 'undefined') {
        if (window.phantom?.solana?.isPhantom) {
            walletType = 'phantom';
        } else if (window.solflare) {
            walletType = 'solflare';
        } else if (window.coinbaseWalletExtension) {
            walletType = 'coinbase';
        }
    } else {
        walletType = 'server';
    }

    const isPhantom = provider?.isPhantom === true;
    const supportsSecure = !!(provider && typeof provider.signAndSendTransaction === 'function');

    // Cache the results
    walletDetectionCache = {
        provider,
        walletType,
        isPhantom,
        supportsSecure,
        timestamp: now
    };

    return walletDetectionCache;
}

/**
 * Get the Phantom wallet provider if available
 */
export function getPhantomProvider(): PhantomProvider | null {
    return getWalletDetection().provider;
}

/**
 * Check if the current wallet is Phantom
 */
export function isPhantomWallet(): boolean {
    return getWalletDetection().isPhantom;
}

/**
 * Check if the current wallet supports secure signing (signAndSendTransaction)
 */
export function supportsSecureSigning(): boolean {
    return getWalletDetection().supportsSecure;
}

/**
 * Get the current wallet type for logging/debugging
 */
export function getWalletType(): string {
    return getWalletDetection().walletType;
}

/**
 * Check if we should use secure signing for the current wallet
 */
export function shouldUseSecureSigning(): boolean {
    const detection = getWalletDetection();
    return detection.isPhantom && detection.supportsSecure;
}

/**
 * Log wallet detection information for debugging
 */
export function logWalletInfo(): void {
    const detection = getWalletDetection();

    console.log('🔍 Wallet Detection Info:', {
        walletType: detection.walletType,
        isPhantom: detection.isPhantom,
        supportsSecureSigning: detection.supportsSecure,
        shouldUseSecureSigning: detection.isPhantom && detection.supportsSecure,
        phantomAvailable: !!detection.provider,
        phantomConnected: detection.provider?.isConnected
    });
}

/**
 * Clear the wallet detection cache (useful for testing or wallet changes)
 */
export function clearWalletCache(): void {
    walletDetectionCache = null;
} 