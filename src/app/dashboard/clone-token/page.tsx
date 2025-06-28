'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PumpFunToken {
    mintAddress: string;
    name: string;
    symbol: string;
    description?: string;
    imageUri?: string;
    creatorAddress?: string;
    price: number;
    priceInUSD: number;
    marketCap: number;
    graduationProgress: number;
    creationTime: string;
}

export default function CloneTokenPage() {
    const [trendingTokens, setTrendingTokens] = useState<PumpFunToken[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTrendingTokens = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/trending-tokens?limit=12');
            const data = await response.json();

            if (data.success) {
                setTrendingTokens(data.graduatingTokens || []);
            } else {
                setError(data.error || 'Failed to fetch trending tokens');
            }
        } catch (err) {
            setError('Failed to load trending tokens');
            console.error('Error fetching trending tokens:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrendingTokens();
    }, []);

    const formatMarketCap = (marketCap: number) => {
        if (marketCap >= 1000000) {
            return `$${(marketCap / 1000000).toFixed(1)}M`;
        } else if (marketCap >= 1000) {
            return `$${(marketCap / 1000).toFixed(1)}K`;
        }
        return `$${marketCap.toFixed(0)}`;
    };

    const getProgressColor = (progress: number) => {
        if (progress >= 80) return 'from-green-500 to-emerald-500';
        if (progress >= 60) return 'from-yellow-500 to-orange-500';
        if (progress >= 40) return 'from-purple-500 to-pink-500';
        return 'from-gray-500 to-gray-400';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="hero-title text-3xl font-bold text-primary">Clone Token</h1>
                    <p className="text-secondary mt-1">
                        Discover trending tokens and clone successful concepts
                    </p>
                </div>
                <button
                    onClick={fetchTrendingTokens}
                    disabled={loading}
                    className="dark-card hover:scale-105 text-primary px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 disabled:opacity-50 border-subtle"
                >
                    <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
                </button>
            </div>

            {/* Info Card */}
            <div className="dark-card rounded-xl p-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                <div className="flex items-start space-x-4">
                    <div className="text-3xl">🔥</div>
                    <div>
                        <h3 className="text-primary font-semibold text-lg mb-2">Clone Trending Tokens</h3>
                        <p className="text-secondary text-sm mb-3">
                            Analyze successful tokens and create your own version with similar concepts.
                            This feature helps you understand what makes tokens successful.
                        </p>
                        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                            <p className="text-yellow-300 text-xs">
                                ⚠️ Always ensure you have proper rights and permissions when creating inspired content.
                                Be original and add your own unique value proposition.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="dark-card rounded-xl p-6 animate-pulse">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-10 h-10 bg-gray-600 rounded-full"></div>
                                <div>
                                    <div className="h-4 bg-gray-600 rounded w-20 mb-2"></div>
                                    <div className="h-3 bg-gray-600 rounded w-16"></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 bg-gray-600 rounded w-full"></div>
                                <div className="h-3 bg-gray-600 rounded w-3/4"></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4 animate-bounce">⚠️</div>
                    <h3 className="section-title text-xl font-semibold text-primary mb-2">Unable to load trending tokens</h3>
                    <p className="text-secondary mb-6">{error}</p>
                    <button
                        onClick={fetchTrendingTokens}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Trending Tokens Grid */}
            {!loading && !error && trendingTokens.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trendingTokens.map((token) => (
                        <div key={token.mintAddress} className="dark-card rounded-xl p-6 hover:scale-105 hover:border-purple-500/30 transition-all duration-300 group">
                            {/* Token Header */}
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-10 h-10 flex-shrink-0">
                                    {token.imageUri ? (
                                        <img
                                            src={token.imageUri}
                                            alt={token.name}
                                            className="w-10 h-10 rounded-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                target.nextElementSibling?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}
                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform duration-300 ${token.imageUri ? 'hidden' : ''}`}>
                                        {token.symbol.charAt(0)}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-primary font-semibold truncate">{token.name}</h3>
                                    <p className="text-secondary text-sm">${token.symbol}</p>
                                </div>
                            </div>

                            {/* Token Description */}
                            {token.description && (
                                <p className="text-secondary text-sm mb-4 line-clamp-2">
                                    {token.description}
                                </p>
                            )}

                            {/* Token Stats */}
                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-secondary">Market Cap:</span>
                                    <span className="text-primary font-medium">{formatMarketCap(token.marketCap)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-secondary">Price:</span>
                                    <span className="text-primary font-medium">${token.priceInUSD.toFixed(6)}</span>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-secondary">Graduation Progress:</span>
                                        <span className="text-primary font-medium">{token.graduationProgress.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full bg-gradient-to-r ${getProgressColor(token.graduationProgress)} transition-all duration-300`}
                                            style={{ width: `${Math.min(token.graduationProgress, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Token Age */}
                            <div className="text-xs text-muted mb-4">
                                Created: {new Date(token.creationTime).toLocaleDateString()}
                            </div>

                            {/* Actions */}
                            <div className="flex space-x-2">
                                <Link
                                    href={`/dashboard/create-token?clone=${token.mintAddress}`}
                                    className="flex-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-light text-center py-2 px-3 rounded-lg text-sm transition-all duration-300 hover:scale-105"
                                >
                                    Clone This Token
                                </Link>
                                <a
                                    href={`https://solscan.io/token/${token.mintAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-center py-2 px-3 rounded-lg text-sm transition-all duration-300 hover:scale-105"
                                >
                                    View Details
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && trendingTokens.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4 animate-bounce">🚀</div>
                    <h3 className="section-title text-xl font-semibold text-primary mb-2">No trending tokens available</h3>
                    <p className="text-secondary mb-6 max-w-md mx-auto">
                        Unable to fetch trending tokens at the moment. Please try again later.
                    </p>
                    <button
                        onClick={fetchTrendingTokens}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
                    >
                        Refresh
                    </button>
                </div>
            )}
        </div>
    );
} 