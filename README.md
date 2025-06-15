# 🚀 Moonrush - Solana Token Creator

A professional web platform for creating SPL tokens on the Solana blockchain with no coding required. Built with Next.js, TypeScript, and advanced Web3 integrations.

## ✨ Key Features

- **🔗 Multi-Wallet Support**: Phantom, Solflare, and other Solana wallets
- **⚡ Quick Token Creation**: Create SPL tokens in under 5 minutes  
- **🎨 Custom Metadata**: Upload images and descriptions with IPFS storage
- **💎 Premium Options**: Authority revocation, custom creators, and more
- **💰 SOL-Based Pricing**: Transparent 0.1-0.5 SOL pricing structure
- **📊 Complete Logging**: SQLite database tracking all token creations
- **🔄 Dual IPFS Mode**: Test with placeholders or use real IPFS uploads

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, TailwindCSS
- **Blockchain**: Solana Web3.js, SPL Token, Wallet Adapter
- **Storage**: IPFS via NFT.Storage (optional), SQLite database
- **Styling**: TailwindCSS with beautiful gradient themes

## 🚀 Quick Start

### 1. Installation
```bash
git clone <repository-url>
cd moonrush-token-creator
npm install
```

### 2. Environment Setup
Create `.env.local` file:

```env
# IPFS Mode (set to 'false' for testing, 'true' for production)
NEXT_PUBLIC_USE_REAL_IPFS=false

# Your wallet address to receive service fees  
NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS=your_wallet_address_here

# NFT.Storage API key (only needed if NEXT_PUBLIC_USE_REAL_IPFS=true)
# Get from: https://nft.storage/
NFT_STORAGE_API_KEY=your_api_key_here

# Solana network
SOLANA_NETWORK=devnet
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## 💡 How to Use

### Creating Your First Token

1. **Connect Wallet** - Click "Connect Wallet" and select your preferred wallet
2. **Fill Token Details**:
   - Name & Symbol (e.g., "My Token", "MTK")  
   - Decimals (usually 9)
   - Initial Supply
   - Description & Image (optional)

3. **Choose Premium Options** (+0.1 SOL each):
   - ✅ **Revoke Mint Authority** - Fixed supply forever
   - ✅ **Revoke Freeze Authority** - Increased decentralization  
   - ✅ **Revoke Update Authority** - Immutable metadata
   - ✅ **Custom Creator** - Specify another address as creator

4. **Pay & Create** - Approve payment transaction, then token creation

### Pricing Structure
- **Base Token**: 0.1 SOL
- **Each Premium Feature**: +0.1 SOL  
- **Maximum Cost**: 0.5 SOL (all features)

## 🧪 Testing vs Production

### Testing Mode (Default)
```env
NEXT_PUBLIC_USE_REAL_IPFS=false
```
- ✅ Full token creation functionality
- ✅ All premium features work
- ✅ Service fee collection
- ✅ Database logging
- ❌ Placeholder metadata (not real IPFS)

### Production Mode  
```env
NEXT_PUBLIC_USE_REAL_IPFS=true
NFT_STORAGE_API_KEY=your_real_key
```
- ✅ Everything from testing mode
- ✅ Real image uploads to IPFS
- ✅ Proper token metadata for wallets
- ✅ Immutable, decentralized storage

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── upload/          # IPFS upload endpoint
│   │   └── log-token/       # Token logging endpoint  
│   ├── create-token/        # Token creation page
│   ├── layout.tsx           # Root layout with wallet providers
│   └── page.tsx             # Landing page
├── components/
│   ├── WalletContextProvider.tsx  # Wallet adapter setup
│   └── TokenCreationForm.tsx      # Main token creation form
└── lib/
    └── tokenMinting.ts      # Core token creation logic
```

## 🔧 API Endpoints

### GET/POST `/api/log-token`
- **GET**: Retrieve token creation logs
  - Query: `?wallet=address&limit=50&offset=0`
- **POST**: Log new token creation
  - Body: Token details, options, signatures

### POST `/api/upload` (Future)
- Upload images and metadata to IPFS
- Returns IPFS URIs for content

## 🧪 Testing Your Setup

### Test API Endpoints
```bash
node test-endpoints.js
```

### Test IPFS Modes  
```bash
node test-ipfs-modes.js
```

### Manual Testing Checklist
- [ ] Wallet connection works
- [ ] Form validation prevents invalid inputs
- [ ] Cost calculation updates correctly
- [ ] Custom Creator address validation works
- [ ] Database logging captures all data
- [ ] Service fees reach your platform wallet

## 🔐 Security Features

- **No Private Key Storage**: All signing happens in user's wallet
- **Input Validation**: Comprehensive form and API validation
- **Fallback System**: IPFS failures don't break token creation
- **Environment Isolation**: Clear separation between test/production

## 🌐 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel  
3. Set environment variables in dashboard
4. Deploy automatically

### Environment Variables for Production
```env
NEXT_PUBLIC_USE_REAL_IPFS=true
NFT_STORAGE_API_KEY=your_production_key
NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS=your_mainnet_wallet
SOLANA_NETWORK=mainnet-beta
```

## 💰 Economics

### Revenue Model
- **Service Fees**: 0.1-0.5 SOL per token (you keep 100%)
- **IPFS Costs**: $0-5/month (NFT.Storage free tier: 31GB)
- **Break-even**: ~1 token/month at current pricing

### Example Monthly Scenario
- **10 tokens created**: 1.0+ SOL revenue (~$20-100 depending on SOL price)
- **IPFS costs**: $0 (well within free tier)
- **Profit**: Nearly 100% after minimal hosting costs

## 🔍 Advanced Features

### Custom Creator Implementation
When enabled, the Custom Creator feature:
- Accepts any valid Solana address
- Embeds creator info in token metadata (Metaplex standard)
- Stores creator address in database for tracking
- Validates address format in real-time

### IPFS Dual-Mode System
- **Automatic Fallback**: Real uploads fail → placeholder mode
- **Development Friendly**: Test without NFT.Storage account
- **Production Ready**: Real IPFS when you need it
- **Cost Control**: Choose when to spend money on storage

## 🆘 Troubleshooting

### Common Issues
- **"Missing script: dev"**: Make sure you're in the `moonrush-token-creator` directory
- **Database errors**: Delete `tokens.db` to reset schema
- **IPFS upload fails**: Check API key or switch to placeholder mode
- **Wallet connection issues**: Refresh page and try again

### Getting Help
- Check console logs for detailed error messages
- Verify environment variables are set correctly  
- Ensure you're on the correct Solana network (devnet/mainnet)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - build amazing things! 🚀

---

**Ready to launch your first token?** Start with testing mode and work your way up to production! 🌟
