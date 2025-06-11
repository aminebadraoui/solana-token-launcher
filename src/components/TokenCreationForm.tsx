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
    clonedImageUri: string | null; // Add support for cloned image URL
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
    metadataUri?: string;
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
        clonedImageUri: null,
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
    const [isDownloadingImage, setIsDownloadingImage] = useState(false);
    const [showFileInput, setShowFileInput] = useState(true);
    const [isFetchingSocialLinks, setIsFetchingSocialLinks] = useState(false);

    // Auto-populate form when clone data is available
    useEffect(() => {
        if (cloneData && !isAutoPopulated) {
            setFormData(prev => ({
                ...prev,
                name: generateCloneName(cloneData.name),
                symbol: generateCloneSymbol(cloneData.symbol),
                description: generateCloneDescription(cloneData.description), // Use description from metadata
                clonedImageUri: cloneData.imageUri || null, // Store for preview purposes
            }));

            // Download and convert the cloned image to a File object
            if (cloneData.imageUri) {
                downloadClonedImage(cloneData.imageUri, cloneData.symbol);
            }

            // Fetch and extract social links from metadata
            if (cloneData.metadataUri) {
                extractSocialLinksFromMetadata(cloneData.metadataUri, cloneData.symbol);
            }

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
        // Use the actual description directly, no fake additions
        return originalDescription || '';
    };

    const extractSocialLinksFromMetadata = async (metadataUri: string, tokenSymbol: string) => {
        setIsFetchingSocialLinks(true);
        try {
            console.log(`🔗 Fetching social links from metadata for ${tokenSymbol}:`, metadataUri);

            // Fetch metadata with timeout and fallback gateways (similar to image loading)
            const ipfsGateways = [
                'https://ipfs.io/ipfs/',
                'https://gateway.pinata.cloud/ipfs/',
                'https://cloudflare-ipfs.com/ipfs/',
                'https://dweb.link/ipfs/',
            ];

            let metadataResponse: Response | null = null;
            let lastError: Error | null = null;

            // Try original URL first
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);

                metadataResponse = await fetch(metadataUri, {
                    signal: controller.signal,
                    headers: { 'Accept': 'application/json' }
                });

                clearTimeout(timeoutId);
            } catch (error) {
                lastError = error as Error;
                console.log(`Original metadata URL failed for ${tokenSymbol}, trying IPFS gateways...`);

                // Try IPFS gateways if original URL failed
                if (metadataUri.includes('/ipfs/')) {
                    const ipfsHash = metadataUri.split('/ipfs/')[1];

                    for (const gateway of ipfsGateways) {
                        try {
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 1500);

                            metadataResponse = await fetch(gateway + ipfsHash, {
                                signal: controller.signal,
                                headers: { 'Accept': 'application/json' }
                            });

                            clearTimeout(timeoutId);
                            if (metadataResponse.ok) break;
                        } catch (gatewayError) {
                            continue; // Try next gateway
                        }
                    }
                }
            }

            if (metadataResponse && metadataResponse.ok) {
                const metadata = await metadataResponse.json();

                console.log(`📄 Metadata fetched for ${tokenSymbol}:`, metadata);

                // Extract social links from metadata
                const socialLinks = {
                    twitter: metadata.twitter || metadata.x || '',
                    telegram: metadata.telegram || '',
                    website: metadata.website || ''
                };

                // Check if we found any social links
                const hasAnyLinks = Object.values(socialLinks).some(link => link.trim() !== '');

                if (hasAnyLinks) {
                    console.log(`🎯 Found social links for ${tokenSymbol}:`, socialLinks);

                    // Auto-enable social links toggle
                    setShowSocialLinks(true);

                    // Update form data with extracted social links
                    setFormData(prev => ({
                        ...prev,
                        twitterLink: socialLinks.twitter,
                        telegramLink: socialLinks.telegram,
                        websiteLink: socialLinks.website,
                    }));

                    console.log(`✅ Auto-enabled social links and populated fields for ${tokenSymbol}`);
                } else {
                    console.log(`ℹ️ No social links found in metadata for ${tokenSymbol}`);
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.log(`⚠️ Failed to fetch metadata for ${tokenSymbol}:`, errorMessage);
        } finally {
            setIsFetchingSocialLinks(false);
        }
    };

    const downloadClonedImage = async (imageUri: string, tokenSymbol: string) => {
        setIsDownloadingImage(true);
        try {
            console.log('🖼️ Starting download of cloned image:', imageUri);

            // Fetch the image with timeout
            const response = await fetch(imageUri, {
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.status}`);
            }

            console.log('📦 Image fetched successfully, converting to blob...');

            // Get the blob
            const imageBlob = await response.blob();

            // Determine file extension from content type or URL
            let extension = 'png'; // default
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('jpeg') || contentType?.includes('jpg')) {
                extension = 'jpg';
            } else if (contentType?.includes('png')) {
                extension = 'png';
            } else if (contentType?.includes('gif')) {
                extension = 'gif';
            } else if (contentType?.includes('webp')) {
                extension = 'webp';
            }

            // Create a File object from the blob
            const fileName = `${tokenSymbol}_cloned_image.${extension}`;
            const imageFile = new File([imageBlob], fileName, {
                type: contentType || 'image/png',
                lastModified: Date.now()
            });

            console.log('📁 Created File object:', {
                name: imageFile.name,
                size: imageFile.size,
                type: imageFile.type
            });

            // Update the form data with the downloaded image
            setFormData(prev => ({
                ...prev,
                image: imageFile,
                clonedImageUri: null // Clear this since we now have the actual file
            }));

            // Hide the file input since we have a cloned image
            setShowFileInput(false);

            console.log('✅ Successfully downloaded and converted cloned image to File object');

        } catch (error) {
            console.error('❌ Failed to download cloned image:', error);
            // Keep the clonedImageUri for fallback display
            console.log('ℹ️ Keeping original image URI as fallback');
        } finally {
            setIsDownloadingImage(false);
        }
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
        // Don't add clone fee in promotional mode - it's free
        return total;
    };

    const calculateRegularTotalCost = () => {
        let total = baseCost;
        if (formData.revokeMintAuth) total += premiumFeeCost;
        if (formData.revokeFreezeAuth) total += premiumFeeCost;
        if (formData.revokeUpdateAuth) total += premiumFeeCost;
        if (showCreatorInfo) total += premiumFeeCost;
        if (showSocialLinks) total += premiumFeeCost;
        // Add clone fee for regular pricing (what it would normally cost)
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

            {/* Social links fetching indicator */}
            {isCloneMode && isFetchingSocialLinks && (
                <div className="mb-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                            <div className="animate-spin w-5 h-5 border-2 border-cyan-300 border-t-transparent rounded-full"></div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-cyan-300 mb-1">
                                🔗 Extracting Social Links...
                            </h3>
                            <p className="text-sm text-cyan-200">
                                Checking token metadata for Twitter, Telegram, and Website links
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
                        {isCloneMode && formData.clonedImageUri && (
                            <span className="text-muted text-sm ml-2">
                                Using cloned token image. Upload a new file to override.
                            </span>
                        )}
                    </label>

                    {/* Show image download loading state */}
                    {isCloneMode && isDownloadingImage && (
                        <div className="mb-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                                    <div className="animate-spin w-6 h-6 border-2 border-blue-300 border-t-transparent rounded-full"></div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-300">
                                        📥 Downloading cloned image...
                                    </p>
                                    <p className="text-xs text-blue-200">
                                        Converting to your own image file
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Show cloned image preview if available (fallback case) */}
                    {isCloneMode && formData.clonedImageUri && !formData.image && !isDownloadingImage && (
                        <div className="mb-4 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg">
                            <div className="flex items-center gap-4">
                                <img
                                    src={formData.clonedImageUri}
                                    alt="Cloned token image (fallback)"
                                    className="w-16 h-16 rounded-lg object-cover border border-yellow-500/30"
                                    onError={(e) => {
                                        // Fallback if image fails to load
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-yellow-300">
                                        ⚠️ Fallback: Using original image URL
                                    </p>
                                    <p className="text-xs text-yellow-200">
                                        Download failed. Upload a new image below to replace.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, clonedImageUri: null }))}
                                    className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded border border-red-500/30 hover:bg-red-500/10 transition-colors"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    )}



                    {/* Show image preview */}
                    {formData.image ? (
                        <div className="mb-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                            <div className="flex items-start gap-4">
                                {/* Image Preview - Made bigger */}
                                <div className="flex-shrink-0">
                                    <img
                                        src={URL.createObjectURL(formData.image)}
                                        alt="Token image preview"
                                        className="w-32 h-32 rounded-lg object-cover border border-gray-500"
                                        onLoad={(e) => {
                                            // Clean up the object URL to prevent memory leaks
                                            // We'll keep it for now since we need it for display
                                        }}
                                    />
                                </div>
                                {/* File Info */}
                                <div className="flex-1">
                                    <p className="text-sm text-green-400 font-medium">
                                        {formData.image.name.includes('_cloned_image') ? '📥 Downloaded from trending token' : '📤 Uploaded'}: {formData.image.name}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {(formData.image.size / 1024).toFixed(1)} KB • {formData.image.type}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        This image will be uploaded to IPFS when you create the token
                                    </p>
                                </div>
                                {/* Remove Button */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, image: null }));
                                        setShowFileInput(true); // Show file input again when removing
                                    }}
                                    className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded border border-red-500/30 hover:bg-red-500/10 transition-colors"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {/* File input or replace button */}
                    {showFileInput ? (
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full px-4 py-3 dark-input rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                setShowFileInput(true);
                                setFormData(prev => ({ ...prev, image: null }));
                            }}
                            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg text-blue-300 hover:text-blue-200 hover:bg-gradient-to-r hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            🖼️ Replace with your own image
                        </button>
                    )}

                    <p className="text-xs text-gray-400 mt-2">
                        {formData.image
                            ? 'Upload a new file to replace the current image'
                            : 'Upload an image file for your token'
                        }
                    </p>
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
                        {isCloneMode && (
                            <div className="flex justify-between text-primary">
                                <span>🎉 Premium Cloning Feature:</span>
                                <span className="flex items-center gap-2">
                                    <span className="line-through opacity-60 text-red-300">0.1 SOL</span>
                                    <span className="text-green-400 font-bold">FREE</span>
                                </span>
                            </div>
                        )}
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
                                {isCloneMode ? (
                                    <span className="flex items-center gap-2">
                                        <span className="line-through opacity-60 text-red-300">{calculateRegularTotalCost()} SOL</span>
                                        <span className="text-green-400">{calculateTotalCost()} SOL</span>
                                    </span>
                                ) : (
                                    <span>{calculateTotalCost()} SOL</span>
                                )}
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