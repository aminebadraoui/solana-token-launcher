'use client';

import { useState } from 'react';

export default function CreateLiquidityPage() {
    const [isOpening, setIsOpening] = useState(false);

    const handleOpenRaydium = () => {
        setIsOpening(true);
        window.open('https://raydium.io/liquidity/create-pool/', '_blank');

        // Reset the button state after a short delay
        setTimeout(() => {
            setIsOpening(false);
        }, 2000);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="hero-title text-3xl font-bold text-primary mb-2">
                    Create Liquidity Pool
                </h1>
                <p className="text-secondary">
                    Create liquidity pools for your tokens on Raydium DEX
                </p>
            </div>

            {/* Main Content */}
            <div className="max-w-2xl mx-auto">
                <div className="dark-card rounded-xl p-8">
                    <div className="text-center space-y-6">
                        {/* Raydium Logo/Icon */}
                        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-xl font-semibold text-primary">
                                Launch on Raydium
                            </h3>
                            <p className="text-secondary">
                                Raydium is the leading DEX on Solana. Create liquidity pools to enable trading for your tokens with deep liquidity and low fees.
                            </p>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
                            <div className="text-center space-y-2">
                                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto">
                                    <span className="text-blue-400 text-lg">💧</span>
                                </div>
                                <h4 className="text-sm font-medium text-primary">Deep Liquidity</h4>
                                <p className="text-xs text-secondary">Access to Solana's largest liquidity pools</p>
                            </div>
                            <div className="text-center space-y-2">
                                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto">
                                    <span className="text-green-400 text-lg">⚡</span>
                                </div>
                                <h4 className="text-sm font-medium text-primary">Low Fees</h4>
                                <p className="text-xs text-secondary">Minimal trading fees and fast transactions</p>
                            </div>
                            <div className="text-center space-y-2">
                                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto">
                                    <span className="text-purple-400 text-lg">🔒</span>
                                </div>
                                <h4 className="text-sm font-medium text-primary">Secure</h4>
                                <p className="text-xs text-secondary">Battle-tested and audited smart contracts</p>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={handleOpenRaydium}
                            disabled={isOpening}
                            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium py-4 px-6 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-75 disabled:scale-100 disabled:cursor-not-allowed"
                        >
                            {isOpening ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Opening Raydium...</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center space-x-2">
                                    <span>🚀 Open Raydium Pool Creator</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </div>
                            )}
                        </button>

                        <p className="text-xs text-secondary">
                            This will open Raydium's pool creation page in a new tab
                        </p>
                    </div>
                </div>

                {/* Instructions */}
                <div className="dark-card rounded-xl p-6 mt-6">
                    <h4 className="text-lg font-semibold text-primary mb-4">How to Create a Liquidity Pool</h4>
                    <div className="space-y-3 text-sm text-secondary">
                        <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-purple-400 text-xs font-bold">1</span>
                            </div>
                            <div>
                                <strong className="text-primary">Connect Your Wallet:</strong> Connect the same wallet that holds your tokens to Raydium.
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-purple-400 text-xs font-bold">2</span>
                            </div>
                            <div>
                                <strong className="text-primary">Select Token Pair:</strong> Choose your token and pair it with SOL or USDC for maximum liquidity.
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-purple-400 text-xs font-bold">3</span>
                            </div>
                            <div>
                                <strong className="text-primary">Set Initial Price:</strong> Define the starting price ratio between your token and the paired asset.
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-purple-400 text-xs font-bold">4</span>
                            </div>
                            <div>
                                <strong className="text-primary">Add Liquidity:</strong> Deposit both tokens to create the initial liquidity pool and start trading.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Warning */}
                <div className="dark-card rounded-xl p-4 bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div>
                            <h4 className="text-sm font-medium text-yellow-500">Important</h4>
                            <p className="text-sm text-yellow-200 mt-1">
                                Ensure you have sufficient SOL for transaction fees and the paired asset for liquidity provision. Pool creation requires both tokens in the pair.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 