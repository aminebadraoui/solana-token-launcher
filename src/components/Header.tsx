'use client';

import Link from 'next/link';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { NoSSRWrapper } from '@/components/WalletContextProvider';
import { useState, useEffect } from 'react';
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';

export function Header() {
    const { publicKey, connected } = useWallet();
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!connected || !publicKey) {
            setBalance(0);
            return;
        }

        const loadBalance = async () => {
            setLoading(true);
            try {
                const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
                const connection = new Connection(endpoint, 'confirmed');
                const balanceInLamports = await connection.getBalance(publicKey);
                const balanceInSol = balanceInLamports / LAMPORTS_PER_SOL;
                setBalance(balanceInSol);
            } catch (error) {
                console.error('Error loading balance:', error);
                setBalance(0);
            } finally {
                setLoading(false);
            }
        };

        loadBalance();
    }, [connected, publicKey?.toString()]);

    return (
        <nav className="flex justify-between items-center p-6 relative z-50">
            <Link href="/" className="group transition-all duration-300 hover:scale-105">
                <span className="hero-title text-3xl font-bold gradient-moon">
                    MOONRUSH
                </span>
            </Link>

            <NoSSRWrapper>
                <div className="flex items-center gap-3">
                    {connected && publicKey && (
                        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-1">
                                <span className="text-sm text-gray-300">Balance:</span>
                                {loading ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b border-purple-500"></div>
                                ) : (
                                    <span className="text-sm font-semibold text-white">
                                        {balance.toFixed(4)} SOL
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                    <WalletMultiButton className="!bg-gradient-to-r !from-purple-500 !to-pink-500 !text-white !font-medium !py-2 !px-4 !rounded-lg hover:!from-purple-600 hover:!to-pink-600 !transition-all !duration-300 !transform hover:!scale-105" />
                </div>
            </NoSSRWrapper>
        </nav>
    );
} 