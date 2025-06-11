import React, { useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import {
    getSuggestedCreatorWallets,
    validateCreatorWallet,
    findWalletsInRange,
    WalletInfo
} from '../lib/walletFinder';

interface WalletFinderProps {
    onSelectWallet: (address: string) => void;
    currentCreator?: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function WalletFinder({
    onSelectWallet,
    currentCreator,
    isOpen,
    onClose
}: WalletFinderProps) {
    const { connection } = useConnection();
    const [suggestedWallets, setSuggestedWallets] = useState<WalletInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [customWallet, setCustomWallet] = useState<WalletInfo | null>(null);
    const [minBalance, setMinBalance] = useState('1');
    const [maxBalance, setMaxBalance] = useState('10000');
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadSuggestedWallets();
        }
    }, [isOpen]);

    const loadSuggestedWallets = async () => {
        setLoading(true);
        try {
            console.log('🔄 Loading fresh wallet data...');
            const wallets = await getSuggestedCreatorWallets(connection);
            setSuggestedWallets(wallets);
            console.log(`✅ Loaded ${wallets.length} suggested wallets`);
        } catch (error) {
            console.error('Error loading suggested wallets:', error);
        } finally {
            setLoading(false);
        }
    };

    const searchWalletsByRange = async () => {
        setSearchLoading(true);
        try {
            const min = parseFloat(minBalance) || 0;
            const max = parseFloat(maxBalance) || 10000;
            console.log(`🔍 UI: Starting range search ${min} - ${max} SOL`);

            const wallets = await findWalletsInRange(connection, min, max, 20);
            console.log(`📊 UI: Found ${wallets.length} wallets in range`);
            setSuggestedWallets(wallets);
        } catch (error) {
            console.error('Error searching wallets:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    const validateCustomWallet = async (address: string) => {
        if (!address.trim()) {
            setCustomWallet(null);
            return;
        }

        try {
            const result = await validateCreatorWallet(connection, address);
            if (result.isValid) {
                setCustomWallet({
                    address,
                    balance: result.balance,
                    lamports: result.balance * 1000000000,
                    formattedBalance: result.balance.toFixed(4),
                    isValidCreator: true,
                });
            } else {
                setCustomWallet({
                    address,
                    balance: result.balance,
                    lamports: result.balance * 1000000000,
                    formattedBalance: result.balance.toFixed(4),
                    isValidCreator: false,
                });
            }
        } catch (error) {
            console.error('Error validating wallet:', error);
            setCustomWallet(null);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add a toast notification here
    };

    const openInSolscan = (address: string) => {
        window.open(`https://solscan.io/account/${address}`, '_blank');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Creator Wallet Finder</h2>
                            <p className="text-gray-600 mt-1">Find high-SOL wallets from live rich list data</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                        >
                            ×
                        </button>
                    </div>

                    {/* Dynamic Rich List Notice */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-2">
                            <span className="text-blue-600 text-lg">🔄</span>
                            <div>
                                <h3 className="font-semibold text-blue-900">Live Rich List Data</h3>
                                <p className="text-blue-700 text-sm mt-1">
                                    <strong>Dynamic wallet discovery!</strong> This tool fetches live data from Solana's rich list,
                                    filtering out exchanges and institutions to find individual whale addresses.
                                    Data updates every 30 minutes from CoinCarp's live Solana rich list.
                                </p>
                                <div className="mt-2 text-xs text-green-700 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Real-time creator wallet discovery
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Custom Wallet Input */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 text-gray-900">Enter Custom Wallet</h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    validateCustomWallet(e.target.value);
                                }}
                                placeholder="Enter Solana wallet address..."
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        {customWallet && (
                            <div className="mt-3 p-3 border rounded-lg bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openInSolscan(customWallet.address)}
                                                className="font-mono text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                                title="View on Solscan"
                                            >
                                                {customWallet.address.slice(0, 8)}...{customWallet.address.slice(-8)} 🔗
                                            </button>
                                            <button
                                                onClick={() => copyToClipboard(customWallet.address)}
                                                className="text-gray-400 hover:text-gray-600 text-xs"
                                                title="Copy address"
                                            >
                                                📋
                                            </button>
                                        </div>
                                        <div className="text-sm text-gray-800 font-medium mt-1">
                                            Balance: {customWallet.formattedBalance} SOL
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${customWallet.isValidCreator
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {customWallet.isValidCreator ? 'Valid Creator' : 'Low Balance'}
                                        </span>
                                        <button
                                            onClick={() => onSelectWallet(customWallet.address)}
                                            className="bg-purple-600 text-white px-4 py-1 rounded text-sm hover:bg-purple-700"
                                        >
                                            Select
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Balance Range Search */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 text-gray-900">Search by Balance Range</h3>
                        <div className="flex gap-3 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Min SOL</label>
                                <input
                                    type="number"
                                    value={minBalance}
                                    onChange={(e) => setMinBalance(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="0"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Max SOL</label>
                                <input
                                    type="number"
                                    value={maxBalance}
                                    onChange={(e) => setMaxBalance(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="10000"
                                />
                            </div>
                            <button
                                onClick={searchWalletsByRange}
                                disabled={searchLoading}
                                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 h-10"
                            >
                                {searchLoading ? '🔍' : 'Search'}
                            </button>
                        </div>
                    </div>

                    {/* Suggested Wallets */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {suggestedWallets.length > 0 ? `Found ${suggestedWallets.length} Wallets` : 'High-SOL Wallets'}
                            </h3>
                            <button
                                onClick={loadSuggestedWallets}
                                disabled={loading}
                                className="text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
                            >
                                {loading ? '🔄 Loading...' : 'Refresh'}
                            </button>
                        </div>

                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                    <p className="text-gray-600 mt-2">Scanning wallets...</p>
                                </div>
                            ) : suggestedWallets.length > 0 ? (
                                suggestedWallets.map((wallet, index) => (
                                    <div
                                        key={wallet.address}
                                        className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors ${currentCreator === wallet.address ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-500 font-medium">#{index + 1}</span>
                                                    <button
                                                        onClick={() => openInSolscan(wallet.address)}
                                                        className="font-mono text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                                        title="View on Solscan"
                                                    >
                                                        {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)} 🔗
                                                    </button>
                                                    <button
                                                        onClick={() => copyToClipboard(wallet.address)}
                                                        className="text-gray-400 hover:text-gray-600 text-xs"
                                                        title="Copy address"
                                                    >
                                                        📋
                                                    </button>
                                                </div>
                                                <div className="text-sm text-gray-800 font-medium mt-1">
                                                    Balance: {wallet.formattedBalance} SOL
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {wallet.isValidCreator && (
                                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                                        Valid Creator
                                                    </span>
                                                )}
                                                {currentCreator === wallet.address && (
                                                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                                                        Current
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => onSelectWallet(wallet.address)}
                                                    className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700"
                                                >
                                                    Select
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No wallets found. Try adjusting the balance range or refresh the list.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Help Section */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">💡 Why use high-SOL wallets as creators?</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                            <li>• <strong>Credibility:</strong> Higher SOL balance suggests legitimacy and trust</li>
                            <li>• <strong>Visibility:</strong> Whale wallets are often tracked and noticed by the community</li>
                            <li>• <strong>Network effect:</strong> Associated with successful projects and traders</li>
                            <li>• <strong>Marketing value:</strong> High-balance creators can attract more attention</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
} 