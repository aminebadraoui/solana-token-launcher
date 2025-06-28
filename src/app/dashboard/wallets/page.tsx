'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useUser } from '@/lib/userContext';

export default function WalletsPage() {
    const { connected, publicKey, wallet, disconnect } = useWallet();
    const { user, userTokens } = useUser();
    const [showPrivateKey, setShowPrivateKey] = useState(false);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            // You could add a toast notification here
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const walletInfo = {
        address: publicKey?.toString() || '',
        name: wallet?.adapter.name || 'Unknown',
        icon: wallet?.adapter.icon || '',
        connected: connected,
        tokensCreated: userTokens.length,
        url: wallet?.adapter.url || '',
    };

    const walletActions = [
        {
            name: 'Copy Address',
            action: () => copyToClipboard(walletInfo.address),
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            ),
            color: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400',
        },
        {
            name: 'View on Solscan',
            action: () => window.open(`https://solscan.io/account/${walletInfo.address}`, '_blank'),
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
            ),
            color: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400',
        },
        {
            name: 'Disconnect',
            action: disconnect,
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            ),
            color: 'bg-red-500/20 hover:bg-red-500/30 text-red-400',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="hero-title text-3xl font-bold text-primary">My Wallets</h1>
                <p className="text-secondary mt-1">
                    Manage your connected wallets and view account information
                </p>
            </div>

            {/* Connected Wallet Card */}
            {connected && (
                <div className="dark-card rounded-xl p-6 group hover:scale-105 transition-all duration-300">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            {walletInfo.icon && (
                                <img
                                    src={walletInfo.icon}
                                    alt={walletInfo.name}
                                    className="w-12 h-12 rounded-lg group-hover:scale-110 transition-transform duration-300"
                                />
                            )}
                            <div>
                                <h3 className="text-primary font-semibold text-lg flex items-center space-x-2">
                                    <span>{walletInfo.name}</span>
                                    <span className="bg-green-500/20 text-green-400 px-2 py-1 text-xs rounded-full animate-pulse">
                                        Connected
                                    </span>
                                </h3>
                                <p className="text-secondary text-sm mt-1">Primary wallet</p>
                            </div>
                        </div>
                    </div>

                    {/* Wallet Details */}
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="text-secondary text-sm block mb-2">Wallet Address</label>
                            <div className="dark-input border-subtle rounded-lg p-3 flex items-center justify-between">
                                <span className="text-primary font-mono text-sm break-all">
                                    {walletInfo.address}
                                </span>
                                <button
                                    onClick={() => copyToClipboard(walletInfo.address)}
                                    className="ml-2 text-purple-light hover:text-purple-400 transition-all duration-300 hover:scale-110"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="dark-card rounded-lg p-4 hover:scale-105 transition-all duration-300">
                                <p className="text-secondary text-sm">Tokens Created</p>
                                <p className="text-primary stats-number text-2xl font-bold mt-1">{walletInfo.tokensCreated}</p>
                            </div>
                            <div className="dark-card rounded-lg p-4 hover:scale-105 transition-all duration-300">
                                <p className="text-secondary text-sm">Network</p>
                                <p className="text-primary text-lg font-medium mt-1">
                                    {process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'MAINNET' ? 'Mainnet' : 'Devnet'}
                                </p>
                            </div>
                            <div className="dark-card rounded-lg p-4 hover:scale-105 transition-all duration-300">
                                <p className="text-secondary text-sm">Wallet Type</p>
                                <p className="text-primary text-lg font-medium mt-1">{walletInfo.name}</p>
                            </div>
                        </div>
                    </div>

                    {/* Wallet Actions */}
                    <div className="border-t border-subtle pt-4">
                        <p className="text-secondary text-sm mb-3">Quick Actions</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {walletActions.map((action) => (
                                <button
                                    key={action.name}
                                    onClick={action.action}
                                    className={`flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-all duration-300 hover:scale-105 ${action.color}`}
                                >
                                    {action.icon}
                                    <span className="text-sm font-medium">{action.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Security Information */}
            <div className="dark-card rounded-xl p-6">
                <h3 className="text-primary font-semibold text-lg mb-4 flex items-center space-x-2">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Security & Privacy</span>
                </h3>

                <div className="space-y-4 text-secondary text-sm">
                    <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <p>Your private keys are never stored or transmitted by our application</p>
                    </div>
                    <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <p>All transactions are signed securely within your wallet</p>
                    </div>
                    <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <p>We only store public wallet addresses and token creation data</p>
                    </div>
                    <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                        <p>Always verify transaction details before signing</p>
                    </div>
                </div>
            </div>

            {/* Wallet Connection Guide */}
            <div className="dark-card rounded-xl p-6">
                <h3 className="section-title text-primary font-semibold text-lg mb-4">Supported Wallets</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 dark-card rounded-lg hover:scale-105 transition-all duration-300">
                        <div className="text-2xl mb-2">👻</div>
                        <h4 className="text-primary font-medium">Phantom</h4>
                        <p className="text-secondary text-sm mt-1">Most popular Solana wallet</p>
                    </div>
                    <div className="text-center p-4 dark-card rounded-lg hover:scale-105 transition-all duration-300">
                        <div className="text-2xl mb-2">🔥</div>
                        <h4 className="text-primary font-medium">Solflare</h4>
                        <p className="text-secondary text-sm mt-1">Feature-rich wallet with staking</p>
                    </div>
                    <div className="text-center p-4 dark-card rounded-lg hover:scale-105 transition-all duration-300">
                        <div className="text-2xl mb-2">🏦</div>
                        <h4 className="text-primary font-medium">Coinbase</h4>
                        <p className="text-secondary text-sm mt-1">Exchange-backed wallet</p>
                    </div>
                </div>
            </div>
        </div>
    );
} 