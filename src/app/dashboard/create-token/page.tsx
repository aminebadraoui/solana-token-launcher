'use client';

import { TokenCreationForm } from '@/components/TokenCreationForm';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface PumpFunToken {
    mintAddress: string;
    name: string;
    symbol: string;
    description?: string;
    imageUri?: string;
    metadataUri?: string;
    creatorAddress?: string;
    price: number;
    priceInUSD: number;
    marketCap: number;
    graduationProgress: number;
    creationTime: string;
}

function CreateTokenContent() {
    const searchParams = useSearchParams();
    const cloneMintAddress = searchParams.get('clone');
    const [cloneData, setCloneData] = useState<PumpFunToken | null>(null);
    const [isLoadingClone, setIsLoadingClone] = useState(false);
    const [cloneError, setCloneError] = useState<string | null>(null);

    useEffect(() => {
        if (cloneMintAddress) {
            fetchTokenData(cloneMintAddress);
        }
    }, [cloneMintAddress]);

    const fetchTokenData = async (mintAddress: string) => {
        setIsLoadingClone(true);
        setCloneError(null);

        try {
            // Fetch from trending tokens API first
            const response = await fetch('/api/trending-tokens?limit=50');
            const data = await response.json();

            if (data.success && data.graduatingTokens) {
                const token = data.graduatingTokens.find((t: PumpFunToken) => t.mintAddress === mintAddress);
                if (token) {
                    setCloneData(token);
                    return;
                }
            }

            // If not found in trending, you could add additional API calls here
            setCloneError('Token not found in trending tokens');
        } catch (error) {
            console.error('Error fetching token data:', error);
            setCloneError('Failed to fetch token data');
        } finally {
            setIsLoadingClone(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="hero-title text-3xl font-bold text-primary">
                    {cloneMintAddress ? 'Clone Token' : 'Create Token'}
                </h1>
                <p className="text-secondary mt-1">
                    {cloneMintAddress
                        ? 'Create a new token based on an existing successful token'
                        : 'Launch your new SPL token on Solana blockchain'
                    }
                </p>
            </div>

            {/* Clone Status */}
            {cloneMintAddress && (
                <div className="dark-card rounded-xl p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                    {isLoadingClone && (
                        <div className="flex items-center space-x-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                            <span className="text-blue-400">Loading token data for cloning...</span>
                        </div>
                    )}
                    {cloneError && (
                        <div className="flex items-center space-x-3">
                            <div className="text-red-400">⚠️</div>
                            <span className="text-red-400">{cloneError}</span>
                        </div>
                    )}
                    {cloneData && !isLoadingClone && (
                        <div className="flex items-center space-x-3">
                            <div className="text-green-400">✅</div>
                            <span className="text-green-400">
                                Cloning token: <strong>{cloneData.name} (${cloneData.symbol})</strong>
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Token Creation Form */}
            <div className="dark-card rounded-xl p-6">
                <TokenCreationForm
                    cloneData={cloneData}
                    isCloneMode={!!cloneMintAddress}
                />
            </div>
        </div>
    );
}

export default function CreateTokenPage() {
    return (
        <Suspense fallback={
            <div className="space-y-6">
                <div>
                    <h1 className="hero-title text-3xl font-bold text-primary">Create Token</h1>
                    <p className="text-secondary mt-1">Loading...</p>
                </div>
                <div className="dark-card rounded-xl p-6 animate-pulse">
                    <div className="h-96 bg-gray-600 rounded"></div>
                </div>
            </div>
        }>
            <CreateTokenContent />
        </Suspense>
    );
} 