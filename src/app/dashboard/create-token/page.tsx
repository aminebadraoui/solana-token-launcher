'use client';

import Link from 'next/link';

export default function CreateTokenPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="hero-title text-3xl font-bold text-primary mb-2">
                    Create Token
                </h1>
                <p className="text-secondary">
                    Choose how you want to create your new SPL token
                </p>
            </div>

            {/* Two Big Buttons */}
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Create From Scratch Button */}
                <Link href="/dashboard/create-token/scratch">
                    <div className="group dark-card rounded-xl p-8 hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border-purple-500/20 hover:border-purple-500/40">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-primary group-hover:text-purple-400 transition-colors duration-300">
                                            Create Token From Scratch
                                        </h3>
                                        <p className="text-secondary mt-1">
                                            Design and launch a completely new token with custom parameters
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-purple-400 group-hover:translate-x-2 transition-transform duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Clone Trending Token Button */}
                <Link href="/trending">
                    <div className="group dark-card rounded-xl p-8 hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-r from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 border-blue-500/20 hover:border-blue-500/40">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-primary group-hover:text-blue-400 transition-colors duration-300">
                                            Clone Trending Token
                                        </h3>
                                        <p className="text-secondary mt-1">
                                            Browse trending tokens and clone successful ones as a starting point
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-blue-400 group-hover:translate-x-2 transition-transform duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Additional Info */}
            <div className="max-w-2xl mx-auto">
                <div className="dark-card rounded-xl p-6 bg-gradient-to-r from-gray-500/5 to-gray-600/5 border-gray-500/20">
                    <h4 className="text-lg font-semibold text-primary mb-3">Need Help Choosing?</h4>
                    <div className="space-y-3 text-sm text-secondary">
                        <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                            <div>
                                <strong className="text-primary">Create From Scratch:</strong> Best for unique ideas and custom tokenomics. Full control over all parameters.
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div>
                                <strong className="text-primary">Clone Trending:</strong> Great for learning from successful tokens or creating variations of proven concepts.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 