'use client';

import { useState } from 'react';
import { ExpandableSection } from '@/components/ExpandableSection';
import { Header } from '@/components/Header';
import {
    WalletIcon,
    DocumentTextIcon,
    PhotoIcon,
    CogIcon,
    RocketLaunchIcon
} from '@heroicons/react/24/outline';

const DocsPage = () => {
    const [activeTab, setActiveTab] = useState<'creation' | 'next-steps'>('creation');

    return (
        <div className="min-h-screen dark-gradient-bg">
            {/* Navigation */}
            <Header />

            <div className="container mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-primary mb-6">
                        Support & Documentation
                    </h1>
                    <p className="text-xl text-secondary max-w-2xl mx-auto">
                        Learn how to create and manage your Solana token with our comprehensive guides and troubleshooting tips.
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="flex justify-center mb-8">
                    <div className="flex bg-gray-800 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab('creation')}
                            className={`px-6 py-3 rounded-md transition-all font-medium ${activeTab === 'creation'
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Token Creation
                        </button>
                        <button
                            onClick={() => setActiveTab('next-steps')}
                            className={`px-6 py-3 rounded-md transition-all font-medium ${activeTab === 'next-steps'
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Next Steps
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="dark-card rounded-xl p-8">
                    {activeTab === 'creation' && (
                        <div>
                            <h2 className="text-3xl font-bold mb-6">Creating Your Token</h2>

                            {/* Prerequisites Section */}
                            <section className="mb-8">
                                <h3 className="text-xl font-semibold mb-4 text-purple-400">Prerequisites</h3>
                                <div className="bg-gray-700 rounded-lg p-6">
                                    <ul className="space-y-3">
                                        <li className="flex items-center">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                                            A Solana wallet (like Phantom) with SOL for fees
                                        </li>
                                        <li className="flex items-center">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                                            Token details (name, symbol, supply, etc.)
                                        </li>
                                        <li className="flex items-center">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                                            Optional: Token logo (recommended size: 1000x1000px)
                                        </li>
                                    </ul>
                                </div>
                            </section>

                            {/* Step-by-Step Guide */}
                            <section>
                                <h3 className="text-xl font-semibold mb-4 text-purple-400">Step-by-Step Guide</h3>
                                <div className="space-y-4">
                                    <ExpandableSection
                                        title="1. Connect Your Wallet"
                                        icon={<WalletIcon className="w-5 h-5" />}
                                    >
                                        <div className="space-y-3">
                                            <p>To create a token, you'll first need to connect your Solana wallet:</p>
                                            <ol className="list-decimal list-inside space-y-2 text-sm">
                                                <li>Click the "Connect Wallet" button in the top right corner</li>
                                                <li>Select your preferred wallet (Phantom, Solflare, etc.)</li>
                                                <li>Approve the connection in your wallet extension</li>
                                                <li>Ensure you have at least 0.1 SOL for transaction fees</li>
                                            </ol>
                                            <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3 mt-3">
                                                <p className="text-blue-200 text-sm">
                                                    💡 <strong>Tip:</strong> We recommend using Phantom wallet for the best experience.
                                                </p>
                                            </div>
                                        </div>
                                    </ExpandableSection>

                                    <ExpandableSection
                                        title="2. Fill in Token Details"
                                        icon={<DocumentTextIcon className="w-5 h-5" />}
                                    >
                                        <div className="space-y-3">
                                            <p>Provide the essential information for your token:</p>
                                            <div className="grid gap-3">
                                                <div>
                                                    <h5 className="font-medium text-white mb-1">Token Name</h5>
                                                    <p className="text-sm">The full name of your token (e.g., "My Awesome Token")</p>
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-white mb-1">Symbol</h5>
                                                    <p className="text-sm">A short ticker symbol (e.g., "MAT") - typically 3-5 characters</p>
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-white mb-1">Description</h5>
                                                    <p className="text-sm">A brief description of your token's purpose and use case</p>
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-white mb-1">Supply</h5>
                                                    <p className="text-sm">Total number of tokens to create (e.g., 1,000,000)</p>
                                                </div>
                                            </div>
                                        </div>
                                    </ExpandableSection>

                                    <ExpandableSection
                                        title="3. Upload Logo & Add Social Links"
                                        icon={<PhotoIcon className="w-5 h-5" />}
                                    >
                                        <div className="space-y-3">
                                            <p>Make your token stand out with professional branding:</p>
                                            <div className="space-y-3">
                                                <div>
                                                    <h5 className="font-medium text-white mb-2">Token Logo</h5>
                                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                                        <li>Recommended size: 1000x1000 pixels</li>
                                                        <li>Supported formats: PNG, JPG, JPEG</li>
                                                        <li>Max file size: 5MB</li>
                                                        <li>Square aspect ratio works best</li>
                                                    </ul>
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-white mb-2">Social Links (Optional)</h5>
                                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                                        <li>Website URL</li>
                                                        <li>Twitter/X profile</li>
                                                        <li>Telegram group</li>
                                                        <li>Discord server</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </ExpandableSection>

                                    <ExpandableSection
                                        title="4. Configure Advanced Options"
                                        icon={<CogIcon className="w-5 h-5" />}
                                    >
                                        <div className="space-y-3">
                                            <p>Fine-tune your token's behavior and permissions:</p>
                                            <div className="space-y-3">
                                                <div>
                                                    <h5 className="font-medium text-white mb-1">Revoke Freeze Authority</h5>
                                                    <p className="text-sm">Prevents freezing token accounts (recommended for most tokens)</p>
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-white mb-1">Revoke Mint Authority</h5>
                                                    <p className="text-sm">Prevents creating more tokens (makes supply fixed)</p>
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-white mb-1">Decimals</h5>
                                                    <p className="text-sm">Number of decimal places (9 is standard for Solana tokens)</p>
                                                </div>
                                            </div>
                                            <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3">
                                                <p className="text-yellow-200 text-sm">
                                                    ⚠️ <strong>Warning:</strong> These settings cannot be changed after token creation.
                                                </p>
                                            </div>
                                        </div>
                                    </ExpandableSection>

                                    <ExpandableSection
                                        title="5. Create Token"
                                        icon={<RocketLaunchIcon className="w-5 h-5" />}
                                        defaultExpanded={true}
                                    >
                                        <div className="space-y-3">
                                            <p>Ready to launch your token:</p>
                                            <ol className="list-decimal list-inside space-y-2 text-sm">
                                                <li>Review all your token details carefully</li>
                                                <li>Click the "Create Token" button</li>
                                                <li>Approve the transaction in your wallet</li>
                                                <li>Wait for the transaction to confirm (usually 10-30 seconds)</li>
                                                <li>Your token mint address will be displayed upon success</li>
                                            </ol>
                                            <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3">
                                                <p className="text-green-200 text-sm">
                                                    🎉 <strong>Success!</strong> Save your token mint address - you'll need it for adding liquidity and listings.
                                                </p>
                                            </div>
                                        </div>
                                    </ExpandableSection>
                                </div>
                            </section>

                            {/* Troubleshooting Section */}
                            <section className="mt-8">
                                <h3 className="text-xl font-semibold mb-4 text-purple-400">Common Issues & Solutions</h3>
                                <div className="space-y-4">
                                    <ExpandableSection
                                        title="Wallet Connection Issues"
                                        icon={<WalletIcon className="w-5 h-5" />}
                                    >
                                        <div className="space-y-3">
                                            <p><strong>Problem:</strong> Wallet won't connect or shows connection error</p>
                                            <div className="bg-gray-600 rounded-lg p-3">
                                                <p className="font-medium mb-2">Solutions:</p>
                                                <ul className="list-disc list-inside space-y-1 text-sm">
                                                    <li>Refresh the page and try again</li>
                                                    <li>Make sure your wallet extension is unlocked</li>
                                                    <li>Try a different browser or incognito mode</li>
                                                    <li>Clear your browser cache and cookies</li>
                                                    <li>Update your wallet extension to the latest version</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </ExpandableSection>

                                    <ExpandableSection
                                        title="Transaction Failed"
                                        icon={<DocumentTextIcon className="w-5 h-5" />}
                                    >
                                        <div className="space-y-3">
                                            <p><strong>Problem:</strong> Token creation transaction fails or gets rejected</p>
                                            <div className="bg-gray-600 rounded-lg p-3">
                                                <p className="font-medium mb-2">Solutions:</p>
                                                <ul className="list-disc list-inside space-y-1 text-sm">
                                                    <li>Ensure you have enough SOL for transaction fees (at least 0.1 SOL)</li>
                                                    <li>Check if the token symbol is already taken</li>
                                                    <li>Wait for the network to be less congested and try again</li>
                                                    <li>Reduce the token supply if it's extremely large</li>
                                                    <li>Try creating the token with a different wallet</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </ExpandableSection>

                                    <ExpandableSection
                                        title="Logo Upload Problems"
                                        icon={<PhotoIcon className="w-5 h-5" />}
                                    >
                                        <div className="space-y-3">
                                            <p><strong>Problem:</strong> Logo won't upload or displays incorrectly</p>
                                            <div className="bg-gray-600 rounded-lg p-3">
                                                <p className="font-medium mb-2">Solutions:</p>
                                                <ul className="list-disc list-inside space-y-1 text-sm">
                                                    <li>Ensure file size is under 5MB</li>
                                                    <li>Use PNG or JPG format only</li>
                                                    <li>Make sure the image is square (1:1 aspect ratio)</li>
                                                    <li>Try compressing the image before upload</li>
                                                    <li>Clear browser cache and try uploading again</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </ExpandableSection>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'next-steps' && (
                        <div>
                            <h2 className="text-3xl font-bold mb-6">Next Steps After Token Creation</h2>

                            <div className="space-y-6">
                                {/* Liquidity Section */}
                                <section>
                                    <h3 className="text-xl font-semibold mb-4 text-purple-400">1. Add Liquidity on Raydium</h3>
                                    <div className="bg-gray-700 rounded-lg p-6">
                                        <p className="text-gray-300 mb-4">
                                            Create a trading pair and add liquidity to enable trading of your token.
                                        </p>
                                        <div className="space-y-2 text-sm text-gray-300">
                                            <p>1. Visit Raydium's liquidity page</p>
                                            <p>2. Click "Create"</p>
                                            <p>3. Select "Standard AMM" as the Pool type and click "Continue"</p>
                                            <p>4. Enter your token's mint address as the base token</p>
                                            <p>5. Select SOL as the quote token</p>
                                            <p>6. Set initial price and liquidity amounts as well as a fee tier</p>
                                            <p>7. Click "Initialize Liquidity Pool" and confirm the transaction</p>
                                        </div>
                                        <a
                                            href="https://raydium.io/liquidity/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm"
                                        >
                                            Create Liquidity Pool on Raydium
                                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    </div>
                                </section>

                                {/* DEX Screener Section */}
                                <section>
                                    <h3 className="text-xl font-semibold mb-4 text-purple-400">2. List on DEX Screener</h3>
                                    <div className="bg-gray-700 rounded-lg p-6">
                                        <p className="text-gray-300 mb-4">
                                            After adding liquidity, your token will automatically be available on DEX Screener.
                                        </p>
                                        <a
                                            href="https://dexscreener.com/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm"
                                        >
                                            View on DEX Screener
                                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    </div>
                                </section>

                                {/* Monitoring Section */}
                                <section>
                                    <h3 className="text-xl font-semibold mb-4 text-purple-400">3. Monitor Your Token</h3>
                                    <div className="bg-gray-700 rounded-lg p-6">
                                        <p className="text-gray-300 mb-4">
                                            Track your token's performance and transactions using Solana explorers.
                                        </p>
                                        <div className="flex flex-wrap gap-3">
                                            <a
                                                href="https://solscan.io/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
                                            >
                                                Solscan
                                                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                            <a
                                                href="https://solana.fm/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm"
                                            >
                                                Solana Explorer
                                                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        </div>
                                    </div>
                                </section>

                                {/* Additional Resources */}
                                <section>
                                    <h3 className="text-xl font-semibold mb-4 text-purple-400">Additional Resources</h3>
                                    <div className="bg-gray-700 rounded-lg p-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <h4 className="font-medium mb-3">Marketing Your Token</h4>
                                                <ul className="space-y-1 text-sm text-gray-300">
                                                    <li>• Create a website and whitepaper</li>
                                                    <li>• Build social media presence</li>
                                                    <li>• Engage with the Solana community</li>
                                                    <li>• Consider listing on centralized exchanges</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="font-medium mb-3">Security Best Practices</h4>
                                                <ul className="space-y-1 text-sm text-gray-300">
                                                    <li>• Use a dedicated wallet for token management</li>
                                                    <li>• Enable multi-sig if possible</li>
                                                    <li>• Regular security audits</li>
                                                    <li>• Monitor for unusual activities</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocsPage; 