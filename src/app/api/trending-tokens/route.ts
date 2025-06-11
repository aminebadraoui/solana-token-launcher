import { NextRequest, NextResponse } from 'next/server';
import { getTokensWithSmartRefresh } from '../../../lib/tokenCache';

interface PumpFunToken {
    mintAddress: string;
    name: string;
    symbol: string;
    description?: string;
    imageUri?: string;
    metadataUri?: string;
    price: number;
    priceInUSD: number;
    marketCap: number;
    graduationProgress: number;
    creationTime: string;
}

// Constants from the original API
const GRADUATION_THRESHOLD_USD = 69000;

export async function GET(request: Request) {
    try {
        // Parse pagination parameters from URL
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        console.log(`🚀 Fetching trending tokens (cached) - Page ${page}, Limit ${limit}...`);

        // Use the cached version instead of direct BitQuery calls
        const allCandidates = await getTokensWithSmartRefresh();

        console.log(`✅ Retrieved ${allCandidates.length} tokens from cache`);

        // Apply pagination to cached results
        const totalTokens = allCandidates.length;
        const totalPages = Math.ceil(totalTokens / limit);
        const paginatedTokens = allCandidates.slice(offset, offset + limit);
        const hasNextPage = page < totalPages;
        const hasPreviousPage = page > 1;

        return NextResponse.json({
            success: true,
            graduatingTokens: paginatedTokens,
            pagination: {
                currentPage: page,
                limit,
                totalTokens,
                totalPages,
                hasNextPage,
                hasPreviousPage,
                nextPage: hasNextPage ? page + 1 : null,
                previousPage: hasPreviousPage ? page - 1 : null
            },
            cached: true,
            timestamp: new Date().toISOString(),
            message: `Found ${totalTokens} tokens total, showing page ${page} (${paginatedTokens.length} tokens)`,
            graduationThreshold: GRADUATION_THRESHOLD_USD,
            explanation: 'Tokens with market cap between $30,000 and $68,000 - trending tokens with momentum but not too close to graduation',
            dataSource: 'Redis Cache + BitQuery v2 Pump.fun API with OAuth2',
        });

    } catch (error) {
        console.error('Error in trending-tokens API:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch trending tokens',
            graduatingTokens: [],
            pagination: {
                currentPage: 1,
                limit: 20,
                totalTokens: 0,
                totalPages: 0,
                hasNextPage: false,
                hasPreviousPage: false,
                nextPage: null,
                previousPage: null
            },
            cached: false,
            timestamp: new Date().toISOString(),
            message: 'API temporarily unavailable',
            graduationThreshold: GRADUATION_THRESHOLD_USD,
            explanation: 'Error occurred while fetching trending tokens',
            dataSource: 'Redis Cache + BitQuery v2 Pump.fun API with OAuth2',
        }, { status: 500 });
    }
} 