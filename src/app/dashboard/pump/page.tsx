'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/userContext';

export default function PumpPage() {
    const { user, userTokens } = useUser();
    const [selectedToken, setSelectedToken] = useState<string>('');
    const [selectedWallets, setSelectedWallets] = useState<string[]>([]);
    const [buyAmount, setBuyAmount] = useState<string>('0.01');
    const [minInterval, setMinInterval] = useState<number>(30);
    const [maxInterval, setMaxInterval] = useState<number>(300);
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    };

    const startPump = () => {
        if (!selectedToken || selectedWallets.length === 0) {
            addLog('❌ Please select a token and at least one wallet');
            return;
        }

        setIsRunning(true);
        addLog(`🚀 Starting pump for token: ${selectedToken}`);
        addLog(`💰 Buy amount: ${buyAmount} SOL per transaction`);
        addLog(`⏰ Interval: ${minInterval}s - ${maxInterval}s`);
        addLog(`🔗 Using ${selectedWallets.length} wallet(s)`);

        // Simulate pump activity (placeholder for actual implementation)
        const interval = setInterval(() => {
            const randomWallet = selectedWallets[Math.floor(Math.random() * selectedWallets.length)];
            const randomDelay = Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval;

            addLog(`💸 Buying ${buyAmount} SOL of ${selectedToken} from wallet ${randomWallet.slice(0, 8)}...`);

            // Schedule next transaction
            setTimeout(() => {
                addLog(`✅ Transaction completed from ${randomWallet.slice(0, 8)}...`);
            }, 2000);
        }, 5000);

        // Store interval ID for cleanup
        (window as any).pumpInterval = interval;
    };

    const stopPump = () => {
        setIsRunning(false);
        if ((window as any).pumpInterval) {
            clearInterval((window as any).pumpInterval);
        }
        addLog('⏹️ Pump stopped');
    };

    return (
        <div className="space-y-6">
            <div className="dark-card p-6">
                <h1 className="text-2xl font-bold text-primary mb-2">Token Pump</h1>
                <p className="text-secondary mb-6">
                    Automate token purchases using your managed wallets at random intervals to create trading activity.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Configuration */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-primary">Configuration</h3>

                        {/* Token Selection */}
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-2">
                                Select Token to Pump
                            </label>
                            <select
                                value={selectedToken}
                                onChange={(e) => setSelectedToken(e.target.value)}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Choose a token...</option>
                                {userTokens.map((token) => (
                                    <option key={token.mint} value={token.mint}>
                                        {token.name} ({token.symbol})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Buy Amount */}
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-2">
                                Buy Amount (SOL per transaction)
                            </label>
                            <input
                                type="number"
                                step="0.001"
                                min="0.001"
                                value={buyAmount}
                                onChange={(e) => setBuyAmount(e.target.value)}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        {/* Interval Settings */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">
                                    Min Interval (seconds)
                                </label>
                                <input
                                    type="number"
                                    min="10"
                                    value={minInterval}
                                    onChange={(e) => setMinInterval(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">
                                    Max Interval (seconds)
                                </label>
                                <input
                                    type="number"
                                    min="10"
                                    value={maxInterval}
                                    onChange={(e) => setMaxInterval(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>

                        {/* Wallet Selection */}
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-2">
                                Select Wallets (Coming Soon)
                            </label>
                            <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                                <p className="text-sm text-secondary">
                                    Wallet selection will be available once the multi-wallet system is fully integrated.
                                </p>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex gap-4">
                            {!isRunning ? (
                                <button
                                    onClick={startPump}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium py-2 px-4 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105"
                                >
                                    🚀 Start Pump
                                </button>
                            ) : (
                                <button
                                    onClick={stopPump}
                                    className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium py-2 px-4 rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
                                >
                                    ⏹️ Stop Pump
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Activity Log */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-primary">Activity Log</h3>
                        <div className="bg-black/20 border border-white/10 rounded-lg p-4 h-96 overflow-y-auto">
                            {logs.length === 0 ? (
                                <p className="text-secondary text-sm">No activity yet. Configure and start pumping to see logs.</p>
                            ) : (
                                <div className="space-y-1">
                                    {logs.map((log, index) => (
                                        <div key={index} className="text-sm font-mono text-gray-300">
                                            {log}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setLogs([])}
                            className="text-sm text-secondary hover:text-primary transition-colors"
                        >
                            Clear Logs
                        </button>
                    </div>
                </div>

                {/* Warning */}
                <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-yellow-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div>
                            <h4 className="text-sm font-medium text-yellow-500">Important Notice</h4>
                            <p className="text-sm text-yellow-200 mt-1">
                                This feature is for demonstration purposes. Ensure you understand the risks and comply with all applicable regulations before using automated trading features.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 