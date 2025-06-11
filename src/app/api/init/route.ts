import { NextResponse } from 'next/server';
import { initializeApp, getInitializationStatus } from '../../../lib/startup';

/**
 * GET /api/init - Initialize the app services
 * This endpoint can be called during deployment or app startup
 */
export async function GET() {
    try {
        await initializeApp();

        return NextResponse.json({
            success: true,
            message: 'Application initialized successfully',
            initialized: getInitializationStatus(),
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Initialization failed',
            initialized: getInitializationStatus(),
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}

/**
 * POST /api/init - Force re-initialization
 */
export async function POST() {
    try {
        // Force re-initialization
        await initializeApp();

        return NextResponse.json({
            success: true,
            message: 'Application re-initialized successfully',
            initialized: getInitializationStatus(),
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Re-initialization failed',
            initialized: getInitializationStatus(),
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
} 