# 🔧 Developer Guide - Solana Token Launcher

This guide provides comprehensive technical information for developers working on the Solana Token Launcher.

## 📚 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Libraries & Their Purposes](#core-libraries--their-purposes)
3. [Wallet Integration System](#wallet-integration-system)
4. [Token Creation Process](#token-creation-process)
5. [IPFS Dual-Mode Implementation](#ipfs-dual-mode-implementation)
6. [Database Schema & API](#database-schema--api)
7. [Environment Configuration](#environment-configuration)
8. [Testing Guide](#testing-guide)
9. [Security Considerations](#security-considerations)

---

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Blockchain    │
│   (Next.js)     │    │   (Next.js)     │    │   (Solana)      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Wallet UI     │◄──►│ • IPFS Upload   │    │ • SPL Tokens    │
│ • Form Logic    │    │ • Token Logging │    │ • Transactions  │
│ • Transaction   │    │ • Database      │    │ • Authorities   │
│   Building      │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Key Design Principles:**
- **Client-side signing**: Private keys never leave user's wallet
- **Atomic transactions**: Payment + token creation in separate confirmed transactions
- **Fallback systems**: IPFS failures don't break token creation
- **Environment isolation**: Clear separation between test/production modes

---

## 📦 Core Libraries & Their Purposes

### Solana Web3 Stack

```typescript
// Core Solana functionality
import {
  Connection,      // RPC communication with Solana network
  PublicKey,       // Wallet/account addresses
  Transaction,     // Container for instructions
  SystemProgram,   // Built-in Solana operations
  LAMPORTS_PER_SOL // Conversion constant (1 SOL = 1e9 lamports)
} from '@solana/web3.js';

// SPL Token specific operations
import {
  createInitializeMintInstruction,    // Initialize new token mint
  createAssociatedTokenAccountInstruction, // Create user token account
  createMintToInstruction,           // Mint tokens to account
  createSetAuthorityInstruction,     // Revoke authorities
  getAssociatedTokenAddress,         // Derive token account address
  TOKEN_PROGRAM_ID,                  // SPL Token program ID
  AuthorityType                      // Types of authorities to revoke
} from '@solana/spl-token';
```

### Wallet Adapter System

```typescript
// React integration for wallet management
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';

// Usage in components:
const { publicKey, signTransaction, connected } = useWallet();
const { connection } = useConnection();
```

---

## 🔗 Wallet Integration System

### WalletContextProvider Setup

```typescript
// In src/components/WalletContextProvider.tsx
export function WalletContextProvider({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet; // or Mainnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
```

**How Wallet Connection Works:**
1. **Auto-detection**: Checks for installed wallets (Phantom, Solflare)
2. **Connection state**: Manages connected/disconnected state globally
3. **Auto-reconnect**: Attempts to reconnect to previously used wallet
4. **Transaction signing**: Provides `signTransaction` function without exposing private keys

---

## 🪙 Token Creation Process

### Step-by-Step Breakdown

#### 1. Payment Processing
```typescript
async function processPayment(connection, payer, signTransaction, totalCost) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer,           // User's wallet
      toPubkey: PLATFORM_WALLET,   // Your service wallet
      lamports: totalCost * LAMPORTS_PER_SOL
    })
  );
  
  // Set metadata and get user signature
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = payer;
  
  const signedTransaction = await signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signedTransaction.serialize());
  await connection.confirmTransaction(signature);
  
  return signature;
}
```

#### 2. Token Mint Creation
```typescript
// Generate new keypair for token mint
const mintKeypair = Keypair.generate();

// Create transaction with multiple instructions
const transaction = new Transaction();

// 1. Create mint account
transaction.add(SystemProgram.createAccount({
  fromPubkey: payer,
  newAccountPubkey: mintKeypair.publicKey,
  space: getMintLen([]),
  lamports: await connection.getMinimumBalanceForRentExemption(getMintLen([])),
  programId: TOKEN_PROGRAM_ID,
}));

// 2. Initialize mint with authorities
transaction.add(createInitializeMintInstruction(
  mintKeypair.publicKey,
  formData.decimals,
  payer, // mint authority
  payer  // freeze authority
));

// 3. Create associated token account for user
transaction.add(createAssociatedTokenAccountInstruction(
  payer,
  associatedTokenAddress,
  payer,
  mintKeypair.publicKey
));

// 4. Mint initial supply to user
transaction.add(createMintToInstruction(
  mintKeypair.publicKey,
  associatedTokenAddress,
  payer,
  formData.supply * Math.pow(10, formData.decimals)
));
```

#### 3. Authority Revocation (Premium Features)
```typescript
// Revoke mint authority (prevents creating more tokens)
if (formData.revokeMintAuth) {
  transaction.add(createSetAuthorityInstruction(
    mintKeypair.publicKey,
    payer,
    AuthorityType.MintTokens,
    null // null = revoke permanently
  ));
}

// Revoke freeze authority (prevents freezing accounts)
if (formData.revokeFreezeAuth) {
  transaction.add(createSetAuthorityInstruction(
    mintKeypair.publicKey,
    payer,
    AuthorityType.FreezeAccount,
    null
  ));
}
```

---

## 🌐 IPFS Dual-Mode Implementation

### Environment-Controlled Upload Strategy

```typescript
async function uploadMetadataToIPFS(formData: TokenFormData): Promise<string> {
  const useRealIPFS = process.env.NEXT_PUBLIC_USE_REAL_IPFS === 'true';
  const nftStorageApiKey = process.env.NFT_STORAGE_API_KEY;

  if (useRealIPFS && nftStorageApiKey) {
    console.log('🌐 Using real IPFS uploads via NFT.Storage');
    return await uploadToRealIPFS(formData, nftStorageApiKey);
  } else {
    console.log('📝 Using placeholder IPFS URIs for testing');
    return await uploadToPlaceholderIPFS(formData);
  }
}
```

### Real IPFS Upload Implementation

```typescript
async function uploadToRealIPFS(formData: TokenFormData, apiKey: string): Promise<string> {
  const { NFTStorage, File } = await import('nft.storage');
  const client = new NFTStorage({ token: apiKey });

  // 1. Upload image if provided
  let imageUri = '';
  if (formData.image) {
    const imageBuffer = await formData.image.arrayBuffer();
    const imageFile = new File([imageBuffer], formData.image.name, {
      type: formData.image.type,
    });
    const imageCid = await client.storeBlob(imageFile);
    imageUri = `ipfs://${imageCid}`;
  }

  // 2. Create metadata with Metaplex standard
  const metadata = {
    name: formData.name,
    symbol: formData.symbol,
    description: formData.description,
    image: imageUri,
    attributes: [],
    properties: {
      files: imageUri ? [{
        uri: imageUri,
        type: formData.image?.type || 'image/png',
      }] : [],
      category: 'image',
      creators: formData.customCreator ? [{
        address: formData.creatorAddress,
        verified: false,
        share: 100
      }] : undefined,
    }
  };

  // 3. Upload metadata
  const metadataFile = new File(
    [JSON.stringify(metadata, null, 2)],
    'metadata.json',
    { type: 'application/json' }
  );
  const metadataCid = await client.storeBlob(metadataFile);
  return `ipfs://${metadataCid}`;
}
```

### Placeholder Mode (For Testing)

```typescript
async function uploadToPlaceholderIPFS(formData: TokenFormData): Promise<string> {
  const metadata = {
    name: formData.name,
    symbol: formData.symbol,
    description: formData.description,
    image: formData.image ? 'ipfs://placeholder-image-hash' : '',
    // ... same structure as real metadata
  };
  
  console.log('📋 Generated placeholder metadata:', metadata);
  return 'ipfs://placeholder-metadata-hash';
}
```

---

## 📊 Database Schema & API

### SQLite Schema

```sql
CREATE TABLE token_creations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,
  token_mint TEXT NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  supply INTEGER NOT NULL,
  decimals INTEGER NOT NULL,
  description TEXT,
  metadata_uri TEXT,
  signature TEXT,
  revoke_mint_auth BOOLEAN DEFAULT FALSE,
  revoke_freeze_auth BOOLEAN DEFAULT FALSE,
  revoke_update_auth BOOLEAN DEFAULT FALSE,
  custom_creator BOOLEAN DEFAULT FALSE,
  creator_address TEXT,
  timestamp TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints

#### GET/POST `/api/log-token`

```typescript
// GET: Retrieve token creations
// Query parameters: wallet, limit, offset
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  const query = wallet 
    ? 'SELECT * FROM token_creations WHERE wallet_address = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    : 'SELECT * FROM token_creations ORDER BY created_at DESC LIMIT ? OFFSET ?';
    
  const params = wallet ? [wallet, limit, offset] : [limit, offset];
  const tokens = await db.all(query, params);
  
  return NextResponse.json({ tokens });
}

// POST: Log new token creation
export async function POST(request: NextRequest) {
  const data = await request.json();
  
  await db.run(`
    INSERT INTO token_creations (
      wallet_address, token_mint, name, symbol, supply, decimals,
      description, metadata_uri, signature, revoke_mint_auth, 
      revoke_freeze_auth, revoke_update_auth, custom_creator,
      creator_address, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    data.walletAddress, data.tokenMint, data.name, data.symbol,
    data.supply, data.decimals, data.description, data.metadataUri,
    data.signature, data.options.revokeMintAuth, data.options.revokeFreezeAuth,
    data.options.revokeUpdateAuth, data.options.customCreator,
    data.creatorAddress, data.timestamp
  ]);
  
  return NextResponse.json({ success: true });
}
```

---

## ⚙️ Environment Configuration

### Development vs Production Setup

#### Testing Mode (Default)
```env
# .env.local for DEVELOPMENT
NEXT_PUBLIC_USE_REAL_IPFS=false
NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS=your_devnet_wallet
SOLANA_NETWORK=devnet

# NFT.Storage not needed in testing mode
```

**Benefits:**
- ✅ Zero IPFS costs
- ✅ All features work
- ✅ Fast testing cycles
- ✅ No external dependencies

#### Production Mode
```env
# .env.local for PRODUCTION  
NEXT_PUBLIC_USE_REAL_IPFS=true
NFT_STORAGE_API_KEY=your_nft_storage_key
NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS=your_mainnet_wallet
SOLANA_NETWORK=mainnet-beta
```

**Benefits:**
- ✅ Real IPFS storage
- ✅ Wallet-compatible metadata
- ✅ Immutable content
- ✅ Professional appearance

### Getting NFT.Storage API Key

1. Visit [nft.storage](https://nft.storage/)
2. Create account with email verification
3. Navigate to API Keys section
4. Generate new API key
5. Add to `.env.local` file

**NFT.Storage Costs:**
- **Free tier**: 31GB storage + 200GB bandwidth/month
- **Paid tiers**: $5+/month for additional storage
- **Break-even**: ~1-2 tokens/month at current pricing

---

## 🧪 Testing Guide

### Automated Testing Scripts

#### Test API Endpoints
```bash
node test-endpoints.js
```

This script tests:
- Database connection
- Token logging functionality
- Data retrieval with filtering
- Error handling

#### Test IPFS Modes
```bash
node test-ipfs-modes.js
```

This script demonstrates:
- Placeholder metadata generation
- Real IPFS upload simulation  
- Fallback behavior examples

### Manual Testing Checklist

#### Basic Functionality
- [ ] Wallet connection works (Phantom/Solflare)
- [ ] Form validation prevents invalid inputs
- [ ] Cost calculation updates in real-time
- [ ] All premium options affect pricing correctly

#### Custom Creator Feature
- [ ] Address input appears when checkbox selected
- [ ] Real-time validation for Solana addresses
- [ ] Form blocks submission with invalid addresses
- [ ] Creator info appears in generated metadata
- [ ] Database stores creator address correctly

#### IPFS Mode Testing
- [ ] Placeholder mode works without API key
- [ ] Real mode works with valid API key
- [ ] Fallback triggers on API errors
- [ ] Console logs show current mode

#### Database & API Testing
- [ ] Token creations logged to database
- [ ] API endpoints return correct data
- [ ] Filtering by wallet address works
- [ ] All premium options stored correctly

### Testing Environment Setup

```bash
# 1. Start development server
npm run dev

# 2. Test API endpoints
curl http://localhost:3000/api/log-token

# 3. Test specific wallet
curl "http://localhost:3000/api/log-token?wallet=TEST_WALLET_ADDRESS"

# 4. Check database directly (if needed)
sqlite3 tokens.db "SELECT * FROM token_creations LIMIT 5;"
```

### Common Issues & Solutions

#### Database Errors
```
Error: SQLITE_ERROR: no such column: creator_address
```
**Solution**: Delete `tokens.db` file to recreate with new schema

#### IPFS Upload Failures
```
Error: 401 Unauthorized
```
**Solution**: Check NFT.Storage API key or switch to placeholder mode

#### Wallet Connection Issues
**Solution**: Refresh page, check wallet is installed and unlocked

---

## 🔒 Security Considerations

### Private Key Security
```typescript
// ✅ SECURE: Private keys never leave wallet
const signedTransaction = await signTransaction(transaction);

// ❌ NEVER DO THIS: Store or transmit private keys
// const privateKey = "..."; // DANGEROUS!
```

### Input Validation

```typescript
// Validate all form inputs
const isValidSolanaAddress = (address: string): boolean => {
  if (address.length < 32 || address.length > 44) return false;
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  return base58Regex.test(address);
};

// Sanitize database inputs
const sanitizedName = name.trim().substring(0, 100);
const sanitizedSymbol = symbol.trim().toUpperCase().substring(0, 10);
```

### Transaction Security
- **Recent blockhash**: Prevents replay attacks
- **Fee payer specification**: Ensures correct wallet pays
- **Confirmation waiting**: Verifies transaction success
- **Atomic operations**: Either all instructions succeed or all fail

### Environment Variable Security
- **Client-side variables**: Use `NEXT_PUBLIC_` prefix
- **Server-side secrets**: Keep API keys server-only
- **Production isolation**: Separate dev/prod configurations

---

## 🎯 Development Best Practices

### Code Organization
- **Separation of concerns**: UI, business logic, and blockchain operations in separate files
- **Type safety**: TypeScript interfaces for all data structures
- **Error handling**: Comprehensive try-catch blocks with user-friendly messages
- **Logging**: Console outputs for debugging and monitoring

### Testing Strategy
- **Start with placeholders**: Test core functionality without external dependencies
- **Progressive enhancement**: Add real IPFS when basic features work
- **Environment parity**: Keep dev/prod environments consistent
- **Database versioning**: Handle schema changes gracefully

### Performance Considerations
- **Transaction batching**: Combine multiple instructions into single transaction
- **Connection reuse**: Single connection instance across components
- **Image optimization**: Validate file sizes before upload
- **Database indexing**: Add indexes for frequently queried fields

---

## 🚀 Advanced Development Topics

### Custom Creator Implementation Details

The Custom Creator feature follows Metaplex standards:

```typescript
// Metadata structure with creator attribution
const creators = [{
  address: formData.creatorAddress,
  verified: false, // Cannot verify programmatically
  share: 100       // 100% attribution to custom creator
}];

// Embedded in metadata at multiple levels
const metadata = {
  // ... other fields
  creators,  // Root level (Metaplex standard)
  properties: {
    creators // Also in properties (compatibility)
  }
};
```

### IPFS Cost Optimization

```typescript
// Only upload image if provided (save bandwidth)
if (formData.image) {
  const imageCid = await client.storeBlob(imageFile);
  imageUri = `ipfs://${imageCid}`;
}

// Compress metadata JSON efficiently
const metadataFile = new File(
  [JSON.stringify(metadata, null, 2)], // Pretty print for debugging
  'metadata.json',
  { type: 'application/json' }
);
```

### Service Fee Collection Strategy

```typescript
// Direct SOL transfer (no escrow, immediate availability)
const paymentTransaction = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: payer,
    toPubkey: PLATFORM_WALLET,
    lamports: totalCost * LAMPORTS_PER_SOL,
  })
);

// Separate transaction ensures payment before token creation
await processPayment(/* ... */);
await createTokenMint(/* ... */);
```

---

**Ready to dive deeper?** This guide covers everything you need to understand, modify, and extend the Solana Token Launcher. Happy coding! 🚀 