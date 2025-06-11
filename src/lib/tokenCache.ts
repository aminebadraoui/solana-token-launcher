import Redis from 'ioredis';

// Types from the existing API
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

// Constants from the original API
const GRADUATION_THRESHOLD_USD = 69000;
const PUMP_TOKEN_SUPPLY = 1000000000; // 1 billion tokens
const GRADUATION_PRICE_USD = GRADUATION_THRESHOLD_USD / PUMP_TOKEN_SUPPLY;

// BitQuery credentials
const BITQUERY_CLIENT_ID = process.env.BITQUERY_CLIENT_ID || '6c50cf84-387c-4a7b-9466-aa8c5aba8d4a';
const BITQUERY_CLIENT_SECRET = process.env.BITQUERY_CLIENT_SECRET || 'AqYKzE5WQyKsQqb7BJps-6AWBX';
const BITQUERY_ACCESS_TOKEN = process.env.BITQUERY_ACCESS_TOKEN || 'ory_at_3XBBGH7f1z0wBI7_ueBK1D_f6Nix5XNC0Qwsyi28zB0.yEmm-5awerx55EK6JEAVnHF7m8pNZ2KONZPDdW2ptwM';

// Redis configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CACHE_KEY = 'trending-tokens';
const CACHE_TTL = 15 * 60; // 15 minutes in seconds
const REFRESH_THRESHOLD = 2 * 60; // Refresh when TTL < 2 minutes

// Redis client with fallback handling
let redis: Redis | null = null;
let isRedisAvailable = false;

// In-memory fallback cache
let memoryCache: PumpFunToken[] = [];
let memoryCacheTimestamp = 0;

/**
 * Initialize Redis connection with error handling
 */
function initializeRedis(): Redis | null {
    try {
        if (redis && redis.status === 'ready') {
            return redis;
        }

        redis = new Redis(REDIS_URL, {
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            connectTimeout: 10000,
        });

        redis.on('connect', () => {
            console.log('✅ Redis connected successfully');
            isRedisAvailable = true;
        });

        redis.on('error', (error: Error) => {
            console.warn('⚠️ Redis connection error, falling back to memory cache:', error.message);
            isRedisAvailable = false;
        });

        redis.on('close', () => {
            console.warn('⚠️ Redis connection closed, using memory cache');
            isRedisAvailable = false;
        });

        return redis;
    } catch (error) {
        console.warn('⚠️ Failed to initialize Redis, using memory cache:', error);
        isRedisAvailable = false;
        return null;
    }
}

/**
 * Get BitQuery OAuth token
 */
async function getBitQueryOAuthToken(): Promise<string> {
    return BITQUERY_ACCESS_TOKEN;
}

/**
 * Fetch fresh token data from BitQuery API (moved from route.ts)
 */
