'use client';

import Link from 'next/link';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { NoSSRWrapper } from '@/components/WalletContextProvider';

export function Header() {
    return (
        <nav className="flex justify-between items-center p-6 relative z-50">
            <Link href="/" className="group transition-all duration-300 hover:scale-105">
                <span className="hero-title text-3xl font-bold gradient-moon">
                    MOONRUSH
                </span>
            </Link>

            <NoSSRWrapper>
                <WalletMultiButton className="!bg-gradient-to-r !from-purple-500 !to-pink-500 !text-white !font-medium !py-2 !px-4 !rounded-lg hover:!from-purple-600 hover:!to-pink-600 !transition-all !duration-300 !transform hover:!scale-105" />
            </NoSSRWrapper>
        </nav>
    );
} 