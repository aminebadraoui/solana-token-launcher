'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletManager as WalletService, ManagedWallet } from '@/lib/walletManager';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Keypair } from '@solana/web3.js';
import { Trash2, Plus, Copy, Download, Edit2, Eye, EyeOff, Wallet, Key } from 'lucide-react';

interface WalletManagerProps {
    className?: string;
}

export function WalletManager({ className = '' }: WalletManagerProps) {
    const { publicKey } = useWallet();
    const [wallets, setWallets] = useState<ManagedWallet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    // Bulk create form is always visible, no toggle needed
    const [walletLimit, setWalletLimit] = useState({ canCreate: false, currentCount: 0, maxCount: 10 });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form states
    const [bulkCreateCount, setBulkCreateCount] = useState(1);
    const [bulkCreatePrefix, setBulkCreatePrefix] = useState('Wallet');
    const [showPrivateKey, setShowPrivateKey] = useState<{ [key: string]: boolean }>({});
    const [editingWallet, setEditingWallet] = useState<{ id: string; name: string } | null>(null);
    const [newlyCreatedWallets, setNewlyCreatedWallets] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (publicKey) {
            loadWallets();
            checkWalletLimit();
        }
    }, [publicKey]);

    // Clear messages after 5 seconds
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null);
                setSuccess(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    const loadWallets = async () => {
        if (!publicKey) return;

        try {
            setIsLoading(true);
            setError(null);
            const userWallets = await WalletService.getUserWallets(publicKey.toString());
            setWallets(userWallets);
        } catch (error: any) {
            console.error('Error loading wallets:', error);
            setError('Failed to load wallets: ' + (error.message || 'Unknown error'));
        } finally {
            setIsLoading(false);
        }
    };

    const checkWalletLimit = async () => {
        if (!publicKey) return;

        try {
            const limit = await WalletService.canCreateWallet(publicKey.toString());
            setWalletLimit(limit);
        } catch (error: any) {
            console.error('Error checking wallet limit:', error);
            setError('Failed to check wallet limit: ' + error.message);
        }
    };



    const handleBulkCreateWallets = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!publicKey || bulkCreateCount < 1 || bulkCreateCount > 10) {
            setError('Please enter a valid number of wallets (1-10)');
            return;
        }

        if (walletLimit.currentCount + bulkCreateCount > walletLimit.maxCount) {
            setError(`Cannot create ${bulkCreateCount} wallets. You can only create ${walletLimit.maxCount - walletLimit.currentCount} more wallets.`);
            return;
        }

        try {
            setIsCreating(true);
            setError(null);

            const createdWallets: ManagedWallet[] = [];

            for (let i = 1; i <= bulkCreateCount; i++) {
                const walletName = `${bulkCreatePrefix} ${walletLimit.currentCount + i}`;

                try {
                    const newWallet = await WalletService.createWallet(publicKey.toString(), {
                        name: walletName
                    });

                    if (newWallet) {
                        createdWallets.push(newWallet);
                        // Mark as newly created and show private key initially
                        setNewlyCreatedWallets(prev => new Set(prev).add(newWallet.id));
                        setShowPrivateKey(prev => ({ ...prev, [newWallet.id]: true }));
                    }
                } catch (error: any) {
                    console.error(`Error creating wallet ${i}:`, error);
                    setError(`Failed to create wallet ${i}: ${error.message}`);
                    break;
                }
            }

            if (createdWallets.length > 0) {
                await loadWallets(); // Reload all wallets
                setBulkCreateCount(1);
                setBulkCreatePrefix('Wallet');
                setSuccess(`Successfully created ${createdWallets.length} wallet(s)! Private keys are shown below - save them securely!`);
                await checkWalletLimit();
            }
        } catch (error: any) {
            console.error('Bulk create error:', error);
            setError(error.message || 'Failed to create wallets');
        } finally {
            setIsCreating(false);
        }
    };



    const handleDeleteWallet = async (walletId: string, walletName: string) => {
        if (!publicKey || !confirm(`Are you sure you want to delete "${walletName}"?`)) return;

        try {
            setError(null);
            const success = await WalletService.deleteWallet(publicKey.toString(), walletId);

            if (success) {
                await loadWallets(); // Reload all wallets
                setSuccess(`Wallet "${walletName}" deleted successfully!`);
                await checkWalletLimit();
            }
        } catch (error: any) {
            console.error('Delete wallet error:', error);
            setError(error.message || 'Failed to delete wallet');
        }
    };

    const handleUpdateWalletName = async () => {
        if (!publicKey || !editingWallet || !editingWallet.name.trim()) return;

        try {
            setError(null);
            const success = await WalletService.updateWalletName(
                publicKey.toString(),
                editingWallet.id,
                editingWallet.name.trim()
            );

            if (success) {
                await loadWallets(); // Reload all wallets
                setEditingWallet(null);
                setSuccess('Wallet name updated successfully!');
            }
        } catch (error: any) {
            console.error('Update wallet name error:', error);
            setError(error.message || 'Failed to update wallet name');
        }
    };

    const handleCopyPublicKey = async (publicKeyToCopy: string) => {
        try {
            await navigator.clipboard.writeText(publicKeyToCopy);
            setSuccess('Public key copied to clipboard!');
        } catch (error) {
            setError('Failed to copy public key');
        }
    };

    const handleCopyPrivateKey = async (walletId: string) => {
        if (!publicKey) return;

        try {
            const privateKey = await WalletService.getWalletPrivateKey(publicKey.toString(), walletId);
            if (privateKey) {
                const privateKeyString = JSON.stringify(Array.from(privateKey));
                await navigator.clipboard.writeText(privateKeyString);
                setSuccess('Private key copied to clipboard!');
            }
        } catch (error: any) {
            console.error('Copy private key error:', error);
            setError(error.message || 'Failed to get private key');
        }
    };

    const handleExportWallet = async (walletId: string, walletName: string) => {
        if (!publicKey) return;

        try {
            const exportData = await WalletService.exportWalletData(publicKey.toString(), walletId);
            if (exportData) {
                const dataStr = JSON.stringify(exportData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${walletName}-export.json`;
                link.click();
                URL.revokeObjectURL(url);
                setSuccess('Wallet data exported successfully!');
            }
        } catch (error: any) {
            console.error('Export wallet error:', error);
            setError(error.message || 'Failed to export wallet');
        }
    };

    const togglePrivateKeyVisibility = (walletId: string) => {
        // Only allow toggling for newly created wallets
        if (newlyCreatedWallets.has(walletId)) {
            setShowPrivateKey(prev => ({
                ...prev,
                [walletId]: !prev[walletId]
            }));
        }
    };

    const dismissNewWalletStatus = (walletId: string) => {
        // Remove from newly created set and hide private key
        setNewlyCreatedWallets(prev => {
            const newSet = new Set(prev);
            newSet.delete(walletId);
            return newSet;
        });
        setShowPrivateKey(prev => ({
            ...prev,
            [walletId]: false
        }));
    };

    if (!publicKey) {
        return (
            <div className={`flex items-center justify-center h-64 ${className}`}>
                <div className="text-center">
                    <Wallet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-300 mb-2">Connect Your Wallet</h3>
                    <p className="text-gray-500">Please connect your wallet to manage multiple wallets</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Wallet Manager</h1>
                    <p className="text-gray-400 mt-1">
                        Manage your Solana wallets ({walletLimit.currentCount}/{walletLimit.maxCount} used)
                    </p>
                </div>

                <div className="text-sm text-gray-400">
                    {walletLimit.canCreate ? 'Ready to create wallets' : 'Wallet limit reached'}
                </div>
            </div>



            {/* Error/Success Messages */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <p className="text-green-400">{success}</p>
                </div>
            )}



            {/* Create Wallets Form */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Create Wallets</h3>
                <form onSubmit={handleBulkCreateWallets} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Number of Wallets
                            </label>
                            <input
                                type="number"
                                min="1"
                                max={Math.min(10, walletLimit.maxCount - walletLimit.currentCount)}
                                value={bulkCreateCount}
                                onChange={(e) => setBulkCreateCount(parseInt(e.target.value) || 1)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={!walletLimit.canCreate}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Name Prefix
                            </label>
                            <input
                                type="text"
                                value={bulkCreatePrefix}
                                onChange={(e) => setBulkCreatePrefix(e.target.value)}
                                placeholder="Wallet"
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={!walletLimit.canCreate}
                            />
                        </div>
                    </div>
                    <div className="text-sm text-gray-400">
                        Will create: {bulkCreatePrefix} {walletLimit.currentCount + 1}, {bulkCreatePrefix} {walletLimit.currentCount + 2}, etc.
                    </div>
                    <button
                        type="submit"
                        disabled={isCreating || !walletLimit.canCreate}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-all"
                    >
                        {isCreating ? 'Creating...' : `Create ${bulkCreateCount} Wallet(s)`}
                    </button>
                </form>
            </div>



            {/* Separator */}
            <div className="border-t border-white/10 my-8"></div>

            {/* Existing Wallets */}
            <div>
                <h2 className="text-xl font-semibold text-white mb-4">Your Wallets</h2>
                {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                    </div>
                ) : wallets.length === 0 ? (
                    <div className="text-center py-12">
                        <Wallet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-300 mb-2">No Wallets Yet</h3>
                        <p className="text-gray-500 mb-4">Create your first wallet to get started</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {wallets.map((wallet) => (
                            <div key={wallet.id} className={`bg-white/5 backdrop-blur-sm border rounded-xl p-6 ${newlyCreatedWallets.has(wallet.id) ? 'border-green-500/50 bg-green-500/5' : 'border-white/10'}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            {editingWallet?.id === wallet.id ? (
                                                <div className="flex items-center gap-2 flex-1">
                                                    <input
                                                        type="text"
                                                        value={editingWallet.name}
                                                        onChange={(e) => setEditingWallet({ ...editingWallet, name: e.target.value })}
                                                        className="bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-lg font-semibold"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleUpdateWalletName();
                                                            if (e.key === 'Escape') setEditingWallet(null);
                                                        }}
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={handleUpdateWalletName}
                                                        className="text-green-400 hover:text-green-300"
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingWallet(null)}
                                                        className="text-gray-400 hover:text-gray-300"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <h3 className="text-lg font-semibold text-white">{wallet.name}</h3>
                                                    <button
                                                        onClick={() => setEditingWallet({ id: wallet.id, name: wallet.name })}
                                                        className="text-gray-400 hover:text-white"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1">Public Key</label>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 text-sm font-mono text-gray-300 bg-black/20 px-2 py-1 rounded">
                                                        {wallet.public_key}
                                                    </code>
                                                    <button
                                                        onClick={() => handleCopyPublicKey(wallet.public_key)}
                                                        className="text-gray-400 hover:text-white"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {newlyCreatedWallets.has(wallet.id) ? (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <label className="block text-xs text-green-400 font-medium">Private Key (Save This Securely!)</label>
                                                        <button
                                                            onClick={() => dismissNewWalletStatus(wallet.id)}
                                                            className="text-xs text-green-400 hover:text-green-300 underline"
                                                            title="I've saved the private key securely"
                                                        >
                                                            I've saved it ✓
                                                        </button>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <textarea
                                                            readOnly
                                                            value={showPrivateKey[wallet.id] ? wallet.encrypted_private_key : '••••••••••••••••••••••••••••••••'}
                                                            className="flex-1 text-sm font-mono text-gray-300 bg-black/20 px-2 py-1 rounded resize-none border border-green-500/30"
                                                            rows={showPrivateKey[wallet.id] ? 3 : 1}
                                                        />
                                                        <div className="flex flex-col gap-1">
                                                            <button
                                                                onClick={() => togglePrivateKeyVisibility(wallet.id)}
                                                                className="text-green-400 hover:text-green-300 p-1"
                                                                title={showPrivateKey[wallet.id] ? "Hide private key" : "Show private key"}
                                                            >
                                                                {showPrivateKey[wallet.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                            </button>
                                                            <button
                                                                onClick={() => handleCopyPrivateKey(wallet.id)}
                                                                className="text-green-400 hover:text-green-300 p-1"
                                                                title="Copy private key"
                                                            >
                                                                <Copy className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                                                        <Key className="h-3 w-3" />
                                                        This is your only chance to see the private key. Save it securely!
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="mt-3 text-xs text-gray-500">
                                            Created: {new Date(wallet.created_at).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => handleExportWallet(wallet.id, wallet.name)}
                                            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                            title="Export wallet"
                                        >
                                            <Download className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteWallet(wallet.id, wallet.name)}
                                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                            title="Delete wallet"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
} 