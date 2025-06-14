'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-coinbase';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

// NoSSRWrapper component to prevent hydration mismatches
export function NoSSRWrapper({ children }: { children: React.ReactNode }) {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) {
        return (
            <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-medium">
                Connect Wallet
            </button>
        );
    }

    return <>{children}</>;
}

export function WalletContextProvider({ children }: { children: React.ReactNode }) {
    const network = WalletAdapterNetwork.Devnet;

    // Use environment variable or fallback to reliable RPC endpoints
    const endpoint = useMemo(() => {
        // Check for custom RPC endpoint in environment variables
        const customEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT;
        if (customEndpoint) {
            return customEndpoint;
        }

        // Production: Use reliable third-party RPC
        if (process.env.NODE_ENV === 'production') {
            return 'https://api.devnet.solana.com';
        }

        // Development: Use default Solana RPC
        return clusterApiUrl(network);
    }, [network]);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter({ network }),
            new CoinbaseWalletAdapter(),
        ],
        [network]
    );

    return (
        <ConnectionProvider
            endpoint={endpoint}
            config={{
                commitment: 'confirmed',
                confirmTransactionInitialTimeout: 60000,
                wsEndpoint: undefined, // Disable WebSocket in production to avoid connection issues
            }}
        >
            <WalletProvider
                wallets={wallets}
                autoConnect={true}
                onError={(error) => {
                    console.error('Wallet connection error:', error);
                    // Don't throw the error to prevent app crashes
                }}
            >
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
} 