async function fetchGraduatingTokens(): Promise<PumpFunToken[]> {
    try {
        console.log('🚀 Fetching trending tokens ($30K-$68K market cap) from pump.fun...');

        const accessToken = await getBitQueryOAuthToken();

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
            throw new Error(`GraphQL query failed: ${data.errors[0]?.message || 'Unknown error'}`);
        }

        const trades: BitQueryToken[] = data.data?.Solana?.DEXTrades || [];

        // Process and transform the data (moved from route.ts)
        const processedTokens: PumpFunToken[] = await Promise.all(trades.map(async (trade) => {
            const currency = trade.Trade.Buy.Currency;
            const price = trade.Trade.Buy.Price || 0;
            const priceInUSD = trade.Trade.Buy.PriceInUSD || 0;
            const marketCap = priceInUSD * PUMP_TOKEN_SUPPLY;
            const graduationProgress = (marketCap / GRADUATION_THRESHOLD_USD) * 100;

            const metadataSource = trade.joinTokenSupplyUpdates?.[0]?.TokenSupplyUpdate?.Currency || currency;

            let metadataUri = metadataSource.Uri || currency.Uri || '';
            if (metadataUri && !metadataUri.startsWith('http')) {
                if (metadataUri.startsWith('ipfs://')) {
                    metadataUri = metadataUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
                } else if (metadataUri.startsWith('Qm') || metadataUri.startsWith('baf')) {
                    metadataUri = `https://ipfs.io/ipfs/${metadataUri}`;
                } else if (metadataUri.length > 40 && !metadataUri.includes('/')) {
                    metadataUri = `https://ipfs.io/ipfs/${metadataUri}`;
                }
            }

            let imageUri = '';
            let tokenDescription = '';
            let tokenName = metadataSource.Name || currency.Name || currency.Symbol || 'Unknown Token';
            let tokenSymbol = metadataSource.Symbol || currency.Symbol || 'UNKNOWN';

            if (metadataUri) {
                // List of IPFS gateways to try if original fails
                const ipfsGateways = [
                    'https://ipfs.io/ipfs/',
                    'https://cloudflare-ipfs.com/ipfs/',
                    'https://gateway.pinata.cloud/ipfs/',
                    'https://dweb.link/ipfs/'
                ];

                let metadataResponse: Response | null = null;
                let lastError: Error | null = null;

                try {

                    // Try the original URL first
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 2000); // Faster timeout for initial attempt

                        metadataResponse = await fetch(metadataUri, {
                            signal: controller.signal,
                            headers: { 'Accept': 'application/json' }
                        });

                        clearTimeout(timeoutId);
                    } catch (error) {
                        lastError = error as Error;

                        // If it's an IPFS URL and the original gateway failed, try alternatives
                        if (metadataUri.includes('/ipfs/')) {
                            const ipfsHash = metadataUri.split('/ipfs/')[1]?.split('?')[0];
                            if (ipfsHash) {
                                for (const gateway of ipfsGateways) {
                                    if (metadataUri.includes(gateway)) continue; // Skip if already tried

                                    try {
                                        const controller = new AbortController();
                                        const timeoutId = setTimeout(() => controller.abort(), 1500); // Even faster for fallbacks

                                        metadataResponse = await fetch(gateway + ipfsHash, {
                                            signal: controller.signal,
                                            headers: { 'Accept': 'application/json' }
                                        });

                                        clearTimeout(timeoutId);
                                        if (metadataResponse.ok) break;
                                    } catch (gatewayError) {
                                        continue; // Try next gateway
                                    }
                                }
                            }
                        }
                    }

                    if (metadataResponse && metadataResponse.ok) {
                        const metadata = await metadataResponse.json();

                        if (metadata.image) {
                            imageUri = metadata.image;
                            if (imageUri.startsWith('ipfs://')) {
                                imageUri = imageUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
                            } else if (!imageUri.startsWith('http') && (imageUri.startsWith('Qm') || imageUri.startsWith('baf'))) {
                                imageUri = `https://ipfs.io/ipfs/${imageUri}`;
                            }

                            // Add cache-busting query parameter for problematic URLs to help with frontend loading
                            if (imageUri.includes('cf-ipfs.com') || imageUri.includes('cloudflare-ipfs.com')) {
                                imageUri += `?v=${Date.now()}`;
                            }
                        }

                        if (metadata.description && metadata.description.trim()) {
                            tokenDescription = metadata.description.trim();
                        }

                        if (metadata.name && metadata.name.trim()) {
                            tokenName = metadata.name;
                        }
                        if (metadata.symbol && metadata.symbol.trim()) {
                            tokenSymbol = metadata.symbol;
                        }
                    }
                } catch (error) {
                    // Handle network errors gracefully
                    const errorMessage = lastError?.message || (error instanceof Error ? error.message : 'Unknown error');
                    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('fetch failed')) {
                        console.log(`⚠️ All metadata gateways unreachable for ${currency.MintAddress} (${metadataUri.includes('cf-ipfs.com') ? 'cf-ipfs.com + fallbacks failed' : 'network error'})`);
                    } else {
                        console.log(`Failed to fetch metadata for ${currency.MintAddress}:`, errorMessage);
                    }
                    imageUri = metadataUri;
                }
            }

            // Log token processing like original implementation
            console.log(`Token ${tokenSymbol}: metadataUri=${metadataUri}, imageUri=${imageUri}`);

            return {
                mintAddress: currency.MintAddress || 'unknown',
                name: tokenName,
                symbol: tokenSymbol,
                description: tokenDescription || `A trending token on pump.fun with ${graduationProgress.toFixed(1)}% graduation progress.`,
                imageUri,
                metadataUri,
                price,
                priceInUSD,
                marketCap,
                graduationProgress,
                creationTime: trade.Block.Time || new Date().toISOString(),
            };
        }));

        // Remove duplicates and filter for graduation range
        const uniqueTokens = processedTokens.reduce((acc, token) => {
            if (!acc.has(token.mintAddress) && token.mintAddress !== 'unknown') {
                acc.set(token.mintAddress, token);
            }
            return acc;
        }, new Map<string, PumpFunToken>());

        const allTokens = Array.from(uniqueTokens.values());

        console.log(`📊 Total unique tokens before filtering: ${uniqueTokens.size}`);
        console.log(`💰 Market cap range in dataset: ${Math.min(...allTokens.map(t => t.marketCap))} - ${Math.max(...allTokens.map(t => t.marketCap))}`);

        // Filter for tokens with market cap between $30,000 and $68,000
        const graduationCandidates = allTokens.filter(token => {
            const inRange = token.marketCap >= 30000 && token.marketCap <= 68000;
            if (!inRange && token.marketCap > 10000) {
                console.log(`Token ${token.symbol} excluded: marketCap=$${token.marketCap.toFixed(0)}`);
            }
            return inRange;
        });

        console.log(`🎯 Tokens in $30K-$68K range: ${graduationCandidates.length}`);

        // Sort by market cap descending
        graduationCandidates.sort((a, b) => b.marketCap - a.marketCap);

        console.log(`✅ Processed ${graduationCandidates.length} unique tokens from BitQuery v2 API`);
        return graduationCandidates;

    } catch (error) {
        console.error('Error fetching graduating tokens from BitQuery:', error);
        throw error;
    }
}

