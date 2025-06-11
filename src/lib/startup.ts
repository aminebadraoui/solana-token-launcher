import { initializeCache } from './tokenCache';
import { initializeBackgroundRefresh } from './backgroundRefresh';

let isInitialized = false;

/**
 * Initialize all startup services once
 */
export async function initializeApp(): Promise<void> {
    if (isInitialized) {
        console.log('✅ App already initialized');
        return;
    }

    try {
        console.log('🚀 Initializing Solana Token Launcher...');

        // Initialize cache system
        await initializeCache();

        // Initialize background refresh (only in production or when forced)
        initializeBackgroundRefresh();

        isInitialized = true;
        console.log('✅ App initialization complete');

    } catch (error) {
        console.error('❌ App initialization failed:', error);
        // Don't throw - let the app continue without caching
    }
}

/**
 * Get initialization status
 */
export function getInitializationStatus(): boolean {
    return isInitialized;
} 