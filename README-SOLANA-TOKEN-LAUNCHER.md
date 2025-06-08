# 🚀 Solana Token Launcher

A professional web platform for creating SPL tokens on the Solana blockchain with no coding required. Built with Next.js, TypeScript, and the Solana Web3.js SDK.

## ✨ Features

- **🔗 Wallet Integration**: Connect with Phantom, Solflare, and other popular Solana wallets
- **⚡ Fast Token Creation**: Create SPL tokens in under 5 minutes
- **🎨 Custom Metadata**: Upload token images and descriptions
- **🔒 Authority Management**: Optional authority revocation for enhanced security
- **💾 IPFS Storage**: Decentralized metadata storage via NFT.Storage
- **📊 Token Logging**: Track all token creations in SQLite database
- **💰 SOL-based Pricing**: Transparent pricing in SOL

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 + TypeScript + TailwindCSS
- **Blockchain**: Solana Web3.js + SPL Token
- **Wallets**: Solana Wallet Adapter
- **Storage**: IPFS via NFT.Storage
- **Database**: SQLite
- **Styling**: TailwindCSS with gradient themes

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Solana wallet (Phantom, Solflare, etc.)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd solana-token-launcher
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add:
   ```
   NFT_STORAGE_API_KEY=your_nft_storage_api_key_here
   PLATFORM_WALLET_ADDRESS=your_platform_wallet_address_here
   SOLANA_NETWORK=devnet
   ```

4. **Get NFT.Storage API Key**
   - Visit [nft.storage](https://nft.storage/)
   - Create an account and generate an API key
   - Add it to your `.env.local` file

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 💡 Usage

### Creating a Token

1. **Connect Wallet**: Click "Connect Wallet" and select your preferred wallet
2. **Fill Token Details**:
   - Token Name (e.g., "My Awesome Token")
   - Symbol (3-5 characters, e.g., "MAT")
   - Decimals (usually 9)
   - Initial Supply
   - Description (optional)
   - Upload token image (1000x1000 recommended)

3. **Choose Premium Options** (optional):
   - Revoke Mint Authority (+0.1 SOL)
   - Revoke Freeze Authority (+0.1 SOL)
   - Revoke Update Authority (+0.1 SOL)
   - Custom Creator (+0.1 SOL)

4. **Review & Pay**: Check the total cost and click "Create Token"
5. **Confirm Transactions**: Approve the payment and token creation in your wallet

### Pricing

- **Base Token Creation**: 0.1 SOL
- **Each Premium Feature**: +0.1 SOL
- **Maximum Cost**: 0.5 SOL (with all premium features)

## 🏗️ Project Structure

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

### POST /api/upload
Upload images and metadata to IPFS
- **Body**: FormData with image and metadata
- **Returns**: IPFS URIs for image and metadata

### POST /api/log-token
Log token creation to database
- **Body**: Token creation details
- **Returns**: Success confirmation

### GET /api/log-token
Retrieve token creation logs
- **Query**: `wallet` (optional), `limit`, `offset`
- **Returns**: Array of token creation records

## 🔐 Security Features

- **No Private Key Storage**: All signing happens in user's wallet
- **Input Validation**: Comprehensive form validation
- **HTTPS Required**: Secure communication
- **Rate Limiting**: API endpoint protection
- **CORS Restrictions**: Cross-origin request protection

## 🌐 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
2. **Connect to Vercel**
3. **Set Environment Variables** in Vercel dashboard
4. **Deploy**

### Manual Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## 🧪 Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npm run type-check
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NFT_STORAGE_API_KEY` | API key for NFT.Storage IPFS uploads | Yes |
| `PLATFORM_WALLET_ADDRESS` | Wallet address for receiving payments | Yes |
| `SOLANA_NETWORK` | Solana network (devnet/mainnet-beta) | No (defaults to devnet) |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Documentation**: Check this README
- **Issues**: Create a GitHub issue
- **Discord**: Join our community server

## 🔮 Roadmap

- [ ] Liquidity Pool Creation (Raydium integration)
- [ ] Token Explorer Page
- [ ] Email Notifications
- [ ] Referral System
- [ ] Multi-language Support
- [ ] Mobile App

---

Built with ❤️ for the Solana ecosystem
