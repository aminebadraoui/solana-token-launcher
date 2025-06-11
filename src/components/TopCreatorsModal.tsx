'use client';

import { useState, useEffect } from 'react';

interface TopCreator {
    address: string;
    tokensCreated: number;
    rank: number;
}

interface TopCreatorsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectCreator: (address: string) => void;
    currentCreator?: string;
}

export default function TopCreatorsModal({
    isOpen,
    onClose,
    onSelectCreator,
    currentCreator
}: TopCreatorsModalProps) {
    const [creators, setCreators] = useState<TopCreator[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchTopCreators();
        }
    }, [isOpen]);

    const fetchTopCreators = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('🌐 Fetching top pump.fun creators...');
            const response = await fetch('/api/top-creators');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setCreators(data.creators || []);
                console.log(`✅ Loaded ${data.creators?.length || 0} top creators`);
            } else {
                throw new Error(data.error || 'Failed to fetch creators');
            }
        } catch (err) {
            console.error('❌ Error fetching top creators:', err);
            setError(err instanceof Error ? err.message : 'Failed to load top creators');
        } finally {
            setLoading(false);
        }
    };

    const handleCreatorSelect = (creator: TopCreator) => {
        onSelectCreator(creator.address);
        onClose();
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const isCurrentCreator = (address: string) => {
        return currentCreator === address;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-700">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Top Pump.fun Creators</h2>
                            <p className="text-gray-400 mt-1">
                                Select a successful creator to use their address
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                            <span className="ml-3 text-gray-400">Loading top creators...</span>
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-12">
                            <p className="text-red-400 mb-4">❌ {error}</p>
                            <button
                                onClick={fetchTopCreators}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {!loading && !error && creators.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-400">No creators found</p>
                        </div>
                    )}

                    {!loading && !error && creators.length > 0 && (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {creators.map((creator) => (
                                <div
                                    key={creator.address}
                                    onClick={() => handleCreatorSelect(creator)}
                                    className={`
                                        p-4 rounded-lg border cursor-pointer transition-all
                                        ${isCurrentCreator(creator.address)
                                            ? 'border-green-500 bg-green-500/10'
                                            : 'border-gray-700 hover:border-purple-500 hover:bg-purple-500/10'
                                        }
                                    `}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full text-sm font-bold">
                                                #{creator.rank}
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-mono text-white">
                                                        {formatAddress(creator.address)}
                                                    </span>
                                                    {isCurrentCreator(creator.address) && (
                                                        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                                                            CURRENT
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-gray-400 text-sm">
                                                    {creator.tokensCreated} tokens created
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm text-gray-400">
                                                🚀 {creator.tokensCreated}
                                            </span>
                                            {!isCurrentCreator(creator.address) && (
                                                <button className="text-purple-400 hover:text-purple-300 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!loading && !error && creators.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-700 bg-gray-800/50">
                        <p className="text-xs text-gray-400 text-center">
                            💡 Data shows creators ranked by number of pump.fun tokens created
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
} 