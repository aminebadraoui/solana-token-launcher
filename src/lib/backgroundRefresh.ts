import { fetchAndCacheTokens } from './tokenCache';

// Background refresh configuration
const REFRESH_INTERVAL = 14 * 60 * 1000; // 14 minutes (before 15min TTL expires)

let refreshInterval: NodeJS.Timeout | null = null;
let isRefreshActive = false;

/**
 * Start the background refresh process
 */
export function startBackgroundRefresh(): void {
    if (isRefreshActive) {
        console.log('⚠️ Background refresh already active');
        return;
    }

    console.log('🔄 Starting background token refresh (every 14 minutes)');

    // Refresh immediately on start
    refreshTokensInBackground();

    // Set up interval for future refreshes
    refreshInterval = setInterval(() => {
        refreshTokensInBackground();
    }, REFRESH_INTERVAL);

    isRefreshActive = true;
}

/**
 * Stop the background refresh process
 */
export function stopBackgroundRefresh(): void {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
        isRefreshActive = false;
        console.log('🛑 Background refresh stopped');
    }
}

/**
 * Perform background token refresh with error handling
 */
async function refreshTokensInBackground(): Promise<void> {
    try {
        console.log('🔄 Background refresh starting...');
        const startTime = Date.now();

        const tokens = await fetchAndCacheTokens();

        const duration = Date.now() - startTime;
        console.log(`✅ Background refresh completed in ${duration}ms - cached ${tokens.length} tokens`);

    } catch (error) {
        console.error('❌ Background refresh failed:', error);
        // Don't stop the interval - just log the error and try again next time
    }
}

/**
 * Get refresh status for monitoring
 */
export function getRefreshStatus(): {
    isActive: boolean;
    intervalMs: number;
    nextRefreshIn?: number;
} {
    const status = {
        isActive: isRefreshActive,
        intervalMs: REFRESH_INTERVAL,
    };

    // If active, calculate time until next refresh
    if (isRefreshActive && refreshInterval) {
        // This is approximate since we don't track the exact start time
        // In a production system, you might want to track this more precisely
        return status;
    }

    return status;
}

/**
 * Manual refresh trigger (useful for testing or admin endpoints)
 */
export async function triggerManualRefresh(): Promise<{ success: boolean; tokens?: number; error?: string }> {
    try {
        console.log('🔄 Manual refresh triggered');
        const tokens = await fetchAndCacheTokens();
        return { success: true, tokens: tokens.length };
    } catch (error) {
        console.error('❌ Manual refresh failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Initialize background refresh on module load (for production)
 * Only starts if not in development mode or explicitly enabled
 */
export function initializeBackgroundRefresh(): void {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const forceBackground = process.env.FORCE_BACKGROUND_REFRESH === 'true';

    if (!isDevelopment || forceBackground) {
        console.log('🚀 Initializing background refresh service');
        startBackgroundRefresh();

        // Graceful shutdown handling
        process.on('SIGTERM', () => {
            console.log('📤 SIGTERM received, stopping background refresh');
            stopBackgroundRefresh();
        });

        process.on('SIGINT', () => {
            console.log('📤 SIGINT received, stopping background refresh');
            stopBackgroundRefresh();
        });
    } else {
        console.log('🔧 Development mode: background refresh disabled (set FORCE_BACKGROUND_REFRESH=true to enable)');
    }
} 