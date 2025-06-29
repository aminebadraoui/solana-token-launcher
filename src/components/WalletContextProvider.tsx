'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-coinbase';
import { clusterApiUrl } from '@solana/web3.js';
import { setupPhantomEventListeners } from '@/lib/walletUtils';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

// NoSSRWrapper component to prevent hydration mismatches
export function NoSSRWrapper({ children }: { children: React.ReactNode }) {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    // Don't render anything on server-side to prevent hydration mismatch
    if (!hasMounted) {
        return null;
    }

    return <>{children}</>;
}

export function WalletContextProvider({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    // Handle client-side mounting to prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

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

        // Priority 2: Use original Solana public RPC endpoints (they work fine)
        const publicEndpoint = network === WalletAdapterNetwork.Mainnet
            ? 'https://api.mainnet-beta.solana.com'
            : 'https://api.devnet.solana.com';

        console.log('🔗 Using public RPC endpoint:', publicEndpoint, 'for network:', network);
        return publicEndpoint;
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
            network: network,
            endpoint: endpoint,
            nodeEnv: process.env.NODE_ENV,
            solanaNetwork: process.env.NEXT_PUBLIC_SOLANA_NETWORK,
            customRPC: process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT ? 'Set' : 'Not set'
        });

        // Test the RPC endpoint
        const testConnection = async () => {
            try {
                console.log('🔧 Testing RPC endpoint:', endpoint);
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: 1,
                        method: 'getVersion',
                        params: []
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                console.log('✅ RPC endpoint test successful:', data);
            } catch (error) {
                console.error('❌ RPC endpoint test failed:', error);
                console.error('❌ This may cause balance loading issues');
            }
        };

        testConnection();
    }, [network, endpoint]);

    // Setup Phantom event listeners (following official example)
    useEffect(() => {
        const cleanup = setupPhantomEventListeners(
            (publicKey) => {
                console.log('🔗 Phantom wallet connected:', publicKey.toString());
            },
            () => {
                console.log('👋 Phantom wallet disconnected');
            },
            (publicKey) => {
                if (publicKey) {
                    console.log('🔄 Phantom account changed to:', publicKey.toString());
                } else {
                    console.log('🔄 Phantom account changed - reconnecting...');
                }
            }
        );

        return cleanup; // Cleanup event listeners on unmount
    }, []);

    return (
        <div suppressHydrationWarning>
            <ConnectionProvider
                endpoint={endpoint}
                config={{
                    commitment: 'confirmed',
                    confirmTransactionInitialTimeout: 30000,
                    wsEndpoint: undefined, // Disable WebSocket to avoid connection issues
                }}
            >
                <WalletProvider
                    wallets={wallets}
                    autoConnect={mounted} // Only autoConnect after client-side mounting
                    onError={(error) => {
                        console.error('❌ Wallet connection error:', {
                            error,
                            message: error.message,
                            name: error.name,
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
        </div>
    );
} 