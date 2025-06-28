'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useUser } from '@/lib/userContext';

interface DashboardLayoutPageProps {
    children: React.ReactNode;
}

export default function DashboardLayoutPage({ children }: DashboardLayoutPageProps) {
    const router = useRouter();
    const { connected } = useWallet();
    const { user, isLoading } = useUser();

    useEffect(() => {
        // Redirect to home if wallet is not connected
        if (!connected && !isLoading) {
            router.push('/');
        }
    }, [connected, isLoading, router]);

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="h-screen dark-gradient-bg flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-secondary">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Show error state if wallet is not connected
    if (!connected) {
        return (
            <div className="h-screen dark-gradient-bg flex items-center justify-center">
                <div className="text-center">
                    <h1 className="hero-title text-2xl font-bold text-primary mb-4">Wallet Not Connected</h1>
                    <p className="text-secondary mb-6">Please connect your wallet to access the dashboard.</p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium py-2 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen overflow-hidden">
            <DashboardLayout>{children}</DashboardLayout>
        </div>
    );
} 