/**
 * Cache tokens with Redis or memory fallback
 */
async function cacheTokens(tokens: PumpFunToken[]): Promise<void> {
    const data = JSON.stringify(tokens);

    // Try Redis first
    if (isRedisAvailable && redis) {
        try {
            await redis.setex(CACHE_KEY, CACHE_TTL, data);
            console.log(`✅ Cached ${tokens.length} tokens in Redis (TTL: ${CACHE_TTL}s)`);
            return;
        } catch (error) {
            console.warn('⚠️ Redis cache failed, using memory cache:', error);
            isRedisAvailable = false;
        }
    }

    // Fallback to memory cache
    memoryCache = tokens;
    memoryCacheTimestamp = Date.now();
    console.log(`✅ Cached ${tokens.length} tokens in memory`);
}

/**
 * Get cached tokens from Redis or memory
 */
async function getCachedTokens(): Promise<PumpFunToken[] | null> {
    // Try Redis first
    if (isRedisAvailable && redis) {
        try {
            const data = await redis.get(CACHE_KEY);
            if (data) {
                const tokens = JSON.parse(data);
                console.log(`✅ Retrieved ${tokens.length} tokens from Redis cache`);
                return tokens;
            }
        } catch (error) {
            console.warn('⚠️ Redis read failed, checking memory cache:', error);
            isRedisAvailable = false;
        }
    }

    // Check memory cache
    const now = Date.now();
    const age = now - memoryCacheTimestamp;
    if (memoryCache.length > 0 && age < (CACHE_TTL * 1000)) {
        console.log(`✅ Retrieved ${memoryCache.length} tokens from memory cache (age: ${Math.round(age / 1000)}s)`);
        return memoryCache;
    }

    return null;
}

/**
 * Get cache TTL (time to live) in seconds
 */
async function getCacheTTL(): Promise<number> {
    if (isRedisAvailable && redis) {
        try {
            const ttl = await redis.ttl(CACHE_KEY);
            return ttl > 0 ? ttl : 0;
        } catch (error) {
            console.warn('⚠️ Redis TTL check failed:', error);
        }
    }

    // Memory cache TTL calculation
    const age = Date.now() - memoryCacheTimestamp;
    const remainingTTL = Math.max(0, CACHE_TTL - Math.floor(age / 1000));
    return remainingTTL;
}

/**
 * Fetch and cache fresh token data
 */
export async function fetchAndCacheTokens(): Promise<PumpFunToken[]> {
    try {
        console.log('🔄 Fetching fresh token data...');
        const tokens = await fetchGraduatingTokens();
        await cacheTokens(tokens);
        return tokens;
    } catch (error) {
        console.error('❌ Failed to fetch and cache tokens:', error);
        throw error;
    }
}

/**
 * Main function: Get tokens with smart caching (Option 3 - Hybrid)
 */
export async function getTokensWithSmartRefresh(): Promise<PumpFunToken[]> {
    try {
        // Initialize Redis connection if needed
        if (!redis) {
            redis = initializeRedis();
        }

        // Try cache first
        const cachedTokens = await getCachedTokens();

        if (cachedTokens) {
            // Check TTL for proactive refresh
            const ttl = await getCacheTTL();
            if (ttl < REFRESH_THRESHOLD) {
                console.log(`⏰ Cache TTL (${ttl}s) below threshold (${REFRESH_THRESHOLD}s), refreshing in background...`);
                // Non-blocking background refresh
                fetchAndCacheTokens().catch(error =>
                    console.error('❌ Background refresh failed:', error)
                );
            }
            return cachedTokens;
        }

        // Cache miss - fetch immediately
        console.log('🎯 Cache miss - fetching fresh data');
        return await fetchAndCacheTokens();

    } catch (error) {
        console.error('❌ Cache error, falling back to direct fetch:', error);
        // Last resort: direct fetch without caching
        return await fetchGraduatingTokens();
    }
}

/**
 * Initialize cache on startup
 */
export async function initializeCache(): Promise<void> {
    try {
        // Initialize Redis
        redis = initializeRedis();

        // Check if cache exists
        const existing = await getCachedTokens();
        if (!existing) {
            console.log('🚀 Bootstrapping cache on startup');
            await fetchAndCacheTokens();
        } else {
            console.log(`✅ Cache already populated with ${existing.length} tokens`);
        }
    } catch (error) {
        console.error('❌ Cache initialization failed:', error);
    }
}

/**
 * Clear cache (for manual refresh)
 */
export async function clearCache(): Promise<void> {
    try {
        if (isRedisAvailable && redis) {
            await redis.del(CACHE_KEY);
            console.log('✅ Redis cache cleared');
        }

        memoryCache = [];
        memoryCacheTimestamp = 0;
        console.log('✅ Memory cache cleared');
    } catch (error) {
        console.error('❌ Failed to clear cache:', error);
    }
} 