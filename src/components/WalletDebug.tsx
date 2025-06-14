'use client';

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';

export function WalletDebug() {
    const { wallet, connected, connecting, disconnecting, publicKey } = useWallet();
    const { connection } = useConnection();
    const [connectionInfo, setConnectionInfo] = useState<any>(null);

    useEffect(() => {
        const getConnectionInfo = async () => {
            try {
                const version = await connection.getVersion();
                const slot = await connection.getSlot();
                setConnectionInfo({
                    endpoint: connection.rpcEndpoint,
                    version,
                    slot,
                    commitment: connection.commitment,
                });
            } catch (error) {
                console.error('Failed to get connection info:', error);
                setConnectionInfo({
                    endpoint: connection.rpcEndpoint,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        };

        getConnectionInfo();
    }, [connection]);

    // Only show in development or when there are connection issues
    if (process.env.NODE_ENV === 'production' && connected) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 text-xs font-mono text-gray-300 max-w-sm z-50">
            <div className="font-bold text-purple-400 mb-2">🔧 Wallet Debug</div>

            <div className="space-y-1">
                <div>
                    <span className="text-gray-500">Status:</span>{' '}
                    <span className={`${connected ? 'text-green-400' : connecting ? 'text-yellow-400' : 'text-red-400'}`}>
                        {connected ? 'Connected' : connecting ? 'Connecting...' : disconnecting ? 'Disconnecting...' : 'Disconnected'}
                    </span>
                </div>

                <div>
                    <span className="text-gray-500">Wallet:</span>{' '}
                    <span className="text-blue-400">{wallet?.adapter.name || 'None'}</span>
                </div>

                {publicKey && (
                    <div>
                        <span className="text-gray-500">Address:</span>{' '}
                        <span className="text-green-400">{publicKey.toString().slice(0, 8)}...</span>
                    </div>
                )}

                <div>
                    <span className="text-gray-500">RPC:</span>{' '}
                    <span className="text-blue-400 break-all">{connectionInfo?.endpoint}</span>
                </div>

                {connectionInfo?.version && (
                    <div>
                        <span className="text-gray-500">Version:</span>{' '}
                        <span className="text-green-400">{connectionInfo.version['solana-core']}</span>
                    </div>
                )}

                {connectionInfo?.error && (
                    <div>
                        <span className="text-gray-500">Error:</span>{' '}
                        <span className="text-red-400">{connectionInfo.error}</span>
                    </div>
                )}

                <div className="text-gray-500 text-xs mt-2">
                    Environment: {process.env.NODE_ENV}
                </div>
            </div>
        </div>
    );
} 