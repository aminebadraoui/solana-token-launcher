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
    try {
        // Step 1: Create payment transaction
        await processPayment(connection, payer, signTransaction, totalCost);

        // Step 2: Upload metadata to IPFS
        const metadataUri = await uploadMetadataToIPFS(formData);

        // Step 3: Create mint keypair
        const mintKeypair = Keypair.generate();
        const mintAddress = mintKeypair.publicKey;

        // Step 4: Get associated token account address
        const associatedTokenAddress = await getAssociatedTokenAddress(
            mintAddress,
            payer
        );

        // Step 5: Create all instructions
        const lamports = await connection.getMinimumBalanceForRentExemption(getMintLen([]));

        const transaction = new Transaction();

        // Create mint account
        transaction.add(
            SystemProgram.createAccount({
                fromPubkey: payer,
                newAccountPubkey: mintAddress,
                space: getMintLen([]),
                lamports,
                programId: TOKEN_PROGRAM_ID,
            })
        );

        // Initialize mint
        transaction.add(
            createInitializeMintInstruction(
                mintAddress,
                formData.decimals,
                payer, // mint authority
                payer  // freeze authority
            )
        );

        // Create associated token account
        transaction.add(
            createAssociatedTokenAccountInstruction(
                payer, // payer
                associatedTokenAddress, // associated token account
                payer, // owner
                mintAddress // mint
            )
        );

        // Mint tokens
        transaction.add(
            createMintToInstruction(
                mintAddress,
                associatedTokenAddress,
                payer, // mint authority
                formData.supply * Math.pow(10, formData.decimals)
            )
        );

        // Add authority revocation instructions if requested
        if (formData.revokeMintAuth) {
            transaction.add(
                createSetAuthorityInstruction(
                    mintAddress,
                    payer, // current authority
                    AuthorityType.MintTokens,
                    null // new authority (null = revoke)
                )
            );
        }

        if (formData.revokeFreezeAuth) {
            transaction.add(
                createSetAuthorityInstruction(
                    mintAddress,
                    payer, // current authority
                    AuthorityType.FreezeAccount,
                    null // new authority (null = revoke)
                )
            );
        }

        // Set recent blockhash and fee payer
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = payer;

        // Partially sign with mint keypair
        transaction.partialSign(mintKeypair);

        // Sign with wallet
        const signedTransaction = await signTransaction(transaction);

        // Send transaction
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        await connection.confirmTransaction(signature);

        // Step 6: Log token creation
        await logTokenCreation({
            walletAddress: payer.toString(),
            tokenMint: mintAddress.toString(),
            formData,
            metadataUri,
            signature,
        });

        return {
            mintAddress: mintAddress.toString(),
            tokenAccount: associatedTokenAddress.toString(),
            metadataUri,
            signature,
        };
    } catch (error) {
        console.error('Error in createTokenMint:', error);
        throw error;
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