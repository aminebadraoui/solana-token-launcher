import { NextRequest, NextResponse } from 'next/server';
import { triggerManualRefresh, getRefreshStatus } from '../../../lib/backgroundRefresh';
import { clearCache, fetchAndCacheTokens } from '../../../lib/tokenCache';

/**
 * GET /api/refresh-cache - Get cache status and refresh information
 */
export async function GET() {
    try {
        const status = getRefreshStatus();

        return NextResponse.json({
            success: true,
            cache: status,
            timestamp: new Date().toISOString(),
            endpoints: {
                refresh: 'POST /api/refresh-cache - Trigger manual refresh',
                clear: 'DELETE /api/refresh-cache - Clear cache completely'
            }
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}

/**
 * POST /api/refresh-cache - Trigger manual cache refresh
 */
export async function POST(request: NextRequest) {
    try {
        const result = await triggerManualRefresh();

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: `Cache refreshed successfully with ${result.tokens} tokens`,
                tokens: result.tokens,
                timestamp: new Date().toISOString(),
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error,
                timestamp: new Date().toISOString(),
            }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}

/**
 * DELETE /api/refresh-cache - Clear cache completely
 */
export async function DELETE() {
    try {
        await clearCache();

        return NextResponse.json({
            success: true,
            message: 'Cache cleared successfully',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
} 