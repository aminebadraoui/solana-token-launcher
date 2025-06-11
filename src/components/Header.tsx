'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { NoSSRWrapper } from '@/components/WalletContextProvider';

export function Header() {
    const pathname = usePathname();
    return (
        <nav className="flex justify-between items-center p-6 dark-nav relative z-50">
            <Link href="/" className="text-2xl font-bold text-primary hover:text-purple-light transition-colors duration-300">
                Solana Token Launcher
            </Link>

            {/* Navigation Menu */}
            <div className="hidden md:flex items-center space-x-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-2 border border-gray-700/50">
                <Link
                    href="/"
                    className={`px-6 py-2 rounded-full text-white hover:bg-white/10 transition-all duration-300 font-medium ${pathname === '/' ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/50' : ''
                        }`}
                >
                    Home
                </Link>
                <Link
                    href="/trending"
                    className={`px-6 py-2 rounded-full text-white hover:bg-white/10 transition-all duration-300 font-medium ${pathname === '/trending' ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/50' : ''
                        }`}
                >
                    🔥 Clone Tokens
                </Link>
                <Link
                    href="/create-token"
                    className={`px-6 py-2 rounded-full text-white hover:bg-white/10 transition-all duration-300 font-medium ${pathname === '/create-token' || pathname.startsWith('/create-token') ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/50' : ''
                        }`}
                >
                    Create Token
                </Link>
                <Link
                    href="#support"
                    className="px-6 py-2 rounded-full text-white hover:bg-white/10 transition-all duration-300 font-medium"
                >
                    Support
                </Link>
            </div>

            <NoSSRWrapper>
                <WalletMultiButton />
            </NoSSRWrapper>
        </nav>
    );
} 