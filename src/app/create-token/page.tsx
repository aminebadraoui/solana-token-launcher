'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { NoSSRWrapper } from '@/components/WalletContextProvider';
import { TokenCreationForm } from '@/components/TokenCreationForm';
import { Header } from '@/components/Header';
import Link from 'next/link';

export default function CreateToken() {
    const { connected } = useWallet();

    return (
        <div className="min-h-screen dark-gradient-bg">
            {/* Navigation */}
            <Header />

            <div className="container mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-primary mb-6">
                        Create Your Solana Token
                    </h1>
                    <p className="text-xl text-secondary max-w-2xl mx-auto">
                        Launch your custom token on Solana blockchain with advanced features and premium options.
                    </p>
                </div>

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
                    <TokenCreationForm />
                )}
            </div>
        </div>
    );
} 