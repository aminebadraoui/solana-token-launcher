'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { NoSSRWrapper } from '@/components/WalletContextProvider';
import { TokenCreationForm } from '@/components/TokenCreationForm';
import { Header } from '@/components/Header';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

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

export default function CreateToken() {
    const { connected } = useWallet();
    const searchParams = useSearchParams();
    const [isCloneMode, setIsCloneMode] = useState(false);
    const [cloneTokenData, setCloneTokenData] = useState<PumpFunToken | null>(null);
    const [isPremiumPaid, setIsPremiumPaid] = useState(false);
    const [loadingCloneData, setLoadingCloneData] = useState(false);
    const [cloneError, setCloneError] = useState<string | null>(null);

    const cloneParam = searchParams?.get('clone');

    useEffect(() => {
        if (cloneParam) {
            setIsCloneMode(true);
            fetchCloneTokenData(cloneParam);
        }
    }, [cloneParam]);

    const fetchCloneTokenData = async (mintAddress: string) => {
        try {
            setLoadingCloneData(true);
            setCloneError(null);

            // Fetch trending tokens to find the one we're cloning
            const response = await fetch('/api/trending-tokens');
            const data = await response.json();

            if (data.success) {
                const targetToken = data.graduatingTokens.find((token: PumpFunToken) =>
                    token.mintAddress === mintAddress
                );

                if (targetToken) {
                    setCloneTokenData(targetToken);
                } else {
                    setCloneError('Token not found in trending list. It may no longer be available for cloning.');
                }
            } else {
                setCloneError('Failed to fetch token data. Please try again.');
            }
        } catch (error) {
            console.error('Error fetching clone token data:', error);
            setCloneError('Error loading token data. Please try again.');
        } finally {
            setLoadingCloneData(false);
        }
    };

    const handlePremiumPayment = async () => {
        // TODO: Implement SOL payment processing
        // For now, simulate payment success
        setIsPremiumPaid(true);
    };

    const renderCloneHeader = () => {
        if (!isCloneMode || !cloneTokenData) return null;

        return (
            <div className="mb-8 dark-card rounded-xl p-6 border border-purple-500/30">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center border border-purple-500/30">
                        {cloneTokenData.imageUri ? (
                            <img src={cloneTokenData.imageUri} alt={cloneTokenData.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                            <span className="text-lg font-bold text-purple-400">
                                {cloneTokenData.symbol.charAt(0)}
                            </span>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-semibold text-primary">
                                Cloning: {cloneTokenData.name}
                            </h2>
                            <span className="text-sm px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                                ${cloneTokenData.symbol}
                            </span>
                        </div>
                        <p className="text-sm text-secondary">
                            Market Cap: ${cloneTokenData.marketCap.toLocaleString()} •
                            Progress: {cloneTokenData.graduationProgress.toFixed(1)}%
                        </p>
                    </div>
                </div>

                {!isPremiumPaid ? (
                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-primary mb-1">Premium Cloning Feature</h3>
                                <p className="text-sm text-secondary">
                                    Auto-populate your token creation form with this trending token's metadata
                                </p>
                            </div>
                            <button
                                onClick={handlePremiumPayment}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                            >
                                Pay 0.1 SOL
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                            <span className="text-green-400 text-lg">✅</span>
                            <span className="font-semibold text-green-300">Premium feature activated!</span>
                            <span className="text-sm text-green-200">Form will be auto-populated below</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderCloneError = () => {
        if (!isCloneMode || !cloneError) return null;

        return (
            <div className="mb-8 dark-card rounded-xl p-6 border border-red-500/30">
                <div className="flex items-center gap-3">
                    <span className="text-red-400 text-xl">⚠️</span>
                    <div>
                        <h3 className="font-semibold text-red-300 mb-1">Clone Error</h3>
                        <p className="text-sm text-red-200">{cloneError}</p>
                    </div>
                </div>
                <div className="mt-4 flex gap-3">
                    <Link
                        href="/trending"
                        className="text-sm px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors"
                    >
                        ← Back to Trending
                    </Link>
                    <button
                        onClick={() => fetchCloneTokenData(cloneParam!)}
                        className="text-sm px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen dark-gradient-bg">
            {/* Navigation */}
            <Header />

            <div className="container mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-primary mb-6">
                        {isCloneMode ? 'Clone Trending Token' : 'Create Your Solana Token'}
                    </h1>
                    <p className="text-xl text-secondary max-w-2xl mx-auto">
                        {isCloneMode
                            ? 'Create a new token based on a successful trending token from pump.fun'
                            : 'Launch your custom token on Solana blockchain with advanced features and premium options.'
                        }
                    </p>
                </div>

                {/* Clone-specific UI */}
                {isCloneMode && loadingCloneData && (
                    <div className="text-center mb-8">
                        <div className="inline-block w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-secondary">Loading token data...</p>
                    </div>
                )}

                {renderCloneError()}
                {renderCloneHeader()}

                {!connected ? (
                    <div className="max-w-md mx-auto text-center">
                        <div className="dark-card rounded-xl p-8">
                            <h2 className="text-2xl font-bold text-primary mb-4">Connect Your Wallet</h2>
                            <p className="text-secondary mb-6">
                                Please connect your Solana wallet to continue with token creation.
                            </p>
                            <NoSSRWrapper>
                                <WalletMultiButton />
                            </NoSSRWrapper>
                        </div>
                    </div>
                ) : (
                    <TokenCreationForm
                        cloneData={isPremiumPaid ? cloneTokenData : null}
                        isCloneMode={isCloneMode}
                    />
                )}
            </div>
        </div>
    );
} 