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
            console.log('🔗 Using custom RPC endpoint:', customEndpoint);
            return customEndpoint;
        }

        // Priority 2: Use more reliable RPC endpoints (not the overloaded public ones)
        const reliableEndpoint = network === WalletAdapterNetwork.Mainnet
            ? 'https://solana-mainnet.g.alchemy.com/v2/demo' // Alchemy demo endpoint
            : 'https://solana-devnet.g.alchemy.com/v2/demo';   // Alchemy demo devnet

        console.log('🔗 Using reliable RPC endpoint:', reliableEndpoint, 'for network:', network);
        return reliableEndpoint;
    }, [network]);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter({ network }),
            new CoinbaseWalletAdapter(),
        ],
        [network]
    );

    // Add connection debugging
    useEffect(() => {
        console.log('🔧 Wallet Context Configuration:', {
            network,
            endpoint,
            nodeEnv: process.env.NODE_ENV,
            solanaNetwork: process.env.NEXT_PUBLIC_SOLANA_NETWORK,
            customRPC: process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT ? 'Set' : 'Not set'
        });
    }, [network, endpoint]);

    return (
        <ConnectionProvider
            endpoint={endpoint}
            config={{
                commitment: 'confirmed',
                confirmTransactionInitialTimeout: 15000, // Reduced to 15s for faster failure detection
                wsEndpoint: undefined, // Disable WebSocket to avoid connection issues
                httpHeaders: {
                    'Content-Type': 'application/json',
                },
                fetch: (url, options) => {
                    console.log('🌐 RPC Request to:', url);

                    // Add timeout to prevent hanging requests
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => {
                        console.warn('⏰ RPC request timeout, aborting...');
                        controller.abort();
                    }, 10000); // 10 second timeout

                    return fetch(url, {
                        ...options,
                        signal: controller.signal,
                        headers: {
                            ...options?.headers,
                            'User-Agent': 'Moonrush-Token-Creator/1.0',
                        },
                    }).then((response) => {
                        clearTimeout(timeoutId);
                        if (!response.ok) {
                            console.error('❌ RPC Response not OK:', response.status, response.statusText);
                        } else {
                            console.log('✅ RPC Request successful');
                        }
                        return response;
                    }).catch((error) => {
                        clearTimeout(timeoutId);
                        console.error('❌ RPC Request failed:', {
                            error: error.message,
                            name: error.name,
                            url,
                            timestamp: new Date().toISOString()
                        });
                        throw error;
                    });
                },
            }}
        >
            <WalletProvider
                wallets={wallets}
                autoConnect={false} // Changed to false to prevent auto-connection issues
                onError={(error) => {
                    console.error('❌ Wallet connection error:', {
                        error,
                        message: error.message,
                        name: error.name,
                        stack: error.stack,
                        timestamp: new Date().toISOString()
                    });
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