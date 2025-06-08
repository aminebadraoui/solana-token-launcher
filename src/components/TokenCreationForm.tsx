'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { createTokenMint } from '@/lib/tokenMinting';

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
}

export function TokenCreationForm() {
    const { publicKey, signTransaction } = useWallet();
    const { connection } = useConnection();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<TokenFormData>({
        name: '',
        symbol: '',
        decimals: 9,
        supply: 1000000,
        description: '',
        image: null,
        revokeMintAuth: false,
        revokeFreezeAuth: false,
        revokeUpdateAuth: false,
        customCreator: false,
    });

    const baseCost = 0.1; // SOL
    const premiumFeeCost = 0.1; // SOL per premium feature

    const calculateTotalCost = () => {
        let total = baseCost;
        if (formData.revokeMintAuth) total += premiumFeeCost;
        if (formData.revokeFreezeAuth) total += premiumFeeCost;
        if (formData.revokeUpdateAuth) total += premiumFeeCost;
        if (formData.customCreator) total += premiumFeeCost;
        return total;
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
            [name]: checked
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setFormData(prev => ({
            ...prev,
            image: file
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!publicKey || !signTransaction) {
            alert('Please connect your wallet');
            return;
        }

        setIsLoading(true);
        try {
            await createTokenMint({
                connection,
                payer: publicKey,
                signTransaction,
                formData,
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
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Token Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-white font-medium mb-2">
                            Token Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="My Awesome Token"
                        />
                    </div>

                    <div>
                        <label className="block text-white font-medium mb-2">
                            Symbol *
                        </label>
                        <input
                            type="text"
                            name="symbol"
                            value={formData.symbol}
                            onChange={handleInputChange}
                            required
                            maxLength={5}
                            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="MAT"
                        />
                    </div>

                    <div>
                        <label className="block text-white font-medium mb-2">
                            Decimals
                        </label>
                        <input
                            type="number"
                            name="decimals"
                            value={formData.decimals}
                            onChange={handleInputChange}
                            min="0"
                            max="18"
                            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-white font-medium mb-2">
                            Initial Supply
                        </label>
                        <input
                            type="number"
                            name="supply"
                            value={formData.supply}
                            onChange={handleInputChange}
                            min="1"
                            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-white font-medium mb-2">
                        Description
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Describe your token..."
                    />
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-white font-medium mb-2">
                        Token Image (1000x1000 recommended)
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                    />
                </div>

                {/* Premium Options */}
                <div className="border-t border-white/20 pt-6">
                    <h3 className="text-xl font-bold text-white mb-4">Premium Options</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="revokeMintAuth"
                                checked={formData.revokeMintAuth}
                                onChange={handleCheckboxChange}
                                className="w-5 h-5 text-purple-500 bg-white/20 border-white/30 rounded focus:ring-purple-500"
                            />
                            <span className="text-white">
                                Revoke Mint Authority (+{premiumFeeCost} SOL)
                            </span>
                        </label>

                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="revokeFreezeAuth"
                                checked={formData.revokeFreezeAuth}
                                onChange={handleCheckboxChange}
                                className="w-5 h-5 text-purple-500 bg-white/20 border-white/30 rounded focus:ring-purple-500"
                            />
                            <span className="text-white">
                                Revoke Freeze Authority (+{premiumFeeCost} SOL)
                            </span>
                        </label>

                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="revokeUpdateAuth"
                                checked={formData.revokeUpdateAuth}
                                onChange={handleCheckboxChange}
                                className="w-5 h-5 text-purple-500 bg-white/20 border-white/30 rounded focus:ring-purple-500"
                            />
                            <span className="text-white">
                                Revoke Update Authority (+{premiumFeeCost} SOL)
                            </span>
                        </label>

                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="customCreator"
                                checked={formData.customCreator}
                                onChange={handleCheckboxChange}
                                className="w-5 h-5 text-purple-500 bg-white/20 border-white/30 rounded focus:ring-purple-500"
                            />
                            <span className="text-white">
                                Custom Creator (+{premiumFeeCost} SOL)
                            </span>
                        </label>
                    </div>
                </div>

                {/* Cost Summary */}
                <div className="bg-purple-900/30 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Cost Summary</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-white">
                            <span>Base Token Creation:</span>
                            <span>{baseCost} SOL</span>
                        </div>
                        {formData.revokeMintAuth && (
                            <div className="flex justify-between text-white">
                                <span>Revoke Mint Authority:</span>
                                <span>{premiumFeeCost} SOL</span>
                            </div>
                        )}
                        {formData.revokeFreezeAuth && (
                            <div className="flex justify-between text-white">
                                <span>Revoke Freeze Authority:</span>
                                <span>{premiumFeeCost} SOL</span>
                            </div>
                        )}
                        {formData.revokeUpdateAuth && (
                            <div className="flex justify-between text-white">
                                <span>Revoke Update Authority:</span>
                                <span>{premiumFeeCost} SOL</span>
                            </div>
                        )}
                        {formData.customCreator && (
                            <div className="flex justify-between text-white">
                                <span>Custom Creator:</span>
                                <span>{premiumFeeCost} SOL</span>
                            </div>
                        )}
                        <div className="border-t border-white/20 pt-2">
                            <div className="flex justify-between text-xl font-bold text-white">
                                <span>Total:</span>
                                <span>{calculateTotalCost()} SOL</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading || !formData.name || !formData.symbol}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-8 rounded-lg text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {isLoading ? 'Creating Token...' : `Create Token (${calculateTotalCost()} SOL)`}
                </button>
            </form>
        </div>
    );
} 