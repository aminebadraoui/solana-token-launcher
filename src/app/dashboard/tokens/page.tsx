'use client';

import { useState } from 'react';
import { useUser } from '@/lib/userContext';

export default function TokensPage() {
    const { userTokens, refreshUserData } = useUser();
    const [sortBy, setSortBy] = useState<'date' | 'name' | 'supply'>('date');
    const [filterBy, setFilterBy] = useState<'all' | 'revoked' | 'active'>('all');

    // Sort tokens based on selected criteria
    const sortedTokens = [...userTokens].sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'supply':
                return Number(b.supply) - Number(a.supply);
            case 'date':
            default:
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
    });

    // Filter tokens based on authority status
    const filteredTokens = sortedTokens.filter((token) => {
        if (filterBy === 'revoked') {
            return token.revoke_mint_auth && token.revoke_freeze_auth && token.revoke_update_auth;
        }
        if (filterBy === 'active') {
            return !token.revoke_mint_auth || !token.revoke_freeze_auth || !token.revoke_update_auth;
        }
        return true; // 'all'
    });

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            // You could add a toast notification here
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="hero-title text-3xl font-bold text-primary">My Tokens</h1>
                    <p className="text-secondary mt-1">
                        Manage and monitor your created tokens ({userTokens.length} total)
                    </p>
                </div>
                <button
                    onClick={refreshUserData}
                    className="dark-card hover:scale-105 text-primary px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 border-subtle"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
                </button>
            </div>

            {/* Filters and Sorting */}
            {userTokens.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-4 dark-card p-4 rounded-xl">
                    <div className="flex items-center space-x-2">
                        <label className="text-secondary text-sm font-medium">Sort by:</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="dark-input text-primary rounded-lg px-3 py-1 text-sm border-subtle focus:border-purple-500 focus:outline-none transition-colors duration-300"
                        >
                            <option value="date">Date Created</option>
                            <option value="name">Name</option>
                            <option value="supply">Supply</option>
                        </select>
                    </div>
                    <div className="flex items-center space-x-2">
                        <label className="text-secondary text-sm font-medium">Filter:</label>
                        <select
                            value={filterBy}
                            onChange={(e) => setFilterBy(e.target.value as any)}
                            className="dark-input text-primary rounded-lg px-3 py-1 text-sm border-subtle focus:border-purple-500 focus:outline-none transition-colors duration-300"
                        >
                            <option value="all">All Tokens</option>
                            <option value="active">Active Authority</option>
                            <option value="revoked">Revoked Authority</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Tokens Grid */}
            {filteredTokens.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredTokens.map((token) => (
                        <div key={token.id} className="dark-card rounded-xl p-6 hover:scale-105 hover:border-purple-500/30 transition-all duration-300 group">
                            {/* Token Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform duration-300">
                                        {token.symbol.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-primary font-semibold text-lg">{token.name}</h3>
                                        <p className="text-secondary">${token.symbol}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted">Created</p>
                                    <p className="text-sm text-secondary">{new Date(token.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* Token Details */}
                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between">
                                    <span className="text-secondary text-sm">Supply:</span>
                                    <span className="text-primary font-medium">{Number(token.supply).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary text-sm">Decimals:</span>
                                    <span className="text-primary">{token.decimals}</span>
                                </div>
                                {token.description && (
                                    <div>
                                        <span className="text-secondary text-sm block mb-1">Description:</span>
                                        <p className="text-secondary text-sm">{token.description}</p>
                                    </div>
                                )}
                            </div>

                            {/* Authority Status */}
                            <div className="mb-4">
                                <p className="text-secondary text-sm mb-2">Authority Status:</p>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div className={`text-center py-1 px-2 rounded-lg transition-colors duration-300 ${token.revoke_mint_auth ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                        Mint: {token.revoke_mint_auth ? 'Revoked' : 'Active'}
                                    </div>
                                    <div className={`text-center py-1 px-2 rounded-lg transition-colors duration-300 ${token.revoke_freeze_auth ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                        Freeze: {token.revoke_freeze_auth ? 'Revoked' : 'Active'}
                                    </div>
                                    <div className={`text-center py-1 px-2 rounded-lg transition-colors duration-300 ${token.revoke_update_auth ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                        Update: {token.revoke_update_auth ? 'Revoked' : 'Active'}
                                    </div>
                                </div>
                            </div>

                            {/* Token Address */}
                            <div className="border-t border-subtle pt-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-secondary text-sm">Token Address:</span>
                                    <button
                                        onClick={() => copyToClipboard(token.token_mint)}
                                        className="text-purple-light hover:text-purple-400 text-sm font-medium flex items-center space-x-1 transition-all duration-300 hover:scale-105"
                                    >
                                        <span className="font-mono">{token.token_mint.slice(0, 8)}...{token.token_mint.slice(-4)}</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex space-x-2 mt-4">
                                <a
                                    href={`https://solscan.io/token/${token.token_mint}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-center py-2 px-3 rounded-lg text-sm transition-all duration-300 hover:scale-105"
                                >
                                    View on Solscan
                                </a>
                                {token.metadata_uri && (
                                    <a
                                        href={token.metadata_uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-center py-2 px-3 rounded-lg text-sm transition-all duration-300 hover:scale-105"
                                    >
                                        Metadata
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4 animate-bounce">💰</div>
                    <h3 className="section-title text-xl font-semibold text-primary mb-2">
                        {userTokens.length === 0 ? 'No tokens created yet' : 'No tokens match your filters'}
                    </h3>
                    <p className="text-secondary mb-6 max-w-md mx-auto">
                        {userTokens.length === 0
                            ? 'Start your journey by creating your first token!'
                            : 'Try adjusting your filters to see more tokens.'}
                    </p>
                    {userTokens.length === 0 && (
                        <a
                            href="/dashboard/create-token"
                            className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
                        >
                            Create Your First Token
                        </a>
                    )}
                </div>
            )}
        </div>
    );
} 