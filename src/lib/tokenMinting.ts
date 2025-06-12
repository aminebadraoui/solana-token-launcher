import {
    Connection,
    PublicKey,
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL,
    Keypair,
} from '@solana/web3.js';
import {
    createInitializeMintInstruction,
    createAssociatedTokenAccountInstruction,
    createMintToInstruction,
    createSetAuthorityInstruction,
    getAssociatedTokenAddress,
    getMintLen,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    AuthorityType,
} from '@solana/spl-token';
import { NFTStorage } from 'nft.storage';

interface TokenFormData {
    name: string;
    symbol: string;
    decimals: number;
    supply: number;
    description: string;
    image: File | null;
    revokeMintAuth: boolean;
    revokeFreezeAuth: boolean;
    revokeUpdateAuth: boolean;
    customCreator: boolean;
    creatorAddress: string;
}

interface CreateTokenParams {
    connection: Connection;
    payer: PublicKey;
    signTransaction: (transaction: Transaction) => Promise<Transaction>;
    formData: TokenFormData;
    totalCost: number;
}

// Platform wallet address (replace with your actual platform wallet)
const PLATFORM_WALLET = new PublicKey(
    process.env.NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS || '11111111111111111111111111111112'
);

export async function createTokenMint({
    connection,
    payer,
    signTransaction,
    formData,
    totalCost,
}: CreateTokenParams) {
    let paymentSignature: string | null = null;

    try {
        // Debug logging at start
        console.log('🔧 Token Minting Process Started');
        console.log('💰 Total cost to charge:', totalCost, 'SOL');
        console.log('🌐 RPC Endpoint:', connection.rpcEndpoint);
        console.log('📊 Token Details:', {
            name: formData.name,
            symbol: formData.symbol,
            supply: formData.supply,
            decimals: formData.decimals,
            hasImage: !!formData.image
        });

        // Step 1: Upload metadata to IPFS FIRST (before any payment)
        console.log('📤 Step 1: Uploading metadata to IPFS...');
        const startTime = Date.now();
        const metadataUri = await uploadMetadataToIPFS(formData);
        const uploadTime = Date.now() - startTime;
        console.log(`✅ Metadata uploaded successfully in ${uploadTime}ms`);
        console.log('🔗 Metadata URI:', metadataUri);

        // Step 2: Create mint keypair
        console.log('🔑 Step 2: Generating mint keypair...');
        const mintKeypair = Keypair.generate();
        const mintAddress = mintKeypair.publicKey;
        console.log('📍 Mint Address:', mintAddress.toString());

        // Step 3: Get associated token account address
        console.log('🏦 Step 3: Calculating associated token account...');
        const associatedTokenAddress = await getAssociatedTokenAddress(
            mintAddress,
            payer
        );
        console.log('📍 Token Account:', associatedTokenAddress.toString());

        // Check account balances before transaction
        const balance = await connection.getBalance(payer);
        console.log('💳 Wallet Balance:', balance / LAMPORTS_PER_SOL, 'SOL');

        // Step 4: Create all token creation instructions
        console.log('📋 Step 4: Preparing token creation transaction...');
        const lamports = await connection.getMinimumBalanceForRentExemption(getMintLen([]));
        console.log('💰 Rent exemption required:', lamports / LAMPORTS_PER_SOL, 'SOL');

        const tokenTransaction = new Transaction();

        // Create mint account
        tokenTransaction.add(
            SystemProgram.createAccount({
                fromPubkey: payer,
                newAccountPubkey: mintAddress,
                space: getMintLen([]),
                lamports,
                programId: TOKEN_PROGRAM_ID,
            })
        );

        // Initialize mint
        tokenTransaction.add(
            createInitializeMintInstruction(
                mintAddress,
                formData.decimals,
                payer, // mint authority
                payer  // freeze authority
            )
        );

        // Create associated token account
        tokenTransaction.add(
            createAssociatedTokenAccountInstruction(
                payer, // payer
                associatedTokenAddress, // associated token account
                payer, // owner
                mintAddress // mint
            )
        );

        // Mint tokens
        tokenTransaction.add(
            createMintToInstruction(
                mintAddress,
                associatedTokenAddress,
                payer, // mint authority
                formData.supply * Math.pow(10, formData.decimals)
            )
        );

        // Add authority revocation instructions if requested
        if (formData.revokeMintAuth) {
            tokenTransaction.add(
                createSetAuthorityInstruction(
                    mintAddress,
                    payer, // current authority
                    AuthorityType.MintTokens,
                    null // new authority (null = revoke)
                )
            );
        }

        if (formData.revokeFreezeAuth) {
            tokenTransaction.add(
                createSetAuthorityInstruction(
                    mintAddress,
                    payer, // current authority
                    AuthorityType.FreezeAccount,
                    null // new authority (null = revoke)
                )
            );
        }

        // Step 5: Add payment instruction to the SAME transaction (ATOMIC)
        console.log(`💳 Step 5: Adding payment instruction to token transaction (${totalCost} SOL)...`);
        console.log('🔒 Using ATOMIC transaction - payment and token creation together!');

        // Add payment instruction to the existing token transaction
        tokenTransaction.add(
            SystemProgram.transfer({
                fromPubkey: payer,
                toPubkey: PLATFORM_WALLET,
                lamports: totalCost * LAMPORTS_PER_SOL,
            })
        );

        // Step 6: Execute COMBINED transaction (payment + token creation)
        console.log('🚀 Step 6: Executing atomic transaction (payment + token creation)...');
        const { blockhash } = await connection.getLatestBlockhash();
        console.log('🔗 Latest Blockhash:', blockhash);

        tokenTransaction.recentBlockhash = blockhash;
        tokenTransaction.feePayer = payer;

        // Partially sign with mint keypair
        console.log('✍️ Signing transaction with mint keypair...');
        tokenTransaction.partialSign(mintKeypair);

        // Sign with wallet (SINGLE SIGNATURE for everything)
        console.log('✍️ Requesting wallet signature for ATOMIC transaction...');
        console.log('ℹ️ This single signature will handle payment AND token creation safely!');
        const signedTokenTransaction = await signTransaction(tokenTransaction);
        console.log('✅ Atomic transaction signed by wallet');

        // Send transaction
        console.log('📡 Sending atomic transaction to blockchain...');
        const txStartTime = Date.now();
        const atomicSignature = await connection.sendRawTransaction(signedTokenTransaction.serialize());
        console.log('📨 Atomic transaction sent, signature:', atomicSignature);

        console.log('⏳ Waiting for confirmation...');
        await connection.confirmTransaction(atomicSignature);
        const txTime = Date.now() - txStartTime;
        console.log(`✅ Atomic transaction confirmed successfully in ${txTime}ms`);
        console.log('🎉 Payment and token creation completed safely together!');

        // Set both signatures to the same atomic transaction
        paymentSignature = atomicSignature;
        const tokenSignature = atomicSignature;

        // Step 7: Log token creation
        await logTokenCreation({
            walletAddress: payer.toString(),
            tokenMint: mintAddress.toString(),
            formData,
            metadataUri,
            signature: tokenSignature,
        });

        return {
            mintAddress: mintAddress.toString(),
            tokenAccount: associatedTokenAddress.toString(),
            metadataUri,
            signature: tokenSignature,
            paymentSignature,
        };
    } catch (error) {
        console.error('❌ CRITICAL ERROR in createTokenMint');
        console.error('🔍 Error Details:', {
            error: error,
            message: error instanceof Error ? error.message : 'Unknown error',
            name: error instanceof Error ? error.name : 'Unknown',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
            rpcEndpoint: connection.rpcEndpoint,
            walletAddress: payer.toString(),
            totalCost: totalCost,
            paymentProcessed: !!paymentSignature
        });

        // Check wallet balance after error
        try {
            const balanceAfterError = await connection.getBalance(payer);
            console.error('💳 Wallet balance after error:', balanceAfterError / LAMPORTS_PER_SOL, 'SOL');
        } catch (balanceError) {
            console.error('❌ Could not check wallet balance after error:', balanceError);
        }

        // With atomic transactions, payment and token creation succeed or fail together
        if (paymentSignature) {
            console.error('⚠️ This should not happen - atomic transaction had partial success!');
            console.error('🧾 Atomic transaction signature:', paymentSignature);
            console.error('💰 Amount that might have been charged:', totalCost, 'SOL');
        } else {
            console.log('✅ No charges applied - atomic transaction failed safely');
        }

        // Enhanced error handling with specific error types
        const enhancedError = new Error(error instanceof Error ? error.message : 'Unknown error');
        (enhancedError as any).originalError = error;
        (enhancedError as any).step = paymentSignature ? 'atomic_transaction_partial' : 'atomic_transaction_failed';
        (enhancedError as any).paymentProcessed = !!paymentSignature;
        (enhancedError as any).debugInfo = {
            rpcEndpoint: connection.rpcEndpoint,
            walletAddress: payer.toString(),
            totalCost: totalCost,
            timestamp: new Date().toISOString()
        };

        throw enhancedError;
    }
}

