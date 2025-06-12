# Web3.Storage Setup Guide

## Generated Credentials

Your Web3.Storage agent has been created with the following details:

- **Agent DID**: `did:key:z6MkpuFnAJYDdo3CkZNnNgkkFjByUsnD43j67meWL4SLC7UK`
- **Private Key (W3_KEY)**: `MgCZFy8vElo7RZMQt/3wtvaJ/YkueBvXQfC0bZtZhwnvj6u0Bmz2rY9ebArzOAf0annFCFmEePEI6HfAQZ3fklnQT0tA=`

## Required Steps to Complete Setup

### 1. Create .env.local file

Create a `.env.local` file in the `solana-token-launcher` directory with the following content:

```bash
# Web3.Storage Configuration
W3_KEY=MgCZFy8vElo7RZMQt/3wtvaJ/YkueBvXQfC0bZtZhwnvj6u0Bmz2rY9ebArzOAf0annFCFmEePEI6HfAQZ3fklnQT0tA=
W3_PROOF=YOUR_DELEGATION_PROOF_HERE
NEXT_PUBLIC_USE_REAL_IPFS=true
```

### 2. Generate Delegation Proof

Run the following commands in your terminal to create a delegation from your space to the agent:

```bash
# Login to w3cli with your email (the one associated with your Web3.Storage account)
w3 login your-email@example.com

# Select your space
w3 space use did:key:z6MkvPEze8ZWjZ7VMD7YFtwWgkfDLUrBGfsyGwfkHShJDfWW

# Create delegation for the agent (copy the output and paste it as W3_PROOF in .env.local)
w3 delegation create did:key:z6MkpuFnAJYDdo3CkZNnNgkkFjByUsnD43j67meWL4SLC7UK --base64
```

### 3. Update .env.local

Replace `YOUR_DELEGATION_PROOF_HERE` in your `.env.local` file with the base64 delegation proof from step 2.

### 4. Test the Setup

After completing the above steps, restart your development server and test token creation with an image upload.

## Troubleshooting

- Make sure you're logged into w3cli with the same email associated with your Web3.Storage space
- Ensure the space DID matches exactly: `did:key:z6MkvPEze8ZWjZ7VMD7YFtwWgkfDLUrBGfsyGwfkHShJDfWW`
- The delegation proof should be a long base64 string starting with characters like `eyJ...`

## Security Notes

- Keep your W3_KEY and W3_PROOF secure and never commit them to version control
- The .env.local file is already in .gitignore to prevent accidental commits 