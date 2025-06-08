'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import { TokenCreationForm } from '@/components/TokenCreationForm';

export default function CreateToken() {
    const { connected } = useWallet();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            {/* Navigation */}
            <nav className="flex justify-between items-center p-6">
                <Link href="/" className="text-2xl font-bold text-white hover:text-purple-300 transition-colors">
                    Solana Token Launcher
                </Link>
                <WalletMultiButton />
            </nav>

            <div className="container mx-auto px-6 py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-bold text-white mb-4">
                            Create Your Token
                        </h1>
                        <p className="text-xl text-gray-300">
                            Fill out the form below to create your SPL token on Solana
                        </p>
                    </div>

                    {!connected ? (
                        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-12 text-center">
                            <div className="text-6xl mb-6">🔗</div>
                            <h2 className="text-2xl font-bold text-white mb-4">
                                Connect Your Wallet
                            </h2>
                            <p className="text-gray-300 mb-8">
                                Please connect your Solana wallet to continue with token creation
                            </p>
                            <WalletMultiButton />
                        </div>
                    ) : (
                        <TokenCreationForm />
                    )}
                </div>
            </div>
        </div>
    );
} 