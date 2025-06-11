'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';

// Global image cache to persist across re-renders
const imageCache = new Map<string, {
    status: 'loading' | 'loaded' | 'error',
    workingUrl?: string,
    gatewayIndex?: number
}>();

// Component for handling token images with persistent caching
function TokenImage({ token, className }: { token: PumpFunToken; className: string }) {
    const [imageState, setImageState] = useState<{
        status: 'loading' | 'loaded' | 'error';
        currentUrl: string;
        gatewayIndex: number;
    }>(() => {
        // Initialize from cache if available
        const cached = imageCache.get(token.mintAddress);
        if (cached && cached.status === 'loaded' && cached.workingUrl) {
            return {
                status: 'loaded',
                currentUrl: cached.workingUrl,
                gatewayIndex: cached.gatewayIndex || 0
            };
        }

        // Default initialization
        const initialUrl = getImageUrl(token.imageUri, 0);
        return {
            status: initialUrl ? 'loading' : 'error',
            currentUrl: initialUrl,
            gatewayIndex: 0
        };
    });

    // Alternative IPFS gateways for fallback
    const ipfsGateways = [
        'https://ipfs.io/ipfs/',
        'https://gateway.pinata.cloud/ipfs/',
        'https://cloudflare-ipfs.com/ipfs/',
        'https://dweb.link/ipfs/',
    ];

    // Get image URL for specific gateway
    function getImageUrl(imageUri: string | undefined, gatewayIndex: number): string {
        if (!imageUri) return '';

        // If it's already a full URL, use it (but try different gateways if needed)
        if (imageUri.startsWith('http')) {
            if (imageUri.includes('/ipfs/') && gatewayIndex > 0) {
                const hash = imageUri.split('/ipfs/')[1];
                return `${ipfsGateways[gatewayIndex]}${hash}`;
            }
            return imageUri;
        }

        // Handle various IPFS hash formats
        let hash = imageUri;
        if (hash.startsWith('ipfs://')) {
            hash = hash.replace('ipfs://', '');
        }

        return `${ipfsGateways[gatewayIndex]}${hash}`;
    }

    // Only reset if the actual imageUri changed (not on every re-render)
    useEffect(() => {
        const cached = imageCache.get(token.mintAddress);
        if (cached && cached.status === 'loaded' && cached.workingUrl) {
            // Use cached successful result
            setImageState({
                status: 'loaded',
                currentUrl: cached.workingUrl,
                gatewayIndex: cached.gatewayIndex || 0
            });
            return;
        }

        // Only reinitialize if we don't have a cached result
        const initialUrl = getImageUrl(token.imageUri, 0);
        if (initialUrl && initialUrl !== imageState.currentUrl) {
            setImageState({
                status: initialUrl ? 'loading' : 'error',
                currentUrl: initialUrl,
                gatewayIndex: 0
            });

            // Mark as loading in cache
            imageCache.set(token.mintAddress, { status: 'loading' });
        }
    }, [token.imageUri, token.mintAddress]); // Only depend on actual image URI changes

    const handleImageError = () => {
        console.log(`Image failed for ${token.symbol} (gateway ${imageState.gatewayIndex}):`, imageState.currentUrl);

        // Try next gateway if available
        if (imageState.gatewayIndex < ipfsGateways.length - 1) {
            const nextGatewayIndex = imageState.gatewayIndex + 1;
            const nextUrl = getImageUrl(token.imageUri, nextGatewayIndex);

            setImageState({
                status: 'loading',
                currentUrl: nextUrl,
                gatewayIndex: nextGatewayIndex
            });

            console.log(`Trying gateway ${nextGatewayIndex} for ${token.symbol}:`, nextUrl);
        } else {
            // All gateways failed
            setImageState(prev => ({ ...prev, status: 'error' }));
            imageCache.set(token.mintAddress, { status: 'error' });
            console.log(`All gateways failed for ${token.symbol}`);
        }
    };

    const handleImageLoad = () => {
        setImageState(prev => ({ ...prev, status: 'loaded' }));

        // Cache successful result
        imageCache.set(token.mintAddress, {
            status: 'loaded',
            workingUrl: imageState.currentUrl,
            gatewayIndex: imageState.gatewayIndex
        });

        console.log(`✅ Image loaded for ${token.symbol} using gateway ${imageState.gatewayIndex}`);
    };

    return (
        <div className={className}>
            {token.imageUri && imageState.status !== 'error' ? (
                <>
                    <img
                        key={token.mintAddress} // Use stable key
                        src={imageState.currentUrl}
                        alt={token.name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={handleImageError}
                        onLoad={handleImageLoad}
                        style={{
                            display: imageState.status === 'loaded' ? 'block' : 'none',
                            transition: 'opacity 0.2s ease-in-out'
                        }}
                    />
                    {imageState.status === 'loading' && (
                        <div className="w-10 h-10 rounded-full bg-gray-600 animate-pulse flex items-center justify-center">
                            <span className="text-xs text-gray-400">...</span>
                        </div>
                    )}
                </>
            ) : (
                <span className="text-lg font-bold text-purple-400 flex items-center justify-center w-10 h-10 rounded-full bg-gray-700/50">
                    {token.symbol.charAt(0)}
                </span>
            )}
        </div>
    );
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

interface PaginationInfo {
    currentPage: number;
    limit: number;
    totalTokens: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number | null;
    previousPage: number | null;
}

interface TrendingTokensResponse {
    success: boolean;
    graduatingTokens: PumpFunToken[];
    pagination: PaginationInfo;
    cached: boolean;
    timestamp: string;
    message: string;
    graduationThreshold: number;
    explanation: string;
    dataSource: string;
    error?: string;
}

export default function TrendingPage() {
    const [tokens, setTokens] = useState<PumpFunToken[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [sortBy, setSortBy] = useState<'marketCap' | 'recent'>('recent');
    const [lastCacheTimestamp, setLastCacheTimestamp] = useState<string | null>(null);

    useEffect(() => {
        fetchTrendingTokens(1, true);
    }, []);

    // Infinite scroll effect
    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + document.documentElement.scrollTop
                >= document.documentElement.offsetHeight - 1000 // Load when 1000px from bottom
            ) {
                if (!loadingMore && hasMore) {
                    fetchTrendingTokens(currentPage + 1, false);
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [currentPage, loadingMore, hasMore]);

    const fetchTrendingTokens = async (page: number = currentPage, isInitial: boolean = false, limit: number = 20) => {
        try {
            if (isInitial) {
                setLoading(true);
                setError(null);
                setTokens([]);
                setCurrentPage(1);
                setHasMore(true);
            } else {
                setLoadingMore(true);
            }

            const response = await fetch(`/api/trending-tokens?page=${page}&limit=${limit}`);
            const data: TrendingTokensResponse = await response.json();

            if (data.success) {
                setPagination(data.pagination);
                setCurrentPage(page);
                setHasMore(data.pagination.hasNextPage);

                // Check if cache was refreshed (timestamp changed) - if so, restart pagination
                if (!isInitial && lastCacheTimestamp && data.timestamp !== lastCacheTimestamp) {
                    console.log('🔄 Cache refresh detected, restarting pagination to avoid duplicates');
                    // Cache was refreshed, restart from page 1 to avoid stale pagination
                    setTokens(data.graduatingTokens);
                    setCurrentPage(1);
                    setPagination(data.pagination);
                } else if (isInitial) {
                    setTokens(data.graduatingTokens);
                } else {
                    // Append new tokens but deduplicate by mintAddress
                    setTokens(prevTokens => {
                        const existingMintAddresses = new Set(prevTokens.map(t => t.mintAddress));
                        const newTokens = data.graduatingTokens.filter(token =>
                            !existingMintAddresses.has(token.mintAddress)
                        );
                        return [...prevTokens, ...newTokens];
                    });
                }

                // Update cache timestamp tracking
                setLastCacheTimestamp(data.timestamp);

                // Debug: Log first few token image URLs
                console.log('Token image URLs:', data.graduatingTokens.slice(0, 3).map(t => ({
                    symbol: t.symbol,
                    imageUri: t.imageUri
                })));
            } else {
                setError(data.error || 'Failed to fetch trending tokens');
            }
        } catch (err) {
            setError('Failed to fetch trending tokens. Please try again.');
            console.error('Error fetching trending tokens:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleRefresh = () => {
        fetchTrendingTokens(1, true);
    };

    const filteredAndSortedTokens = tokens
        .sort((a, b) => {
            switch (sortBy) {
                case 'marketCap':
                    return b.marketCap - a.marketCap;
                case 'recent':
                    return new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime();
                default:
                    return 0;
            }
        });

    const getProgressColor = (progress: number) => {
        if (progress >= 95) return 'from-green-400 to-emerald-500';
        if (progress >= 80) return 'from-yellow-400 to-orange-500';
        return 'from-blue-400 to-purple-500';
    };

    const getProgressLabel = (progress: number) => {
        if (progress >= 95) return 'Ready to Graduate! 🚀';
        if (progress >= 80) return 'Almost There! ⚡';
        return 'Building Momentum 📈';
    };

    return (
        <div className="min-h-screen dark-gradient-bg">
            <Header />

            <div className="container mx-auto px-6 py-8 relative z-10">
                {/* Page Header */}
                <div className="text-center mb-12">
                    <div className="inline-block px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30 mb-4">
                        <span className="text-purple-light font-medium">🔥 Premium Feature</span>
                    </div>

                    <h1 className="hero-title text-4xl lg:text-5xl text-primary mb-6 leading-tight">
                        Trending Tokens
                        <span className="block">About to <span className="gradient-moon">Graduate</span></span>
                    </h1>

                    <p className="text-lg text-secondary mb-8 max-w-3xl mx-auto leading-relaxed">
                        Discover pump.fun tokens approaching the $69K graduation threshold.
                        Clone their success with our premium auto-population feature - <span className="line-through opacity-60">normally 0.1 SOL</span> <span className="text-green-400 font-semibold">now FREE!</span>
                    </p>

                    {/* Premium Feature Badge */}
                    <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg px-6 py-3 mb-8">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-light font-medium">🎉 Premium Cloning: <span className="line-through opacity-60">+0.1 SOL</span> <span className="text-green-400 font-bold">FREE PROMO!</span></span>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    </div>
                </div>

                {/* Filters and Controls */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="flex gap-4">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="dark-input rounded-lg px-4 py-2 font-medium"
                        >
                            <option value="marketCap">Sort by Market Cap</option>
                            <option value="recent">Sort by Recent</option>
                        </select>
                    </div>

                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="ml-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50"
                    >
                        {loading ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-20">
                        <div className="inline-block w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-secondary">Loading trending tokens...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="text-center py-20">
                        <div className="dark-card rounded-xl p-8 max-w-md mx-auto">
                            <div className="text-red-400 text-2xl mb-4">⚠️</div>
                            <h3 className="text-lg font-semibold text-primary mb-2">Error Loading Tokens</h3>
                            <p className="text-secondary mb-4">{error}</p>
                            <button
                                onClick={handleRefresh}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                )}

                {/* Tokens Grid */}
                {!loading && !error && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredAndSortedTokens.map((token, index) => (
                                <div key={token.mintAddress} className="dark-card rounded-xl p-6 group hover:scale-105 transition-all duration-300 flex flex-col h-full">
                                    {/* Token Header */}
                                    <div className="flex items-start gap-4 mb-4">
                                        <TokenImage
                                            token={token}
                                            className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center border border-purple-500/30"
                                        />

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-semibold text-primary">
                                                    {token.name || 'Unknown Token'}
                                                </h3>
                                                <a
                                                    href={`https://pump.fun/${token.mintAddress}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-gray-400 hover:text-purple-400 transition-colors duration-200"
                                                >
                                                    📈 pump.fun
                                                </a>
                                            </div>
                                            <p className="text-sm text-secondary">${token.symbol}</p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-secondary">Graduation Progress</span>
                                            <span className="text-sm font-medium text-primary">{token.graduationProgress.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-800 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full bg-gradient-to-r ${getProgressColor(token.graduationProgress)} transition-all duration-300`}
                                                style={{ width: `${Math.min(token.graduationProgress, 100)}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-center mt-1 text-purple-light">
                                            {getProgressLabel(token.graduationProgress)}
                                        </p>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-xs text-secondary">Market Cap</p>
                                            <p className="text-sm font-medium text-primary">${token.marketCap.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-secondary">Price</p>
                                            <p className="text-sm font-medium text-primary">${token.priceInUSD.toFixed(6)}</p>
                                        </div>
                                    </div>

                                    {/* Description - Fixed height container */}
                                    <div className="mb-4 flex-grow">
                                        <p className="text-sm text-secondary line-clamp-2 min-h-[2.5rem]">
                                            {token.description || ''}
                                        </p>
                                    </div>

                                    {/* Action Button - Always at bottom */}
                                    <div className="mt-auto">
                                        <Link
                                            href={`/create-token?clone=${token.mintAddress}`}
                                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300 text-center text-sm block"
                                        >
                                            🚀 Clone for <span className="line-through opacity-60">0.1 SOL</span> <span className="text-green-300 font-bold">FREE</span>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Infinite Scroll Loading Indicator */}
                        {loadingMore && (
                            <div className="flex items-center justify-center mt-12 py-8">
                                <div className="flex items-center space-x-3">
                                    <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                                    <p className="text-secondary">Loading more trending tokens...</p>
                                </div>
                            </div>
                        )}

                        {/* End of Results Indicator */}
                        {!hasMore && tokens.length > 0 && !loading && (
                            <div className="text-center mt-12 py-8">
                                <div className="inline-flex items-center space-x-2 bg-gray-700/30 border border-gray-600/30 rounded-lg px-6 py-3">
                                    <span className="text-gray-400">🎉</span>
                                    <p className="text-secondary">You've reached the end! Total: {tokens.length} trending tokens</p>
                                </div>
                            </div>
                        )}


                    </>
                )}

                {/* Empty State */}
                {!loading && !error && tokens.length === 0 && (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold text-primary mb-2">No Trending Tokens Found</h3>
                        <p className="text-secondary mb-6">
                            There are currently no tokens about to graduate. Check back soon!
                        </p>
                        <button
                            onClick={handleRefresh}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                        >
                            Refresh Data
                        </button>
                    </div>
                )}

                {/* Info Section */}
                <div className="mt-16 dark-card rounded-xl p-8">
                    <h2 className="text-2xl font-semibold text-primary mb-4">How Token Graduation Works</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div>
                            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                                <span className="text-blue-400 text-xl">📈</span>
                            </div>
                            <h3 className="font-semibold text-primary mb-2">Building Momentum</h3>
                            <p className="text-sm text-secondary">Tokens start on pump.fun and build trading volume towards the $69K graduation threshold.</p>
                        </div>
                        <div>
                            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
                                <span className="text-yellow-400 text-xl">⚡</span>
                            </div>
                            <h3 className="font-semibold text-primary mb-2">Almost Ready</h3>
                            <p className="text-sm text-secondary">At 80%+ progress, tokens are gaining serious traction and preparing for graduation.</p>
                        </div>
                        <div>
                            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                                <span className="text-green-400 text-xl">🚀</span>
                            </div>
                            <h3 className="font-semibold text-primary mb-2">Graduation</h3>
                            <p className="text-sm text-secondary">At $69K market cap, tokens graduate to Raydium with automatic liquidity provision.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 