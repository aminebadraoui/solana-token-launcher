/**
 * Feature flags utility for controlling application features via environment variables
 */

/**
 * Check if the trending/clone token feature should be shown in navigation
 * Defaults to enabled in development, disabled in production
 */
export function shouldShowTrendingFeature(): boolean {
    const enableTrending = process.env.NEXT_PUBLIC_ENABLE_TRENDING_FEATURE;
    const isDevelopment = process.env.NODE_ENV === 'development';

    // In development, show by default unless explicitly disabled
    if (isDevelopment) {
        return enableTrending !== 'false';
    }

    // In production, hide by default unless explicitly enabled
    return enableTrending === 'true';
}

/**
 * Check if service fees should be charged based on environment variable
 * When ENABLE_CHARGE is false in development, skip service fee transactions
 */
export function shouldChargeServiceFees(): boolean {
    const enableCharge = process.env.NEXT_PUBLIC_ENABLE_CHARGE;
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Debug logging for production troubleshooting
    console.log('🏁 Service Fee Check:', {
        environment: process.env.NODE_ENV,
        isDevelopment,
        enableChargeEnvVar: enableCharge,
        enableChargeType: typeof enableCharge
    });

    // In development, only charge if explicitly enabled
    if (isDevelopment) {
        const result = enableCharge === 'true';
        console.log(`🔧 Development mode: Service fees ${result ? 'ENABLED' : 'DISABLED'}`);
        return result;
    }

    // In production, always charge unless explicitly disabled
    const result = enableCharge !== 'false';
    console.log(`🔧 Production mode: Service fees ${result ? 'ENABLED' : 'DISABLED'}`);
    return result;
}

/**
 * Log current feature flag states (useful for debugging)
 */
export function logFeatureFlags(): void {
    console.log('🏁 Feature Flags Status:', {
        trending: shouldShowTrendingFeature(),
        charging: shouldChargeServiceFees(),
        environment: process.env.NODE_ENV
    });
} 