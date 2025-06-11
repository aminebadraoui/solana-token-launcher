'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { createTokenMint } from '@/lib/tokenMinting';
import WalletFinder from './WalletFinder';

interface TokenFormData {
    name: string;
    symbol: string;
    decimals: number;
    supply: number;
    description: string;
    image: File | null;
    revokeMintAuth: boolean;
    revokeFreezeAuth: boolean;
    revokeUpdateAuth: boolean;
    customCreator: boolean;
    creatorAddress: string;
    creatorName: string;
    telegramLink: string;
    twitterLink: string;
    websiteLink: string;
}

interface PumpFunToken {
    mintAddress: string;
    name: string;
    symbol: string;
    description?: string;
    imageUri?: string;
    price: number;
    priceInUSD: number;
    marketCap: number;
    graduationProgress: number;
    creationTime: string;
}

interface TokenCreationFormProps {
    cloneData?: PumpFunToken | null;
    isCloneMode?: boolean;
}

export function TokenCreationForm({ cloneData, isCloneMode = false }: TokenCreationFormProps) {
    const { publicKey, signTransaction } = useWallet();
    const { connection } = useConnection();
    const [isLoading, setIsLoading] = useState(false);
    const [showCreatorInfo, setShowCreatorInfo] = useState(false);
    const [showSocialLinks, setShowSocialLinks] = useState(false);
    const [showWalletFinder, setShowWalletFinder] = useState(false);
    const [isAutoPopulated, setIsAutoPopulated] = useState(false);
    const [formData, setFormData] = useState<TokenFormData>({
        name: '',
        symbol: '',
        decimals: 9,
        supply: 1000000,
        description: '',
        image: null,
        revokeMintAuth: true, // Default to true
        revokeFreezeAuth: true, // Default to true
        revokeUpdateAuth: true, // Default to true
        customCreator: false,
        creatorAddress: '',
        creatorName: '',
        telegramLink: '',
        twitterLink: '',
        websiteLink: '',
    });

    // Auto-populate form when clone data is available
    useEffect(() => {
        if (cloneData && !isAutoPopulated) {
            setFormData(prev => ({
                ...prev,
                name: generateCloneName(cloneData.name),
                symbol: generateCloneSymbol(cloneData.symbol),
                description: generateCloneDescription(cloneData.description),
            }));
            setIsAutoPopulated(true);
        }
    }, [cloneData, isAutoPopulated]);

    const generateCloneName = (originalName: string): string => {
        // Generate a variation of the original name
        const variations = [
            `${originalName} V2`,
            `${originalName} Plus`,
            `${originalName} Pro`,
            `${originalName} 2.0`,
            `New ${originalName}`,
            `${originalName} Reborn`,
        ];
        return variations[Math.floor(Math.random() * variations.length)];
    };

    const generateCloneSymbol = (originalSymbol: string): string => {
        // Generate a variation of the original symbol
        const variations = [
            `${originalSymbol}2`,
            `${originalSymbol}V2`,
            `N${originalSymbol}`,
            `${originalSymbol}+`,
            `${originalSymbol}X`,
        ];
        return variations[Math.floor(Math.random() * variations.length)].substring(0, 5);
    };

    const generateCloneDescription = (originalDescription?: string): string => {
        if (!originalDescription) {
            return 'A new token inspired by trending pump.fun projects, designed for community growth and success.';
        }

        // Generate inspired description
        const inspirationPhrases = [
            'Inspired by the success of trending tokens',
            'Building on the foundation of proven concepts',
            'Taking the best ideas to the next level',
            'A fresh take on successful tokenomics',
            'Evolved from community-favorite projects',
        ];

        const randomPhrase = inspirationPhrases[Math.floor(Math.random() * inspirationPhrases.length)];
        return `${randomPhrase}. ${originalDescription}`.substring(0, 200);
    };

    const baseCost = 0.2; // SOL
    const premiumFeeCost = 0.1; // SOL per premium feature

    const calculateTotalCost = () => {
        let total = baseCost;
        if (formData.revokeMintAuth) total += premiumFeeCost;
        if (formData.revokeFreezeAuth) total += premiumFeeCost;
        if (formData.revokeUpdateAuth) total += premiumFeeCost;
        if (showCreatorInfo) total += premiumFeeCost;
        if (showSocialLinks) total += premiumFeeCost;
        // Add clone fee if in clone mode
        if (isCloneMode) total += premiumFeeCost;
        return total;
    };

    // Validate Solana address format
    const isValidSolanaAddress = (address: string): boolean => {
        try {
            // Basic validation: should be 32-44 characters and base58
            if (address.length < 32 || address.length > 44) return false;
            // Check if it contains only valid base58 characters
            const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
            return base58Regex.test(address);
        } catch {
            return false;
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: checked,
            // Clear creator address if Custom Creator is unchecked
            ...(name === 'customCreator' && !checked ? { creatorAddress: '', creatorName: '' } : {})
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setFormData(prev => ({
            ...prev,
            image: file
        }));
    };

    const handleWalletSelect = (address: string) => {
        setFormData(prev => ({
            ...prev,
            creatorAddress: address
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!publicKey || !signTransaction) {
            alert('Please connect your wallet');
            return;
        }

        // Validate custom creator address if Creator's Info is enabled
        if (showCreatorInfo && formData.creatorAddress && !isValidSolanaAddress(formData.creatorAddress)) {
            alert('Please enter a valid Solana address for the creator');
            return;
        }

        setIsLoading(true);
        try {
            await createTokenMint({
                connection,
                payer: publicKey,
                signTransaction,
                formData: {
                    ...formData,
                    customCreator: showCreatorInfo, // Use the toggle state
                },
                totalCost: calculateTotalCost()
            });
            alert('Token created successfully!');
        } catch (error) {
            console.error('Error creating token:', error);
            alert('Failed to create token. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="dark-card rounded-lg p-8">
            {/* Auto-population indicator */}
            {isAutoPopulated && cloneData && (
                <div className="mb-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <span className="text-green-400 text-xl">🚀</span>
                        <div>
                            <h3 className="font-semibold text-green-300 mb-1">
                                Form Auto-Populated from {cloneData.name}
                            </h3>
                            <p className="text-sm text-green-200">
                                Fields have been filled with inspired variations. Feel free to customize them further!
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Token Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-primary font-medium mb-2">
                            Token Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 dark-input rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="My Awesome Token"
                        />
                    </div>

                    <div>
                        <label className="block text-primary font-medium mb-2">
                            Symbol *
                        </label>
                        <input
                            type="text"
                            name="symbol"
                            value={formData.symbol}
                            onChange={handleInputChange}
                            required
                            maxLength={5}
                            className="w-full px-4 py-3 dark-input rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="MAT"
                        />
                    </div>

                    <div>
                        <label className="block text-primary font-medium mb-2">
                            Decimals
                        </label>
                        <input
                            type="number"
                            name="decimals"
                            value={formData.decimals}
                            onChange={handleInputChange}
                            min="0"
                            max="18"
                            className="w-full px-4 py-3 dark-input rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-primary font-medium mb-2">
                            Initial Supply
                        </label>
                        <input
                            type="number"
                            name="supply"
                            value={formData.supply}
                            onChange={handleInputChange}
                            min="1"
                            className="w-full px-4 py-3 dark-input rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-primary font-medium mb-2">
                        Token Image
                        <span className="text-muted text-sm ml-2">
                            Add logo for your token or use AI to Generate one for you!
                        </span>
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full px-4 py-3 dark-input rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-primary font-medium mb-2">
                        Description *
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        rows={3}
                        className="w-full px-4 py-3 dark-input rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Here you can describe your token"
                    />
                </div>

                {/* Creator's Info Toggle */}
                <div className="border-t border-subtle pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-primary">Creator's Info (Optional)</h3>
                            <p className="text-muted text-sm">
                                Change the information of the creator in the metadata. By default, it is Luna Launch.
                            </p>
                        </div>
                        <div className="flex items-center">
                            <span className="text-purple-light mr-3">+0.1 SOL</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showCreatorInfo}
                                    onChange={(e) => setShowCreatorInfo(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                            </label>
                        </div>
                    </div>

                    {/* Creator's Info Fields */}
                    {showCreatorInfo && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-primary font-medium mb-2">
                                    Creator's Address *
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        name="creatorAddress"
                                        value={formData.creatorAddress}
                                        onChange={handleInputChange}
                                        required={showCreatorInfo}
                                        className="flex-1 px-4 py-3 dark-input rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="Ex: Your Solana address"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowWalletFinder(true)}
                                        className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
                                        title="Find High-SOL Wallets"
                                    >
                                        💰 Find Wallets
                                    </button>
                                </div>
                                {formData.creatorAddress && !isValidSolanaAddress(formData.creatorAddress) && (
                                    <p className="text-red-400 text-sm mt-1">
                                        Please enter a valid Solana address
                                    </p>
                                )}
                                <p className="text-gray-400 text-xs mt-1">
                                    💡 Use high-SOL wallets to increase your token's credibility
                                </p>
                            </div>

                            <div>
                                <label className="block text-primary font-medium mb-2">
                                    Creator's Name *
                                </label>
                                <input
                                    type="text"
                                    name="creatorName"
                                    value={formData.creatorName}
                                    onChange={handleInputChange}
                                    required={showCreatorInfo}
                                    className="w-full px-4 py-3 dark-input rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Ex: Luna Launch"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Social Links & Tags Toggle */}
                <div className="border-t border-subtle pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-primary">Add Social Links & Tags</h3>
                            <p className="text-muted text-sm">
                                Add links to your token metadata.
                            </p>
                        </div>
                        <div className="flex items-center">
                            <span className="text-purple-light mr-3">+0.1 SOL</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showSocialLinks}
                                    onChange={(e) => setShowSocialLinks(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                            </label>
                        </div>
                    </div>

                    {/* Social Links Fields */}
                    {showSocialLinks && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-primary font-medium mb-2">
                                    Telegram Link *
                                </label>
                                <input
                                    type="url"
                                    name="telegramLink"
                                    value={formData.telegramLink}
                                    onChange={handleInputChange}
                                    required={showSocialLinks}
                                    className="w-full px-4 py-3 dark-input rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Ex: https://t.me/lunalaunch"
                                />
                            </div>

                            <div>
                                <label className="block text-primary font-medium mb-2">
                                    Twitter or X Link *
                                </label>
                                <input
                                    type="url"
                                    name="twitterLink"
                                    value={formData.twitterLink}
                                    onChange={handleInputChange}
                                    required={showSocialLinks}
                                    className="w-full px-4 py-3 dark-input rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Ex: https://x.com/@lunalaunch"
                                />
                            </div>

                            <div>
                                <label className="block text-primary font-medium mb-2">
                                    Website Link *
                                </label>
                                <input
                                    type="url"
                                    name="websiteLink"
                                    value={formData.websiteLink}
                                    onChange={handleInputChange}
                                    required={showSocialLinks}
                                    className="w-full px-4 py-3 dark-input rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Ex: https://www.lunalaunch.com"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Revoke Authorities (Investor's Booster) */}
                <div className="border-t border-subtle pt-6">
                    <h3 className="text-xl font-bold text-primary mb-4">Revoke Authorities (Investor's Booster)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Revoke Freeze */}
                        <div className="dark-card rounded-lg p-6">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-lg font-bold text-primary">Revoke Freeze</h4>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="revokeFreezeAuth"
                                        checked={formData.revokeFreezeAuth}
                                        onChange={handleCheckboxChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                                </label>
                            </div>
                            <p className="text-secondary text-sm mb-4">
                                No one will be able to freeze holders' token accounts anymore
                            </p>
                            <div className="text-purple-light font-medium">+0.1 SOL</div>
                        </div>

                        {/* Revoke Mint */}
                        <div className="dark-card rounded-lg p-6">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-lg font-bold text-primary">Revoke Mint</h4>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="revokeMintAuth"
                                        checked={formData.revokeMintAuth}
                                        onChange={handleCheckboxChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                                </label>
                            </div>
                            <p className="text-secondary text-sm mb-4">
                                No one will be able to create more tokens anymore
                            </p>
                            <div className="text-purple-light font-medium">+0.1 SOL</div>
                        </div>

                        {/* Revoke Update */}
                        <div className="dark-card rounded-lg p-6">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-lg font-bold text-primary">Revoke Update</h4>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="revokeUpdateAuth"
                                        checked={formData.revokeUpdateAuth}
                                        onChange={handleCheckboxChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                                </label>
                            </div>
                            <p className="text-secondary text-sm mb-4">
                                No one will be able to modify token metadata anymore
                            </p>
                            <div className="text-purple-light font-medium">+0.1 SOL</div>
                        </div>
                    </div>
                    <p className="text-muted text-sm mt-4">
                        Solana Token has 3 authorities: Freeze Authority, Mint Authority, and Update Authority. Revoke them to attract more investors.
                    </p>
                </div>

                {/* Cost Summary */}
                <div className="bg-black/30 rounded-lg p-6 border border-subtle">
                    <h3 className="text-xl font-bold text-primary mb-4">Cost Summary</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-primary">
                            <span>Base Token Creation:</span>
                            <span>{baseCost} SOL</span>
                        </div>
                        {formData.revokeMintAuth && (
                            <div className="flex justify-between text-primary">
                                <span>Revoke Mint Authority:</span>
                                <span>{premiumFeeCost} SOL</span>
                            </div>
                        )}
                        {formData.revokeFreezeAuth && (
                            <div className="flex justify-between text-primary">
                                <span>Revoke Freeze Authority:</span>
                                <span>{premiumFeeCost} SOL</span>
                            </div>
                        )}
                        {formData.revokeUpdateAuth && (
                            <div className="flex justify-between text-primary">
                                <span>Revoke Update Authority:</span>
                                <span>{premiumFeeCost} SOL</span>
                            </div>
                        )}
                        {showCreatorInfo && (
                            <div className="flex justify-between text-primary">
                                <span>Creator's Info:</span>
                                <span>{premiumFeeCost} SOL</span>
                            </div>
                        )}
                        {showSocialLinks && (
                            <div className="flex justify-between text-primary">
                                <span>Social Links & Tags:</span>
                                <span>{premiumFeeCost} SOL</span>
                            </div>
                        )}
                        <div className="border-t border-subtle pt-2">
                            <div className="flex justify-between text-xl font-bold text-primary">
                                <span>Total:</span>
                                <span>{calculateTotalCost()} SOL</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={
                        isLoading ||
                        !formData.name ||
                        !formData.symbol ||
                        !formData.description ||
                        (showCreatorInfo && (!formData.creatorAddress || !formData.creatorName || !isValidSolanaAddress(formData.creatorAddress))) ||
                        (showSocialLinks && (!formData.telegramLink || !formData.twitterLink || !formData.websiteLink))
                    }
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-8 rounded-lg text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {isLoading ? 'Creating Token...' : `Create Token (${calculateTotalCost()} SOL)`}
                </button>
            </form>

            {/* Wallet Finder Modal */}
            <WalletFinder
                isOpen={showWalletFinder}
                onClose={() => setShowWalletFinder(false)}
                onSelectWallet={handleWalletSelect}
                currentCreator={formData.creatorAddress}
            />
        </div>
    );
} 