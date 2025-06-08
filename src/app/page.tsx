'use client';

import Link from 'next/link';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6">
        <div className="text-2xl font-bold text-white">
          Solana Token Launcher
        </div>
        <WalletMultiButton />
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-6">
            Create Your Token
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              In Minutes
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Launch your SPL token on Solana blockchain with no coding required.
            Fast, secure, and professional token creation platform.
          </p>
          <Link
            href="/create-token"
            className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-8 rounded-lg text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
          >
            Create Your Token
          </Link>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">1000+</div>
            <div className="text-gray-300">Tokens Launched</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">99.9%</div>
            <div className="text-gray-300">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">24/7</div>
            <div className="text-gray-300">Support</div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-white text-center mb-16">
          Why Choose Our Platform?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-white mb-4">Lightning Fast</h3>
            <p className="text-gray-300">
              Create and deploy your token in under 5 minutes with our streamlined process.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-white mb-4">Secure</h3>
            <p className="text-gray-300">
              Built with security first. Your private keys never leave your wallet.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-white mb-4">No Code Required</h3>
            <p className="text-gray-300">
              Simple form-based interface. No technical knowledge needed.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-white text-center mb-16">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-3">How much does it cost?</h3>
            <p className="text-gray-300">
              Basic token creation starts at 0.1 SOL. Premium features like authority revocation cost additional 0.1 SOL each.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-3">Is it safe?</h3>
            <p className="text-gray-300">
              Yes! We never store your private keys. All transactions are signed directly in your wallet.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-3">What wallets are supported?</h3>
            <p className="text-gray-300">
              We support Phantom, Solflare, and other popular Solana wallets.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/20 py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-400">
            © 2024 Solana Token Launcher. Built with ❤️ for the Solana ecosystem.
          </p>
        </div>
      </footer>
    </div>
  );
}
