import { NextRequest, NextResponse } from 'next/server';

interface BitQueryToken {
    Trade: {
        Buy: {
            Price: number;
            PriceInUSD: number;
            Currency: {
                Name: string;
                Symbol: string;
                MintAddress: string;
                Decimals: number;
                Fungible: boolean;
                Uri: string;
            };
        };
    };
    Block: {
        Time: string;
    };
    joinTokenSupplyUpdates?: {
        Block: {
            Time: string;
        };
        Transaction: {
            Dev: string;
        };
        TokenSupplyUpdate: {
            Currency: {
                Symbol: string;
                Name: string;
                MintAddress: string;
                Uri: string;
                MetadataAddress: string;
                Decimals: number;
                Fungible: boolean;
            };
        };
    }[];
}

interface PumpFunToken {
    mintAddress: string;
    name: string;
    symbol: string;
    description?: string;
    imageUri?: string;
    price: number;
    priceInUSD: number;
    marketCap: number;
    graduationProgress: number;
    creationTime: string;
}

// Pump.fun graduation mechanics:
// Tokens graduate to Raydium when they reach ~$69K market cap
// With 1B supply (1,000,000,000 tokens), this happens at ~$0.000069 per token
const GRADUATION_THRESHOLD_USD = 69000;
const PUMP_TOKEN_SUPPLY = 1000000000; // 1 billion tokens (standard pump.fun supply)
const GRADUATION_PRICE_USD = GRADUATION_THRESHOLD_USD / PUMP_TOKEN_SUPPLY; // ~0.000069

// BitQuery OAuth2 credentials
const BITQUERY_CLIENT_ID = process.env.BITQUERY_CLIENT_ID || '6c50cf84-387c-4a7b-9466-aa8c5aba8d4a';
const BITQUERY_CLIENT_SECRET = process.env.BITQUERY_CLIENT_SECRET || 'AqYKzE5WQyKsQqb7BJps-6AWBX';

// Direct access token provided by user
const BITQUERY_ACCESS_TOKEN = process.env.BITQUERY_ACCESS_TOKEN || 'ory_at_3XBBGH7f1z0wBI7_ueBK1D_f6Nix5XNC0Qwsyi28zB0.yEmm-5awerx55EK6JEAVnHF7m8pNZ2KONZPDdW2ptwM';

// Cache for OAuth token (valid for 1 hour)
let cachedOAuthToken: string | null = null;
let tokenExpirationTime: number = 0;

async function getBitQueryOAuthToken(): Promise<string> {
    // Use the provided access token directly
    return BITQUERY_ACCESS_TOKEN;
}

