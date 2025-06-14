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
    // Switch network based on environment variable
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'MAINNET'
        ? WalletAdapterNetwork.Mainnet
        : WalletAdapterNetwork.Devnet;

    // Use environment variable or fallback to reliable RPC endpoints
    const endpoint = useMemo(() => {
        // Priority 1: Check for custom RPC endpoint (your QuickNode endpoint)
        const customEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT;
        if (customEndpoint) {
            return customEndpoint;
        }

        // Priority 2: Production - Use reliable third-party RPC based on network
        if (process.env.NODE_ENV === 'production') {
            return network === WalletAdapterNetwork.Mainnet
                ? 'https://api.mainnet-beta.solana.com'
                : 'https://api.devnet.solana.com';
        }

        // Priority 3: Development - Use default Solana RPC
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