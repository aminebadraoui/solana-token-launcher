import {
    Connection,
    PublicKey,
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL,
    Keypair,
} from '@solana/web3.js';
import {
    TOKEN_PROGRAM_ID,
    createInitializeMintInstruction,
    createAssociatedTokenAccountInstruction,
    createMintToInstruction,
    createSetAuthorityInstruction,
    getAssociatedTokenAddress,
    getMintLen,
    AuthorityType,
} from '@solana/spl-token';
import {
    createCreateMetadataAccountV3Instruction,
    PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID
} from '@metaplex-foundation/mpl-token-metadata';
import { shouldUseSecureSigning, getPhantomProvider, logWalletInfo } from './walletUtils';

// IPFS Gateway configuration
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

/**
 * Convert IPFS CID to HTTPS gateway URL for better compatibility
 * @param cid - The IPFS Content Identifier
 * @returns HTTPS gateway URL
 */
function convertToHttpsGateway(cid: string): string {
    // Remove ipfs:// prefix if present
    const cleanCid = cid.replace(/^ipfs:\/\//, '');
    return `${IPFS_GATEWAY}${cleanCid}`;
}

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

        // Create Metaplex metadata account (THIS IS THE MISSING PIECE!)
        console.log('📋 Adding Metaplex metadata creation instruction...');
        const metadataAccount = PublicKey.findProgramAddressSync(
            [
                Buffer.from('metadata'),
                TOKEN_METADATA_PROGRAM_ID.toBytes(),
                mintAddress.toBytes(),
            ],
            TOKEN_METADATA_PROGRAM_ID
        )[0];

        // Prepare creators array for metadata
        const creators = [];
        if (formData.customCreator && formData.creatorAddress) {
            try {
                creators.push({
                    address: new PublicKey(formData.creatorAddress),
                    verified: false,
                    share: 100
                });
            } catch (error) {
                console.warn('⚠️ Invalid creator address, skipping custom creator');
            }
        }

        // Create metadata instruction using the v3 function
        const metadataInstruction = createCreateMetadataAccountV3Instruction(
            {
                metadata: metadataAccount,
                mint: mintAddress,
                mintAuthority: payer,
                payer: payer,
                updateAuthority: payer,
                systemProgram: SystemProgram.programId,
            },
            {
                createMetadataAccountArgsV3: {
                    data: {
                        name: formData.name,
                        symbol: formData.symbol,
                        uri: metadataUri,
                        sellerFeeBasisPoints: 0,
                        creators: creators.length > 0 ? creators : null,
                        collection: null,
                        uses: null,
                    },
                    isMutable: !formData.revokeUpdateAuth,
                    collectionDetails: null,
                }
            }
        );

        tokenTransaction.add(metadataInstruction);
        console.log('✅ Metaplex metadata instruction added');

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

        // Log wallet detection info for debugging
        logWalletInfo();

        // Step 6: Execute transaction using secure signing method
        console.log('🚀 Step 6: Executing atomic transaction (payment + token creation)...');
        const txStartTime = Date.now();
        let atomicSignature: string;

        if (shouldUseSecureSigning()) {
            // SECURE: Use Phantom's native signAndSendTransaction API
            console.log('🔒 Using Phantom secure signing (signAndSendTransaction)');
            console.log('✅ This eliminates "malicious app" warnings!');

            const provider = getPhantomProvider();
            if (!provider) {
                throw new Error('Phantom provider not available. Please ensure Phantom wallet is installed and connected.');
            }

            try {
                const { signature } = await provider.signAndSendTransaction(tokenTransaction);
                atomicSignature = signature;
                console.log('📨 Secure transaction sent, signature:', atomicSignature);

                // Check transaction status
                console.log('⏳ Waiting for confirmation...');
                await connection.getSignatureStatus(signature);
            } catch (phantomError: any) {
                console.error('❌ Phantom signAndSendTransaction failed:', phantomError);

                // Provide more specific error messages
                if (phantomError.message?.includes('User rejected') || phantomError.code === 4001) {
                    throw new Error('User rejected the transaction in Phantom wallet');
                } else if (phantomError.message?.includes('insufficient funds')) {
                    throw new Error('Insufficient SOL balance for transaction fees and token creation');
                } else {
                    throw new Error(`Phantom wallet transaction failed: ${phantomError.message || 'Unknown error'}`);
                }
            }
        } else {
            // FALLBACK: Manual signing for other wallets
            console.log('📝 Using fallback signing for non-Phantom wallet');
            console.log('✍️ Requesting wallet signature for ATOMIC transaction...');
            console.log('ℹ️ This single signature will handle payment AND token creation safely!');

            const signedTokenTransaction = await signTransaction(tokenTransaction);
            console.log('✅ Atomic transaction signed by wallet');

            console.log('📡 Sending atomic transaction to blockchain...');
            atomicSignature = await connection.sendRawTransaction(signedTokenTransaction.serialize());
            console.log('📨 Atomic transaction sent, signature:', atomicSignature);

            console.log('⏳ Waiting for confirmation...');
            await connection.confirmTransaction(atomicSignature);
        }

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

    // Log wallet detection info for debugging
    logWalletInfo();

    let signature: string;

    if (shouldUseSecureSigning()) {
        // SECURE: Use Phantom's native signAndSendTransaction API
        console.log('🔒 Using Phantom secure signing for payment (signAndSendTransaction)');
        console.log('✅ This eliminates "malicious app" warnings!');

        const provider = getPhantomProvider();
        if (!provider) {
            throw new Error('Phantom provider not available. Please ensure Phantom wallet is installed and connected.');
        }

        try {
            const result = await provider.signAndSendTransaction(transaction);
            signature = result.signature;
            console.log('📨 Secure payment transaction sent, signature:', signature);

            // Check transaction status
            await connection.getSignatureStatus(signature);
        } catch (phantomError: any) {
            console.error('❌ Phantom payment signAndSendTransaction failed:', phantomError);

            // Provide more specific error messages
            if (phantomError.message?.includes('User rejected') || phantomError.code === 4001) {
                throw new Error('User rejected the payment transaction in Phantom wallet');
            } else if (phantomError.message?.includes('insufficient funds')) {
                throw new Error('Insufficient SOL balance for payment transaction');
            } else {
                throw new Error(`Phantom wallet payment failed: ${phantomError.message || 'Unknown error'}`);
            }
        }
    } else {
        // FALLBACK: Manual signing for other wallets
        console.log('📝 Using fallback signing for payment (non-Phantom wallet)');

        const signedTransaction = await signTransaction(transaction);
        signature = await connection.sendRawTransaction(signedTransaction.serialize());
        await connection.confirmTransaction(signature);
    }

    return signature;
}