// Cache for trending tokens (5 minutes)
let cachedTokens: PumpFunToken[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch tokens about to graduate from pump.fun using BitQuery API
 */
async function fetchGraduatingTokens(): Promise<PumpFunToken[]> {
    try {
        console.log('🚀 Fetching trending tokens ($30K-$68K market cap) from pump.fun...');

        // Get OAuth2 token first
        const accessToken = await getBitQueryOAuthToken();

        // Query for pump.fun tokens using official BitQuery patterns for better efficiency
        // Based on: https://docs.bitquery.io/docs/examples/Solana/Pump-Fun-API/#top-pump-fun-tokens-by-market-cap
        const query = `
          query {
            Solana {
              DEXTrades(
                limitBy: { by: Trade_Buy_Currency_MintAddress, count: 1 }
                limit: { count: 200 }
                orderBy: { descending: Block_Time }
                where: {
                  Trade: {
                    Dex: { ProtocolName: { is: "pump" } }
                    Buy: {
                      Currency: {
                        MintAddress: { notIn: ["11111111111111111111111111111111"] }
                      }
                      PriceInUSD: { gt: 0.00001 }
                    }
                    Sell: { AmountInUSD: { gt: "10" } }
                  }
                  Transaction: { Result: { Success: true } }
                  Block: { Time: { since: "2024-12-01T00:00:00Z" } }
                }
              ) {
                Trade {
                  Buy {
                    Price(maximum: Block_Time)
                    PriceInUSD(maximum: Block_Time)
                    Currency {
                      Name
                      Symbol
                      MintAddress
                      Decimals
                      Fungible
                      Uri
                    }
                  }
                }
                Block {
                  Time
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
            console.error('Full BitQuery response:', JSON.stringify(data, null, 2));
            throw new Error(`GraphQL query failed: ${data.errors[0]?.message || 'Unknown error'}`);
        }

        const trades: BitQueryToken[] = data.data?.Solana?.DEXTrades || [];

        // Process and transform the data with enhanced metadata
        const processedTokens: PumpFunToken[] = await Promise.all(trades.map(async (trade) => {
            const currency = trade.Trade.Buy.Currency;
            const price = trade.Trade.Buy.Price || 0;
            const priceInUSD = trade.Trade.Buy.PriceInUSD || 0;
            const marketCap = priceInUSD * PUMP_TOKEN_SUPPLY;
            const graduationProgress = (marketCap / GRADUATION_THRESHOLD_USD) * 100;

            // Use metadata from joinTokenSupplyUpdates if available (more complete)
            const metadataSource = trade.joinTokenSupplyUpdates?.[0]?.TokenSupplyUpdate?.Currency || currency;

            // Get metadata URI (this contains the JSON metadata)
            let metadataUri = metadataSource.Uri || currency.Uri || '';
            if (metadataUri && !metadataUri.startsWith('http')) {
                // Handle various IPFS URI formats
                if (metadataUri.startsWith('ipfs://')) {
                    metadataUri = metadataUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
                } else if (metadataUri.startsWith('Qm') || metadataUri.startsWith('baf')) {
                    metadataUri = `https://ipfs.io/ipfs/${metadataUri}`;
                } else if (metadataUri.length > 40 && !metadataUri.includes('/')) {
                    metadataUri = `https://ipfs.io/ipfs/${metadataUri}`;
                }
            }

            // Fetch the actual image URL from metadata
            let imageUri = '';
            let tokenName = metadataSource.Name || currency.Name || currency.Symbol || 'Unknown Token';
            let tokenSymbol = metadataSource.Symbol || currency.Symbol || 'UNKNOWN';

            if (metadataUri) {
                try {
                    // Create AbortController for timeout
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);

                    const metadataResponse = await fetch(metadataUri, {
                        signal: controller.signal,
                        headers: {
                            'Accept': 'application/json',
                        }
                    });

                    clearTimeout(timeoutId);
                    if (metadataResponse.ok) {
                        const metadata = await metadataResponse.json();

                        // Extract image URL from metadata
                        if (metadata.image) {
                            imageUri = metadata.image;
                            // Handle IPFS URLs in image field
                            if (imageUri.startsWith('ipfs://')) {
                                imageUri = imageUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
                            } else if (!imageUri.startsWith('http') && (imageUri.startsWith('Qm') || imageUri.startsWith('baf'))) {
                                imageUri = `https://ipfs.io/ipfs/${imageUri}`;
                            }
                        }

                        // Use metadata name/symbol if available and better
                        if (metadata.name && metadata.name.trim()) {
                            tokenName = metadata.name;
                        }
                        if (metadata.symbol && metadata.symbol.trim()) {
                            tokenSymbol = metadata.symbol;
                        }
                    }
                } catch (error) {
                    console.log(`Failed to fetch metadata for ${currency.MintAddress}:`, error);
                    // Keep the metadata URI as fallback image
                    imageUri = metadataUri;
                }
            } else {
                console.log(`No metadata URI found for ${currency.MintAddress}`);
            }

            console.log(`Token ${tokenSymbol}: metadataUri=${metadataUri}, imageUri=${imageUri}`);

            return {
                mintAddress: currency.MintAddress || 'unknown',
                name: tokenName,
                symbol: tokenSymbol,
                description: `A trending token on pump.fun with ${graduationProgress.toFixed(1)}% graduation progress.`,
                imageUri,
                price,
                priceInUSD,
                marketCap,
                graduationProgress,
                creationTime: trade.Block.Time || new Date().toISOString(),
            };
        }));

        // Remove duplicates by mintAddress and filter for tokens in graduation range
        const uniqueTokens = processedTokens.reduce((acc, token) => {
            if (!acc.has(token.mintAddress) && token.mintAddress !== 'unknown') {
                acc.set(token.mintAddress, token);
            }
            return acc;
        }, new Map<string, PumpFunToken>());

        console.log(`📊 Total unique tokens before filtering: ${uniqueTokens.size}`);

        // Debug: Show market caps of all tokens
        const allTokens = Array.from(uniqueTokens.values());
        console.log(`💰 Market cap range in dataset: ${Math.min(...allTokens.map(t => t.marketCap))} - ${Math.max(...allTokens.map(t => t.marketCap))}`);

        // Filter for tokens with market cap between $30,000 and $68,000 (trending sweet spot)
        const graduationCandidates = allTokens.filter(token => {
            const inRange = token.marketCap >= 30000 && token.marketCap <= 68000;
            if (!inRange && token.marketCap > 10000) {
                console.log(`Token ${token.symbol} excluded: marketCap=$${token.marketCap.toFixed(0)}`);
            }
            return inRange;
        });

        console.log(`🎯 Tokens in $30K-$68K range: ${graduationCandidates.length}`);

        // Sort by market cap descending (highest market cap first within the range)
        graduationCandidates.sort((a, b) => b.marketCap - a.marketCap);

        console.log(`✅ Processed ${graduationCandidates.length} unique tokens from BitQuery v2 API`);

        return graduationCandidates; // Return all candidates for pagination

    } catch (error) {
        console.error('Error fetching graduating tokens from BitQuery:', error);
        throw error; // Re-throw the error instead of returning NextResponse
    }
}

/**
 * Get token metadata from IPFS URI
 */
async function enrichTokenMetadata(token: PumpFunToken): Promise<PumpFunToken> {
    try {
        if (token.imageUri && token.imageUri.includes('ipfs')) {
            // In production, you'd fetch from IPFS
            // For now, return the token as-is since we have mock data
            return token;
        }
        return token;
    } catch (error) {
        console.error(`Error enriching metadata for ${token.symbol}:`, error);
        return token;
    }
}

export async function GET(request: Request) {
    try {
        // Parse pagination parameters from URL
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        console.log(`🚀 Fetching trending tokens ($30K-$68K market cap) - Page ${page}, Limit ${limit}...`);

        // Use the enhanced fetchGraduatingTokens function with metadata fetching
        const allCandidates = await fetchGraduatingTokens();

        console.log(`✅ Processed ${allCandidates.length} unique tokens from BitQuery v2 API`);

        // Apply pagination
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
            cached: false,
            timestamp: new Date().toISOString(),
            message: `Found ${totalTokens} tokens total, showing page ${page} (${paginatedTokens.length} tokens)`,
            graduationThreshold: GRADUATION_THRESHOLD_USD,
            explanation: 'Tokens with market cap between $30,000 and $68,000 - trending tokens with momentum but not too close to graduation',
            dataSource: 'BitQuery v2 Pump.fun API with OAuth2',
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
            dataSource: 'BitQuery v2 Pump.fun API with OAuth2',
        }, { status: 500 });
    }
} 