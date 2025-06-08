'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { NoSSRWrapper } from '@/components/WalletContextProvider';
import { TokenCreationForm } from '@/components/TokenCreationForm';

export default function CreateToken() {
    const { connected } = useWallet();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            {/* Navigation */}
            <nav className="flex justify-between items-center p-6">
                <div className="text-2xl font-bold text-white">
                    Solana Token Launcher
                </div>
                <NoSSRWrapper>
                    <WalletMultiButton />
                </NoSSRWrapper>
            </nav>

            <div className="container mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-white mb-6">
                        Create Your SPL Token
                    </h1>
                    <p className="text-xl text-purple-200 max-w-2xl mx-auto">
                        Launch your custom token on Solana blockchain with advanced features and premium options.
                    </p>
                </div>

                {!connected ? (
                    <div className="max-w-md mx-auto text-center">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
                            <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
                            <p className="text-purple-200 mb-6">
                                Please connect your Solana wallet to continue with token creation.
                            </p>
                            <NoSSRWrapper>
                                <WalletMultiButton />
                            </NoSSRWrapper>
                        </div>
                    </div>
                ) : (
                    <TokenCreationForm />
                )}
            </div>
        </div>
    );
} 