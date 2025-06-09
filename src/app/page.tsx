'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { NoSSRWrapper } from '@/components/WalletContextProvider';
import { Header } from '@/components/Header';

export default function Home() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 100); // Show sticky header after scrolling 100px
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqData = [
    {
      question: "What is Solana Token Launcher?"
    },
    {
      question: "How can I create a token on Solana using your platform?"
    },
    {
      question: "What are token authorities and should I revoke them?"
    },
    {
      question: "How much does it cost to create a token?"
    },
    {
      question: "Do I need programming skills to use this platform?"
    },
    {
      question: "How can I verify my token was created successfully?"
    },
    {
      question: "Is the platform secure and what about my private keys?"
    },
    {
      question: "What support is available if I encounter issues?"
    }
  ];

  return (
    <div className="min-h-screen dark-gradient-bg">
      {/* Navigation */}
      <Header />

      {/* Sticky Header - appears on scroll */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 transform ${isScrolled ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}>
        <div className="bg-black/80 backdrop-blur-md border-b border-gray-700/50 px-6 py-4">
          <div className="container mx-auto flex justify-center">
            <Link
              href="/create-token"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-lg text-sm hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
            >
              Create your first Token
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section with Moon Background */}
      <div className="relative overflow-hidden min-h-screen flex flex-col">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/images/bg-moon.png)' }}
        >
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/20 to-transparent"></div>

        <div className="container mx-auto px-6 pt-12 relative z-10 flex flex-col flex-1">
          {/* Top Content */}
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30 mb-4">
              <span className="text-purple-light font-medium">#1 Solana Token Launcher in the World</span>
            </div>

            <h1 className="hero-title text-4xl lg:text-5xl text-primary mb-6 leading-tight">
              Launch your Solana Token
              <span className="block">Take it to the <span className="gradient-moon">Moon!</span></span>
            </h1>

            <p className="text-lg text-secondary mb-8 max-w-3xl mx-auto leading-relaxed">
              Create and deploy your Solana coin effortlessly in seconds.
              Reach the world and scale without limits!
            </p>

            <div className="flex justify-center mb-8">
              <Link
                href="/create-token"
                className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-8 rounded-lg text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
              >
                Create your first Token
              </Link>
            </div>
          </div>

          {/* iPhone Image at bottom of hero */}
          <div className="flex justify-center mt-auto">
            <img
              src="/images/iphone-phantom.png"
              alt="iPhone showing Phantom wallet interface"
              className="w-auto h-[300px] max-w-none drop-shadow-2xl"
            />
          </div>
        </div>
      </div>

      {/* Stats Section with Visual Cards */}
      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="dark-card rounded-xl p-8 text-center group hover:scale-105 transition-all duration-300">
            <div className="stats-number text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
              1000+
            </div>
            <div className="text-secondary mb-2">Tokens Launched</div>
            <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full"></div>
          </div>
          <div className="dark-card rounded-xl p-8 text-center group hover:scale-105 transition-all duration-300">
            <div className="stats-number text-5xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-3">
              99.9%
            </div>
            <div className="text-secondary mb-2">Success Rate</div>
            <div className="w-12 h-1 bg-gradient-to-r from-green-500 to-blue-500 mx-auto rounded-full"></div>
          </div>
          <div className="dark-card rounded-xl p-8 text-center group hover:scale-105 transition-all duration-300">
            <div className="stats-number text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-3">
              24/7
            </div>
            <div className="text-secondary mb-2">Support</div>
            <div className="w-12 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 mx-auto rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Main Feature Section */}
      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="text-center mb-16">
          <h2 className="section-title text-5xl text-primary mb-6">
            The world's most powerful
            <span className="block">Solana <span className="gradient-launcher">Launcher ever.</span></span>
          </h2>
        </div>

        {/* 4-Step Process */}
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto border border-purple-500/30">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                  1
                </div>
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">Connect Wallet</h3>
              <p className="text-secondary text-sm">Connect your Solana wallet to get started</p>
            </div>

            {/* Step 2 */}
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto border border-blue-500/30">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                  2
                </div>
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">Configure Token</h3>
              <p className="text-secondary text-sm">Set your token's details and parameters</p>
            </div>

            {/* Step 3 */}
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto border border-green-500/30">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                  3
                </div>
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">Pay Fee</h3>
              <p className="text-secondary text-sm">Pay the creation fee (0.2 SOL)</p>
            </div>

            {/* Step 4 */}
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto border border-orange-500/30">
                  <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                  4
                </div>
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">Done!</h3>
              <p className="text-secondary text-sm">Your token is ready to use</p>
            </div>
          </div>
        </div>
      </div>

      {/* App Ecosystem Section */}
      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="text-center mb-16">
          <h2 className="section-title text-5xl text-primary mb-6">
            Unlock the Full <span className="gradient-potential">Potential</span> of Your
            <span className="block">Solana Token Effortlessly</span>
          </h2>
        </div>

        <div className="relative max-w-6xl mx-auto">
          {/* Central Phone with Real Image */}
          <div className="flex justify-center relative z-10">
            <img
              src="/images/phone-mockup-hero.png"
              alt="Solana Token Launcher Mobile App Interface showing portfolio with various tokens"
              className="w-auto h-[450px] max-w-none drop-shadow-2xl"
            />
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feature Card */}
          <div className="lg:col-span-2 dark-card rounded-xl p-8">
            <h3 className="section-title text-3xl text-primary mb-4">Create & Deploy Your Token in Minutes</h3>
            <p className="text-secondary mb-6 leading-relaxed">
              Turn your idea into reality with lightning-fast token creation. Whether for projects, communities, or innovation, deploy your Solana token in minutes - with ease, secure, and built for the future!
            </p>
            <Link
              href="/create-token"
              className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
            >
              Create Token →
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="space-y-6">
            <div className="dark-card rounded-xl p-6 text-center">
              <div className="stats-number text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                99.9%
              </div>
              <div className="text-secondary">Successfully Deployed</div>
            </div>

            <div className="dark-card rounded-xl p-6 text-center">
              <div className="stats-number text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 mb-2">
                85%+
              </div>
              <div className="text-secondary">Completed in Under 5min</div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section - Accordion */}
      <div className="container mx-auto px-6 py-20 relative z-10">
        <h2 className="section-title text-4xl text-primary text-center mb-16">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {faqData.map((faq, index) => (
            <div key={index} className="dark-card rounded-lg overflow-hidden">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 text-left flex justify-between items-center hover:dark-card transition-all duration-200"
              >
                <h3 className="text-xl font-bold text-primary">{faq.question}</h3>
                <div className={`transform transition-transform duration-200 ${openFAQ === index ? 'rotate-180' : ''}`}>
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openFAQ === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                <div className="px-6 pb-5">
                  <div className="text-secondary leading-relaxed">
                    {index === 0 && (
                      <div>
                        A comprehensive platform for creating SPL tokens on Solana without coding.
                        <br /><br />
                        <div className="space-y-1">
                          <div>• Streamlined token creation process</div>
                          <div>• Advanced features like authority management</div>
                          <div>• Custom metadata and social links</div>
                          <div>• Professional-grade security</div>
                        </div>
                      </div>
                    )}
                    {index === 1 && (
                      <div>
                        Simple 4-step process:
                        <br /><br />
                        <div className="space-y-1">
                          <div>1. Connect your Solana wallet (Phantom, Solflare, etc.)</div>
                          <div>2. Fill in token details (name, symbol, supply, description)</div>
                          <div>3. Choose optional features (logo, creator info, social links)</div>
                          <div>4. Pay creation fee and deploy automatically</div>
                        </div>
                        <br />
                        <div className="text-purple-light font-medium">Total time: 2-5 minutes</div>
                      </div>
                    )}
                    {index === 2 && (
                      <div>
                        Solana tokens have 3 key authorities:
                        <br /><br />
                        <div className="space-y-1">
                          <div>• <strong className="text-primary">Mint Authority</strong> - Create more tokens</div>
                          <div>• <strong className="text-primary">Freeze Authority</strong> - Freeze token accounts</div>
                          <div>• <strong className="text-primary">Update Authority</strong> - Modify metadata</div>
                        </div>
                        <br />
                        Revoking them increases investor confidence by ensuring:
                        <div className="space-y-1 mt-2">
                          <div>✓ Fixed token supply</div>
                          <div>✓ No account freezing</div>
                          <div>✓ Immutable metadata</div>
                        </div>
                      </div>
                    )}
                    {index === 3 && (
                      <div>
                        <div className="text-primary font-semibold">Base Cost: 0.2 SOL</div>
                        <br />
                        <div className="text-primary font-semibold">Premium Features (+0.1 SOL each):</div>
                        <div className="space-y-1 mt-2">
                          <div>• Revoke Mint Authority</div>
                          <div>• Revoke Freeze Authority</div>
                          <div>• Revoke Update Authority</div>
                          <div>• Custom Creator Info</div>
                          <div>• Social Links & Tags</div>
                        </div>
                        <br />
                        <div className="text-purple-light font-semibold">Maximum: 0.7 SOL with all features</div>
                      </div>
                    )}
                    {index === 4 && (
                      <div>
                        <div className="text-primary font-bold text-lg mb-3">Not at all!</div>
                        Our platform is designed for everyone:
                        <div className="space-y-1 mt-2">
                          <div>• Simple form interface</div>
                          <div>• No coding required</div>
                          <div>• No blockchain expertise needed</div>
                          <div>• We handle all technical complexity</div>
                        </div>
                        <br />
                        <div className="text-purple-light font-medium">Just connect wallet → fill form → done!</div>
                      </div>
                    )}
                    {index === 5 && (
                      <div>
                        Multiple ways to verify:
                        <br /><br />
                        <div className="space-y-1">
                          <div>• Check your connected wallet (tokens appear automatically)</div>
                          <div>• Use the transaction signature we provide</div>
                          <div>• Search mint address on block explorers:</div>
                          <div className="ml-4 space-y-1">
                            <div>- Solscan.io</div>
                            <div>- SolanaFM.com</div>
                          </div>
                          <div>• View metadata and image on explorers</div>
                        </div>
                      </div>
                    )}
                    {index === 6 && (
                      <div>
                        <div className="text-primary font-bold text-lg mb-3">100% Secure:</div>
                        <div className="space-y-1">
                          <div>• We <strong className="text-primary">never</strong> store your private keys</div>
                          <div>• All transactions signed in your wallet</div>
                          <div>• You maintain complete control</div>
                          <div>• HTTPS encryption</div>
                          <div>• Industry-standard security practices</div>
                        </div>
                        <br />
                        <div className="text-purple-light font-medium italic">Your keys = Your crypto = Your control</div>
                      </div>
                    )}
                    {index === 7 && (
                      <div>
                        Comprehensive support available:
                        <br /><br />
                        <div className="space-y-1">
                          <div>• Detailed documentation & guides</div>
                          <div>• Step-by-step tutorials</div>
                          <div>• Technical support team</div>
                          <div>• Quick issue resolution</div>
                          <div>• Community resources</div>
                        </div>
                        <br />
                        <div className="text-green-400 font-medium">Most issues resolved within minutes!</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/40 py-8 border-t border-subtle">
        <div className="container mx-auto px-6 text-center">
          <p className="text-muted">
            © 2024 Solana Token Launcher. Built with ❤️ for the Solana ecosystem.
          </p>
        </div>
      </footer>
    </div>
  );
}
