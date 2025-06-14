'use client';

import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';

function ErrorPageContent() {
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
                                    <div className="bg-gray-900 text-yellow-400 px-3 py-2 rounded text-sm font-mono break-all">
                                        {errorData.message}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Solutions Card */}
                <div className="max-w-4xl mx-auto mb-12">
                    <div className="dark-card rounded-xl p-8 border border-green-500/30">
                        <h2 className="text-2xl font-bold text-primary mb-6">Suggested Solutions</h2>

                        <div className="space-y-4">
                            {solutions.map((solution, index) => (
                                <div key={index} className="flex items-start gap-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-green-400 font-bold text-sm">{index + 1}</span>
                                    </div>
                                    <p className="text-green-200 leading-relaxed">{solution}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="max-w-4xl mx-auto">
                    <div className="dark-card rounded-xl p-8 text-center">
                        <h3 className="text-xl font-bold text-primary mb-6">What would you like to do next?</h3>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/create-token"
                                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold"
                            >
                                Try Again
                            </Link>

                            <Link
                                href="/docs"
                                className="px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
                            >
                                View Documentation
                            </Link>

                            <Link
                                href="/"
                                className="px-8 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors font-semibold"
                            >
                                Go Home
                            </Link>
                        </div>

                        {/* Debug Information */}
                        <div className="mt-8 pt-6 border-t border-gray-700">
                            <details className="text-left">
                                <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 mb-4">
                                    Show Debug Information
                                </summary>
                                <div className="bg-gray-900 rounded-lg p-4 text-xs font-mono text-gray-400">
                                    <div className="mb-2">
                                        <span className="text-gray-500">Timestamp:</span> {new Date().toISOString()}
                                    </div>
                                    <div className="mb-2">
                                        <span className="text-gray-500">Error Code:</span> {errorData.error}
                                    </div>
                                    <div className="mb-2">
                                        <span className="text-gray-500">Step:</span> {errorData.step}
                                    </div>
                                    <div className="mb-2">
                                        <span className="text-gray-500">User Agent:</span> {typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}
                                    </div>
                                    {errorData.message && (
                                        <div>
                                            <span className="text-gray-500">Raw Message:</span> {errorData.message}
                                        </div>
                                    )}
                                </div>
                            </details>
                        </div>
                    </div>
                </div>

                {/* Additional Help */}
                <div className="max-w-4xl mx-auto mt-12">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-secondary mb-4">Still need help?</h3>
                        <p className="text-secondary mb-6">
                            If you're still experiencing issues, you can check our documentation or reach out for support.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/docs"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/30 transition-colors"
                            >
                                📚 Documentation
                            </Link>

                            <a
                                href="https://discord.gg/your-discord"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600/20 text-indigo-300 rounded-lg hover:bg-indigo-600/30 transition-colors"
                            >
                                💬 Discord Support
                            </a>

                            <a
                                href="https://twitter.com/your-twitter"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600/20 text-sky-300 rounded-lg hover:bg-sky-600/30 transition-colors"
                            >
                                🐦 Twitter
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ErrorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen dark-gradient-bg flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-secondary">Loading error details...</p>
                </div>
            </div>
        }>
            <ErrorPageContent />
        </Suspense>
    );
} 