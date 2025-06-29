'use client';

import Link from 'next/link';
import { useUser } from '@/lib/userContext';
import { useWallet } from '@solana/wallet-adapter-react';

export default function Dashboard() {
    const { user, userTokens } = useUser();
    const { publicKey } = useWallet();

    const recentTokens = userTokens.slice(0, 3);

    const quickActions = [
        {
            title: 'Create New Token',
            description: 'Launch a new SPL token on Solana',
            href: '/dashboard/create-token',
            icon: '🚀',
            color: 'from-purple-500 to-pink-500',
        },
        {
            title: 'Clone Token',
            description: 'Clone popular tokens from trending',
            href: '/dashboard/clone-token',
            icon: '📋',
            color: 'from-blue-500 to-purple-500',
        },
        {
            title: 'Manage Wallets',
            description: 'View and manage your connected wallets',
            href: '/dashboard/wallets',
            icon: '👛',
            color: 'from-green-500 to-blue-500',
        },
    ];



    return (
        <div className="h-full flex flex-col space-y-8">
            {/* Header */}
            <div className="flex-shrink-0">
                <h1 className="hero-title text-4xl font-bold text-primary">Welcome back!</h1>
                <p className="text-secondary mt-2">
                    Ready to launch your next token? Let's make it happen.
                </p>
            </div>



            {/* Quick Actions */}
            <div className="flex-1">
                <h2 className="section-title text-2xl font-bold text-primary mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {quickActions.map((action) => (
                        <Link
                            key={action.title}
                            href={action.href}
                            className="group dark-card rounded-xl p-6 hover:scale-105 transition-all duration-300 hover:shadow-lg border border-white/5"
                        >
                            <div className="flex items-center space-x-4">
                                <div className={`flex-shrink-0 rounded-lg bg-gradient-to-r ${action.color} p-3 group-hover:scale-110 transition-transform duration-300`}>
                                    <span className="text-2xl">{action.icon}</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-primary group-hover:text-purple-light transition-colors duration-300">
                                        {action.title}
                                    </h3>
                                    <p className="text-sm text-secondary mt-1">{action.description}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Tokens */}
            {recentTokens.length > 0 && (
                <div className="flex-shrink-0">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="section-title text-2xl font-bold text-primary">Recent Tokens</h2>
                        <Link
                            href="/dashboard/tokens"
                            className="text-purple-400 hover:text-purple-light transition-colors duration-300 text-sm font-medium"
                        >
                            View all →
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {recentTokens.map((token) => (
                            <div
                                key={token.mint_address}
                                className="dark-card rounded-xl p-4 hover:scale-105 transition-all duration-300 border border-white/5"
                            >
                                <div className="flex items-center space-x-3">
                                    {token.image_url ? (
                                        <img
                                            src={token.image_url}
                                            alt={token.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                            <span className="text-white font-semibold text-sm">
                                                {token.symbol.slice(0, 2)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-primary truncate">{token.name}</p>
                                        <p className="text-xs text-secondary truncate">{token.symbol}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {userTokens.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-6xl mb-4 animate-bounce">🚀</div>
                        <h3 className="section-title text-xl font-semibold text-primary mb-2">No tokens yet</h3>
                        <p className="text-secondary mb-6">Create your first token to get started!</p>
                        <Link
                            href="/dashboard/create-token"
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
                        >
                            <span className="mr-2">🚀</span>
                            Create Your First Token
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
} 