async function processPayment(
    connection: Connection,
    payer: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>,
    totalCost: number
) {
    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: payer,
            toPubkey: PLATFORM_WALLET,
            lamports: totalCost * LAMPORTS_PER_SOL,
        })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payer;

    const signedTransaction = await signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    await connection.confirmTransaction(signature);

    return signature;
}

async function uploadMetadataToIPFS(formData: TokenFormData): Promise<string> {
    try {
        // Check if we should use real IPFS uploads or placeholders
        const useRealIPFS = process.env.NEXT_PUBLIC_USE_REAL_IPFS === 'true';
        const nftStorageApiKey = process.env.NFT_STORAGE_API_KEY;

        if (useRealIPFS && nftStorageApiKey) {
            console.log('🌐 Using real IPFS uploads via NFT.Storage');
            return await uploadToRealIPFS(formData, nftStorageApiKey);
        } else {
            console.log('📝 Using placeholder IPFS URIs for testing');
            return await uploadToPlaceholderIPFS(formData);
        }
    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        // Fallback to placeholder if real upload fails
        console.log('⚠️  Falling back to placeholder IPFS URIs');
        return await uploadToPlaceholderIPFS(formData);
    }
}

async function uploadToRealIPFS(formData: TokenFormData, apiKey: string): Promise<string> {
    const { NFTStorage, File } = await import('nft.storage');
    const client = new NFTStorage({ token: apiKey });

    // Prepare creators array based on custom creator option
    const creators = [];
    if (formData.customCreator && formData.creatorAddress) {
        creators.push({
            address: formData.creatorAddress,
            verified: false, // Cannot verify programmatically
            share: 100 // 100% attribution to the custom creator
        });
    }

    let imageUri = '';

    // 1. Upload image to IPFS if provided
    if (formData.image) {
        console.log('📸 Uploading image to IPFS...');
        try {
            // Convert File to format expected by NFT.Storage
            const imageBuffer = await formData.image.arrayBuffer();
            const imageFile = new File([imageBuffer], formData.image.name, {
                type: formData.image.type,
            });

            const imageCid = await client.storeBlob(imageFile);
            imageUri = `ipfs://${imageCid}`;
            console.log('✅ Image uploaded successfully:', imageUri);
        } catch (error) {
            console.error('❌ Failed to upload image:', error);
            throw new Error('Failed to upload image to IPFS');
        }
    }

    // 2. Create complete metadata object
    const metadata = {
        name: formData.name,
        symbol: formData.symbol,
        description: formData.description,
        image: imageUri,
        attributes: [],
        properties: {
            files: imageUri ? [
                {
                    uri: imageUri,
                    type: formData.image?.type || 'image/png',
                }
            ] : [],
            category: 'image',
            creators: creators.length > 0 ? creators : undefined,
        },
        // Include creators at root level as well (Metaplex standard)
        ...(creators.length > 0 && { creators }),
    };

    // 3. Upload metadata to IPFS
    console.log('📄 Uploading metadata to IPFS...');
    try {
        const metadataFile = new File(
            [JSON.stringify(metadata, null, 2)],
            'metadata.json',
            { type: 'application/json' }
        );

        const metadataCid = await client.storeBlob(metadataFile);
        const metadataUri = `ipfs://${metadataCid}`;

        console.log('✅ Metadata uploaded successfully:', metadataUri);
        console.log('📋 Metadata content:', metadata);

        return metadataUri;
    } catch (error) {
        console.error('❌ Failed to upload metadata:', error);
        throw new Error('Failed to upload metadata to IPFS');
    }
}