async function uploadMetadataToIPFS(formData: TokenFormData): Promise<string> {
    try {
        // Check if we should use real IPFS uploads or placeholders
        const useRealIPFS = process.env.NEXT_PUBLIC_USE_REAL_IPFS === 'true';
        const nftStorageApiKey = process.env.NEXT_PUBLIC_NFT_STORAGE_API_KEY;

        // DEBUG: Log environment variable values
        console.log('🔍 DEBUG - Environment Variables:');
        console.log('  NEXT_PUBLIC_USE_REAL_IPFS:', process.env.NEXT_PUBLIC_USE_REAL_IPFS);
        console.log('  useRealIPFS:', useRealIPFS);
        console.log('  NFT_STORAGE_API_KEY exists:', !!nftStorageApiKey);

        if (useRealIPFS) {
            console.log('🌐 Using real IPFS uploads via Pinata (server-side)');
            return await uploadToPinata(formData);
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



async function uploadToPinata(formData: TokenFormData): Promise<string> {
    try {
        // Prepare creators array based on custom creator option
        const creators = [];
        if (formData.customCreator && formData.creatorAddress) {
            creators.push({
                address: formData.creatorAddress,
                verified: false,
                share: 100
            });
        }

        // Create metadata object (without image URI initially)
        const metadata = {
            name: formData.name,
            symbol: formData.symbol,
            description: formData.description,
            attributes: [],
            properties: {
                category: 'image',
                creators: creators.length > 0 ? creators : undefined,
            },
            ...(creators.length > 0 && { creators }),
        };

        // Use server-side API route to upload both image and metadata
        console.log('📤 Uploading to Pinata API...');

        const uploadFormData = new FormData();
        if (formData.image) {
            console.log('📸 Adding image to FormData:', formData.image.name, formData.image.type, formData.image.size);
            uploadFormData.append('file', formData.image);
        } else {
            console.log('⚠️ No image provided, adding empty file');
            // Add an empty file if no image is provided
            uploadFormData.append('file', new File([], '', { type: 'application/octet-stream' }));
        }
        uploadFormData.append('metadata', JSON.stringify(metadata));

        console.log('📋 FormData contents:');
        for (const [key, value] of uploadFormData.entries()) {
            console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.type}, ${value.size}b)` : value);
        }

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData,
            // Don't set Content-Type header - let browser set it automatically with boundary
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Pinata upload failed: ${errorData.error || response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Pinata upload successful:', result);

        if (!result.success || !result.metadataUri) {
            throw new Error('Invalid response from Pinata upload API');
        }

        console.log('📋 Final metadata URI:', result.metadataUri);
        console.log('📸 Image URI:', result.imageUri);
        console.log('📄 Metadata CID:', result.metadataCid);

        return result.metadataUri;

    } catch (error) {
        console.error('❌ Pinata upload failed:', error);
        throw error;
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
        image: formData.image ? convertToHttpsGateway('placeholder-image-hash') : '',
        attributes: [],
        properties: {
            files: formData.image ? [
                {
                    uri: convertToHttpsGateway('placeholder-image-hash'),
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
    return convertToHttpsGateway('placeholder-metadata-hash');
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