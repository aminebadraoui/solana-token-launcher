'use client';

import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useUser } from '@/lib/userContext';

function SuccessPageContent() {
    const searchParams = useSearchParams();
    const { refreshUserData } = useUser();
    const [tokenData, setTokenData] = useState<any>(null);

    useEffect(() => {
        // Get token data from URL parameters
        const mintAddress = searchParams.get('mint');
        const name = searchParams.get('name');
        const symbol = searchParams.get('symbol');
        const signature = searchParams.get('signature');

        if (mintAddress && name && symbol) {
            setTokenData({
                mintAddress,
                name,
                symbol,
                signature,
            });

            // Refresh user data to include the newly created token
            refreshUserData();
        }
    }, [searchParams]);

    if (!tokenData) {
        return (
            <div className="min-h-screen dark-gradient-bg">
                <Header />
                <div className="container mx-auto px-6 py-12">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-red-400 mb-4">Invalid Access</h1>
                        <p className="text-secondary mb-6">This page can only be accessed after creating a token.</p>
                        <Link
                            href="/create-token"
                            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Create Token
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen dark-gradient-bg">
            <Header />

            <div className="container mx-auto px-6 py-12">
                {/* Success Header */}
                <div className="text-center mb-12">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">🎉</span>
                    </div>
                    <h1 className="text-5xl font-bold text-primary mb-4">
                        Token Created Successfully!
                    </h1>
                    <p className="text-xl text-secondary max-w-2xl mx-auto">
                        Your <strong className="text-green-400">{tokenData.name} (${tokenData.symbol})</strong> token has been successfully deployed to the Solana blockchain.
                    </p>
                </div>

                {/* Token Details Card */}
                <div className="max-w-4xl mx-auto mb-12">
                    <div className="dark-card rounded-xl p-8 border border-green-500/30">
                        <h2 className="text-2xl font-bold text-primary mb-6">Token Details</h2>

                        <div className="space-y-4">
                            {/* Token Address */}
                            <div className="bg-gray-800/50 rounded-lg p-4">
                                <label className="block text-sm font-medium text-secondary mb-2">
                                    Token Mint Address
                                </label>
                                <div className="flex items-center gap-3">
                                    <code className="flex-1 bg-gray-900 text-green-400 px-3 py-2 rounded text-sm font-mono break-all">
                                        {tokenData.mintAddress}
                                    </code>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(tokenData.mintAddress)}
                                        className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm"
                                        title="Copy to clipboard"
                                    >
                                        📋
                                    </button>
                                </div>
                            </div>

                            {/* Transaction Signature */}
                            {tokenData.signature && (
                                <div className="bg-gray-800/50 rounded-lg p-4">
                                    <label className="block text-sm font-medium text-secondary mb-2">
                                        Transaction Signature
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <code className="flex-1 bg-gray-900 text-blue-400 px-3 py-2 rounded text-sm font-mono break-all">
                                            {tokenData.signature}
                                        </code>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(tokenData.signature)}
                                            className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm"
                                            title="Copy to clipboard"
                                        >
                                            📋
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Quick Links */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                <a
                                    href={`https://solscan.io/token/${tokenData.mintAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg px-4 py-3 text-blue-300 hover:text-blue-200 hover:border-blue-400/50 transition-all"
                                >
                                    <span>🔍</span>
                                    View on Solscan
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>

                                <a
                                    href={`https://explorer.solana.com/address/${tokenData.mintAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg px-4 py-3 text-green-300 hover:text-green-200 hover:border-green-400/50 transition-all"
                                >
                                    <span>⛓️</span>
                                    View on Solana Explorer
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Next Steps Section */}
                <div className="max-w-4xl mx-auto mb-12">
                    <h2 className="text-3xl font-bold text-primary mb-8 text-center">
                        🚀 Next Steps: Add Liquidity & Launch
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Step 1: Add Liquidity */}
                        <div className="dark-card rounded-lg p-6 border border-purple-500/30">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                                <span className="text-2xl">💰</span>
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-3">1. Add Liquidity</h3>
                            <p className="text-secondary text-sm mb-4">
                                Create a liquidity pool on Raydium to enable trading of your token.
                            </p>
                            <a
                                href="https://raydium.io/liquidity/create/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                            >
                                Open Raydium
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>

                        {/* Step 2: List on DEX Screener */}
                        <div className="dark-card rounded-lg p-6 border border-blue-500/30">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                                <span className="text-2xl">📊</span>
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-3">2. Track on DEX Screener</h3>
                            <p className="text-secondary text-sm mb-4">
                                Monitor your token's performance and trading activity.
                            </p>
                            <a
                                href={`https://dexscreener.com/solana/${tokenData.mintAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                                View on DEX Screener
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>

                        {/* Step 3: Go to Dashboard */}
                        <div className="dark-card rounded-lg p-6 border border-green-500/30">
                            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                                <span className="text-2xl">🏠</span>
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-3">3. Manage in Dashboard</h3>
                            <p className="text-secondary text-sm mb-4">
                                View your token in your dashboard and manage all your created tokens.
                            </p>
                            <Link
                                href="/dashboard/tokens"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                                Go to Dashboard
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>

                        {/* Step 4: Marketing & Community */}
                        <div className="dark-card rounded-lg p-6 border border-yellow-500/30">
                            <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
                                <span className="text-2xl">🌟</span>
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-3">4. Build Community</h3>
                            <p className="text-secondary text-sm mb-4">
                                Promote your token and build a strong community around it.
                            </p>
                            <div className="space-y-2">
                                <a
                                    href="https://twitter.com/compose/tweet"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-600/20 text-sky-300 rounded text-xs hover:bg-sky-600/30 transition-colors"
                                >
                                    🐦 Share on Twitter
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Important Notes */}
                <div className="max-w-4xl mx-auto mb-12">
                    <div className="dark-card rounded-xl p-8 border border-yellow-500/30 bg-gradient-to-r from-yellow-500/5 to-orange-500/5">
                        <h3 className="text-xl font-bold text-yellow-300 mb-4">⚠️ Important Notes</h3>
                        <ul className="space-y-2 text-yellow-200 text-sm">
                            <li>• Save your token mint address - you'll need it for adding liquidity</li>
                            <li>• Your token has been created but needs liquidity to be tradeable</li>
                            <li>• Consider the tokenomics and distribution strategy before adding liquidity</li>
                            <li>• Always verify contract addresses before interacting with them</li>
                        </ul>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="text-center space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/create-token"
                            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                        >
                            Create Another Token
                        </Link>
                        <Link
                            href="/trending"
                            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
                        >
                            View Trending Tokens
                        </Link>
                    </div>
                    <Link
                        href="/"
                        className="inline-block text-secondary hover:text-primary transition-colors"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen dark-gradient-bg flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-secondary">Loading success details...</p>
                </div>
            </div>
        }>
            <SuccessPageContent />
        </Suspense>
    );
} 