async function uploadToPlaceholderIPFS(formData: TokenFormData): Promise<string> {
    // Prepare creators array based on custom creator option
    const creators = [];
    if (formData.customCreator && formData.creatorAddress) {
        creators.push({
            address: formData.creatorAddress,
            verified: false, // Cannot verify programmatically
            share: 100 // 100% attribution to the custom creator
        });
    }

    // Create metadata object with placeholder URIs
    const metadata = {
        name: formData.name,
        symbol: formData.symbol,
        description: formData.description,
        image: formData.image ? 'ipfs://placeholder-image-hash' : '',
        attributes: [],
        properties: {
            files: formData.image ? [
                {
                    uri: 'ipfs://placeholder-image-hash',
                    type: formData.image.type,
                }
            ] : [],
            category: 'image',
            creators: creators.length > 0 ? creators : undefined,
        },
        // Include creators at root level as well (Metaplex standard)
        ...(creators.length > 0 && { creators }),
    };

    console.log('📋 Generated placeholder metadata:', metadata);

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return placeholder metadata URI
    return 'ipfs://placeholder-metadata-hash';
}

async function logTokenCreation(data: {
    walletAddress: string;
    tokenMint: string;
    formData: TokenFormData;
    metadataUri: string;
    signature: string;
}) {
    try {
        const response = await fetch('/api/log-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                walletAddress: data.walletAddress,
                tokenMint: data.tokenMint,
                name: data.formData.name,
                symbol: data.formData.symbol,
                supply: data.formData.supply,
                decimals: data.formData.decimals,
                description: data.formData.description,
                metadataUri: data.metadataUri,
                signature: data.signature,
                options: {
                    revokeMintAuth: data.formData.revokeMintAuth,
                    revokeFreezeAuth: data.formData.revokeFreezeAuth,
                    revokeUpdateAuth: data.formData.revokeUpdateAuth,
                    customCreator: data.formData.customCreator,
                },
                creatorAddress: data.formData.customCreator ? data.formData.creatorAddress : null,
                timestamp: new Date().toISOString(),
            }),
        });

        if (!response.ok) {
            console.error('Failed to log token creation');
        }
    } catch (error) {
        console.error('Error logging token creation:', error);
    }
} 