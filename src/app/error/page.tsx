'use client';

import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function ErrorPage() {
    const searchParams = useSearchParams();
    const [errorData, setErrorData] = useState<any>(null);

    useEffect(() => {
        // Get error data from URL parameters
        const error = searchParams.get('error');
        const step = searchParams.get('step');
        const message = searchParams.get('message');

        if (error) {
            setErrorData({
                error: decodeURIComponent(error),
                step: step || 'unknown',
                message: message ? decodeURIComponent(message) : null,
            });
        }
    }, [searchParams]);

    const getErrorDetails = (error: string, step: string) => {
        const details: { [key: string]: { title: string; description: string; icon: string; color: string } } = {
            'insufficient_funds': {
                title: 'Insufficient Funds',
                description: 'Your wallet doesn\'t have enough SOL to complete the transaction.',
                icon: '💰',
                color: 'red'
            },
            'user_rejected': {
                title: 'Transaction Rejected',
                description: 'You rejected the transaction in your wallet.',
                icon: '🚫',
                color: 'orange'
            },
            'network_error': {
                title: 'Network Error',
                description: 'There was a problem connecting to the Solana network.',
                icon: '🌐',
                color: 'blue'
            },
            'upload_failed': {
                title: 'Upload Failed',
                description: 'Failed to upload token metadata or image to IPFS.',
                icon: '📤',
                color: 'purple'
            },
            'transaction_failed': {
                title: 'Transaction Failed',
                description: 'The token creation transaction failed on the blockchain.',
                icon: '⛓️',
                color: 'red'
            },
            'timeout': {
                title: 'Transaction Timeout',
                description: 'The transaction took too long to confirm.',
                icon: '⏱️',
                color: 'yellow'
            },
            'validation_error': {
                title: 'Validation Error',
                description: 'There was an issue with the token parameters provided.',
                icon: '❌',
                color: 'red'
            },
            'unknown': {
                title: 'Unknown Error',
                description: 'An unexpected error occurred during token creation.',
                icon: '❓',
                color: 'gray'
            }
        };

        return details[error] || details['unknown'];
    };

    const getSolutionSteps = (error: string) => {
        const solutions: { [key: string]: string[] } = {
            'insufficient_funds': [
                'Add more SOL to your wallet',
                'Try creating a token without premium features to reduce cost',
                'Check current Solana network fees'
            ],
            'user_rejected': [
                'Click "Create Token" again to retry',
                'Review the transaction details in your wallet',
                'Ensure you want to proceed with the token creation'
            ],
            'network_error': [
                'Check your internet connection',
                'Try again in a few minutes',
                'Switch to a different RPC endpoint if the issue persists'
            ],
            'upload_failed': [
                'Check your internet connection',
                'Try uploading a smaller image file (< 2MB)',
                'Ensure your image is in PNG, JPG, or JPEG format'
            ],
            'transaction_failed': [
                'Check your wallet balance',
                'Ensure network fees are sufficient',
                'Try again with different token parameters'
            ],
            'timeout': [
                'Check the transaction status on Solscan',
                'Wait a few minutes and try again',
                'Consider using a faster internet connection'
            ],
            'validation_error': [
                'Check all required fields are filled correctly',
                'Ensure token symbol is unique and valid',
                'Verify social media links are properly formatted'
            ],
            'unknown': [
                'Try refreshing the page and attempting again',
                'Check browser console for additional error details',
                'Contact support if the issue persists'
            ]
        };

        return solutions[error] || solutions['unknown'];
    };

    if (!errorData) {
        return (
            <div className="min-h-screen dark-gradient-bg">
                <Header />
                <div className="container mx-auto px-6 py-12">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-secondary mb-4">No Error Information</h1>
                        <p className="text-secondary mb-6">This page is only accessible when an error occurs.</p>
                        <Link
                            href="/create-token"
                            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Create Token
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const errorDetails = getErrorDetails(errorData.error, errorData.step);
    const solutions = getSolutionSteps(errorData.error);

    return (
        <div className="min-h-screen dark-gradient-bg">
            <Header />

            <div className="container mx-auto px-6 py-12">
                {/* Error Header */}
                <div className="text-center mb-12">
                    <div className={`w-24 h-24 bg-gradient-to-br from-${errorDetails.color}-400 to-${errorDetails.color}-500 rounded-full flex items-center justify-center mx-auto mb-6`}>
                        <span className="text-4xl">{errorDetails.icon}</span>
                    </div>
                    <h1 className="text-5xl font-bold text-primary mb-4">
                        {errorDetails.title}
                    </h1>
                    <p className="text-xl text-secondary max-w-2xl mx-auto">
                        {errorDetails.description}
                    </p>
                </div>

                {/* Error Details Card */}
                <div className="max-w-4xl mx-auto mb-12">
                    <div className="dark-card rounded-xl p-8 border border-red-500/30">
                        <h2 className="text-2xl font-bold text-primary mb-6">Error Details</h2>

                        <div className="space-y-4">
                            {/* Error Type */}
                            <div className="bg-gray-800/50 rounded-lg p-4">
                                <label className="block text-sm font-medium text-secondary mb-2">
                                    Error Type
                                </label>
                                <div className="bg-gray-900 text-red-400 px-3 py-2 rounded text-sm font-mono">
                                    {errorData.error}
                                </div>
                            </div>

                            {/* Error Step */}
                            <div className="bg-gray-800/50 rounded-lg p-4">
                                <label className="block text-sm font-medium text-secondary mb-2">
                                    Failed at Step
                                </label>
                                <div className="bg-gray-900 text-orange-400 px-3 py-2 rounded text-sm font-mono">
                                    {errorData.step}
                                </div>
                            </div>

                            {/* Error Message */}
                            {errorData.message && (
                                <div className="bg-gray-800/50 rounded-lg p-4">
                                    <label className="block text-sm font-medium text-secondary mb-2">
                                        Error Message
                                    </label>
                                    <div className="bg-gray-900 text-yellow-400 px-3 py-2 rounded text-sm break-words">
                                        {errorData.message}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* No Charges Notice */}
                <div className="max-w-4xl mx-auto mb-12">
                    <div className="dark-card rounded-lg p-6 border border-green-500/30 bg-gradient-to-r from-green-500/5 to-emerald-500/5">
                        <div className="flex items-start gap-3">
                            <span className="text-green-400 text-2xl">✅</span>
                            <div>
                                <h3 className="text-lg font-bold text-green-300 mb-2">No Charges Applied</h3>
                                <p className="text-green-200 text-sm">
                                    Since the token creation failed, <strong>no fees were charged to your wallet</strong>.
                                    You can safely retry the process after addressing the issue below.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Solution Steps */}
                <div className="max-w-4xl mx-auto mb-12">
                    <h2 className="text-3xl font-bold text-primary mb-8 text-center">
                        🛠️ How to Fix This
                    </h2>

                    <div className="dark-card rounded-lg p-8">
                        <h3 className="text-xl font-bold text-primary mb-6">Recommended Solutions</h3>
                        <div className="space-y-4">
                            {solutions.map((solution, index) => (
                                <div key={index} className="flex items-start gap-4">
                                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <span className="text-purple-300 font-bold text-sm">{index + 1}</span>
                                    </div>
                                    <p className="text-secondary">{solution}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Common Issues */}
                <div className="max-w-4xl mx-auto mb-12">
                    <h2 className="text-2xl font-bold text-primary mb-6 text-center">
                        Common Issues & Solutions
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Wallet Issues */}
                        <div className="dark-card rounded-lg p-6 border border-blue-500/30">
                            <h3 className="text-lg font-bold text-blue-300 mb-3">💳 Wallet Issues</h3>
                            <ul className="text-secondary text-sm space-y-2">
                                <li>• Ensure wallet is connected and unlocked</li>
                                <li>• Check you're on the correct network (Mainnet/Devnet)</li>
                                <li>• Verify sufficient SOL balance for fees</li>
                                <li>• Try refreshing the wallet connection</li>
                            </ul>
                        </div>

                        {/* Network Issues */}
                        <div className="dark-card rounded-lg p-6 border border-yellow-500/30">
                            <h3 className="text-lg font-bold text-yellow-300 mb-3">🌐 Network Issues</h3>
                            <ul className="text-secondary text-sm space-y-2">
                                <li>• Check Solana network status</li>
                                <li>• Try during off-peak hours</li>
                                <li>• Ensure stable internet connection</li>
                                <li>• Consider increasing transaction priority</li>
                            </ul>
                        </div>

                        {/* File Upload Issues */}
                        <div className="dark-card rounded-lg p-6 border border-purple-500/30">
                            <h3 className="text-lg font-bold text-purple-300 mb-3">📁 File Upload Issues</h3>
                            <ul className="text-secondary text-sm space-y-2">
                                <li>• Use images smaller than 2MB</li>
                                <li>• Ensure PNG, JPG, or JPEG format</li>
                                <li>• Try compressing large images</li>
                                <li>• Check image isn't corrupted</li>
                            </ul>
                        </div>

                        {/* Transaction Issues */}
                        <div className="dark-card rounded-lg p-6 border border-green-500/30">
                            <h3 className="text-lg font-bold text-green-300 mb-3">⛓️ Transaction Issues</h3>
                            <ul className="text-secondary text-sm space-y-2">
                                <li>• Verify all form fields are valid</li>
                                <li>• Check token symbol isn't already taken</li>
                                <li>• Ensure creator address is valid</li>
                                <li>• Try with basic settings first</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="text-center space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/create-token"
                            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                        >
                            Try Again
                        </Link>
                        <Link
                            href="/docs"
                            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
                        >
                            View Support Guide
                        </Link>
                    </div>
                    <Link
                        href="/"
                        className="inline-block text-secondary hover:text-primary transition-colors"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
} 