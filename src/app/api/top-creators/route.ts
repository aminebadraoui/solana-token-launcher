import { NextRequest, NextResponse } from 'next/server';

interface BitQueryCreator {
    tokens_count: number;
    Transaction: {
        Signer: string;
    };
}

interface TopCreator {
    address: string;
    tokensCreated: number;
    rank: number;
}

// Cache for the top creators data (30 minutes)
let cachedCreators: TopCreator[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// BitQuery credentials (same as tokenCache.ts)
const BITQUERY_ACCESS_TOKEN = process.env.BITQUERY_ACCESS_TOKEN || 'ory_at_3XBBGH7f1z0wBI7_ueBK1D_f6Nix5XNC0Qwsyi28zB0.yEmm-5awerx55EK6JEAVnHF7m8pNZ2KONZPDdW2ptwM';

/**
 * Get BitQuery OAuth token
 */
async function getBitQueryOAuthToken(): Promise<string> {
    return BITQUERY_ACCESS_TOKEN;
}

/**
 * Fetch top pump.fun creators from BitQuery API
 */
async function fetchTopCreatorsFromBitQuery(): Promise<TopCreator[]> {
    console.log('🌐 Fetching top pump.fun creators from BitQuery...');

    const accessToken = await getBitQueryOAuthToken();

    const query = `
        query TopPumpFunCreators {
            Solana {
                Instructions(
                    where: {
                        Instruction: {
                            Program: { Name: { is: "pump" }, Method: { is: "create" } }
                        }
                    }
                    orderBy: { descendingByField: "tokens_count" }
                    limit: { count: 100 }
                ) {
                    tokens_count: count
                    Transaction {
                        Signer
                    }
                }
            }
        }
    `;

    const response = await fetch('https://streaming.bitquery.io/eap', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ query }),
    });

    if (!response.ok) {
        console.error('BitQuery API error:', response.status, response.statusText);
        throw new Error(`BitQuery API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
        console.error('BitQuery GraphQL errors:', JSON.stringify(data.errors, null, 2));
        throw new Error(`GraphQL query failed: ${data.errors[0]?.message || 'Unknown error'}`);
    }

    const creators = data.data?.Solana?.Instructions || [];

    // Transform to our format
    const topCreators: TopCreator[] = creators
        .map((creator: BitQueryCreator, index: number) => ({
            address: creator.Transaction.Signer,
            tokensCreated: parseInt(creator.tokens_count.toString()) || 0,
            rank: index + 1,
        }))
        .filter((creator: TopCreator) => creator.address && creator.tokensCreated > 0) // Filter out invalid entries
        .slice(0, 50); // Take top 50

    console.log(`✅ Fetched ${topCreators.length} top creators from BitQuery`);
    return topCreators;
}

export async function GET() {
    try {
        const now = Date.now();

        // Check cache first
        if (cachedCreators.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
            console.log(`📦 Returning cached top creators data (${cachedCreators.length} entries)`);
            return NextResponse.json({
                success: true,
                creators: cachedCreators,
                cached: true,
                timestamp: cacheTimestamp,
            });
        }

        // Fetch fresh data
        const creators = await fetchTopCreatorsFromBitQuery();

        // Update cache
        cachedCreators = creators;
        cacheTimestamp = now;

        return NextResponse.json({
            success: true,
            creators,
            cached: false,
            timestamp: now,
            count: creators.length,
        });

    } catch (error) {
        console.error('Error in top creators API:', error);

        return NextResponse.json({
            success: false,
            error: 'Failed to fetch top creators data',
            creators: [],
        }, { status: 500 });
    }
} 