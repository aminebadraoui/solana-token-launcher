'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/lib/userContext';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { NoSSRWrapper } from '@/components/WalletContextProvider';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const pathname = usePathname();
    const { user, logout, userTokens } = useUser();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const navigationItems = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
                </svg>
            ),
        },
        {
            name: 'Create Token',
            href: '/dashboard/create-token',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            ),
        },
        {
            name: 'Clone Token',
            href: '/dashboard/clone-token',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            ),
        },
        {
            name: 'My Wallets',
            href: '/dashboard/wallets',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
        },
        {
            name: 'My Tokens',
            href: '/dashboard/tokens',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
            badge: userTokens.length > 0 ? userTokens.length : undefined,
        },
    ];

    return (
        <div className="h-screen w-full dark-gradient-bg flex">
            {/* Mobile sidebar overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 lg:hidden bg-black bg-opacity-50 backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 dark-card backdrop-blur-xl border-r border-white/10 flex flex-col transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
                <div className="flex items-center justify-center h-16 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-white/10 flex-shrink-0">
                    <Link href="/dashboard" className="flex items-center space-x-2 group">
                        <span className="hero-title text-2xl font-bold gradient-moon group-hover:scale-105 transition-transform duration-300">
                            MOONRUSH
                        </span>
                    </Link>
                </div>

                {/* User info */}
                <div className="p-4 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <span className="text-white font-semibold text-sm">
                                {user?.walletAddress.slice(0, 2).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-primary truncate">
                                {user?.walletAddress.slice(0, 8)}...{user?.walletAddress.slice(-4)}
                            </p>
                            <p className="text-xs text-secondary">
                                {user?.totalTokensCreated || 0} tokens created
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="mt-4 px-2 flex-1 overflow-y-auto">
                    <ul className="space-y-1">
                        {navigationItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
                            return (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${isActive
                                            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-primary border-r-2 border-purple-500 scale-105'
                                            : 'text-secondary hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 hover:text-primary hover:scale-105'
                                            }`}
                                        onClick={() => setIsSidebarOpen(false)}
                                    >
                                        <span className={`flex-shrink-0 transition-colors duration-300 ${isActive ? 'text-purple-400' : 'text-secondary group-hover:text-purple-400'}`}>
                                            {item.icon}
                                        </span>
                                        <span className="ml-3">{item.name}</span>
                                        {item.badge && (
                                            <span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full animate-pulse">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Logout button */}
                <div className="p-4 flex-shrink-0">
                    <button
                        onClick={logout}
                        className="w-full flex items-center px-3 py-2 text-sm font-medium text-secondary rounded-lg hover:bg-gradient-to-r hover:from-red-500/10 hover:to-pink-500/10 hover:text-primary transition-all duration-300 hover:scale-105"
                    >
                        <svg className="w-5 h-5 text-secondary group-hover:text-red-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="ml-3">Logout</span>
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-h-0 lg:ml-0">
                {/* Top header */}
                <div className="flex h-16 items-center gap-x-4 border-b border-white/10 dark-card backdrop-blur-xl px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 flex-shrink-0">
                    <button
                        type="button"
                        className="-m-2.5 p-2.5 text-secondary lg:hidden hover:text-primary hover:scale-110 transition-all duration-300"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>

                    <div className="flex flex-1 justify-end gap-x-4 self-stretch lg:gap-x-6">
                        <div className="flex items-center gap-x-4 lg:gap-x-6">
                            <NoSSRWrapper>
                                <WalletMultiButton className="!bg-gradient-to-r !from-purple-500 !to-pink-500 !text-white !font-medium !py-2 !px-4 !rounded-lg hover:!from-purple-600 hover:!to-pink-600 !transition-all !duration-300 !transform hover:!scale-105" />
                            </NoSSRWrapper>
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="flex-1 overflow-auto min-h-0">
                    <div className="h-full px-4 py-6 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
} 