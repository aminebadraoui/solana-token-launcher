import { NextRequest, NextResponse } from 'next/server';
import * as Client from '@web3-storage/w3up-client';
import { StoreMemory } from '@web3-storage/w3up-client/stores/memory';
import * as Proof from '@web3-storage/w3up-client/proof';
import { Signer } from '@web3-storage/w3up-client/principal/ed25519';

// Environment variables for Web3.Storage
const W3_KEY = process.env.W3_KEY || process.env.NEXT_PUBLIC_W3_KEY || '';
const W3_PROOF = process.env.W3_PROOF || process.env.NEXT_PUBLIC_W3_PROOF || '';

export async function POST(request: NextRequest) {
    try {
        // Validate Web3.Storage credentials
        if (!W3_KEY || !W3_PROOF) {
            console.error('❌ Web3.Storage credentials not found in environment variables');
            console.error('Missing:', {
                W3_KEY: !W3_KEY ? 'missing' : 'present',
                W3_PROOF: !W3_PROOF ? 'missing' : 'present'
            });
            return NextResponse.json({
                error: 'Web3.Storage credentials not configured. Please set W3_KEY and W3_PROOF environment variables.'
            }, { status: 500 });
        }

        // Debug: Log request headers
        console.log('📋 Request headers:', Object.fromEntries(request.headers.entries()));
        console.log('📋 Content-Type:', request.headers.get('content-type'));

        let formData;
        try {
            formData = await request.formData();
        } catch (formDataError) {
            console.error('❌ Failed to parse FormData:', formDataError);
            return NextResponse.json({
                error: `Failed to parse FormData: ${formDataError instanceof Error ? formDataError.message : 'Unknown error'}`,
                details: 'Ensure you are sending multipart/form-data with image and metadata fields'
            }, { status: 400 });
        }

        const image = formData.get('image') as File;
        const metadataString = formData.get('metadata') as string;

        if (!metadataString) {
            return NextResponse.json({ error: 'No metadata provided' }, { status: 400 });
        }

        let metadata;
        try {
            metadata = JSON.parse(metadataString);
        } catch (parseError) {
            return NextResponse.json({ error: 'Invalid metadata JSON' }, { status: 400 });
        }

        console.log('📤 Starting Web3.Storage upload process...');

        // Initialize Web3.Storage client
        const client = await createWeb3StorageClient();

        let imageUri = '';
        let imageCid = '';

        // Step 1: Upload image if provided
        if (image && image.size > 0) {
            console.log('📸 Uploading image to Web3.Storage...');
            console.log('📸 Image details:', { name: image.name, type: image.type, size: image.size });

            try {
                const imageCidResult = await client.uploadFile(image);
                imageCid = imageCidResult.toString();
                imageUri = `ipfs://${imageCid}`;
                console.log('✅ Image uploaded successfully:', { imageCid, imageUri });
            } catch (imageError) {
                console.error('❌ Image upload failed:', imageError);
                return NextResponse.json({
                    error: 'Failed to upload image to Web3.Storage',
                    details: imageError instanceof Error ? imageError.message : 'Unknown error'
                }, { status: 500 });
            }
        } else {
            console.log('⚠️ No image provided, creating metadata-only upload');
        }

        // Step 2: Create complete metadata with image reference
        const completeMetadata = {
            ...metadata,
            ...(imageUri && { image: imageUri })
        };

        console.log('📄 Uploading metadata to Web3.Storage...');
        console.log('📄 Metadata:', completeMetadata);

        // Step 3: Upload metadata
        let metadataCid = '';
        let metadataUri = '';

        try {
            const metadataBlob = new Blob([JSON.stringify(completeMetadata)], {
                type: 'application/json'
            });
            const metadataFile = new File([metadataBlob], 'metadata.json', {
                type: 'application/json'
            });

            const metadataCidResult = await client.uploadFile(metadataFile);
            metadataCid = metadataCidResult.toString();
            metadataUri = `ipfs://${metadataCid}`;
            console.log('✅ Metadata uploaded successfully:', { metadataCid, metadataUri });
        } catch (metadataError) {
            console.error('❌ Metadata upload failed:', metadataError);
            return NextResponse.json({
                error: 'Failed to upload metadata to Web3.Storage',
                details: metadataError instanceof Error ? metadataError.message : 'Unknown error'
            }, { status: 500 });
        }

        // Return success response
        const response = {
            success: true,
            imageUri,
            metadataUri,
            imageCid,
            metadataCid,
            message: 'Successfully uploaded to Web3.Storage'
        };

        console.log('🎉 Upload completed successfully:', response);
        return NextResponse.json(response);

    } catch (error) {
        console.error('❌ Server-side upload error:', error);
        return NextResponse.json({
            error: 'Internal server error during upload',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

/**
 * Create and configure Web3.Storage client with UCAN delegation
 */
async function createWeb3StorageClient() {
    try {
        console.log('🔧 Initializing Web3.Storage client...');

        // Load client with specific private key
        const principal = Signer.parse(W3_KEY);
        const store = new StoreMemory();
        const client = await Client.create({ principal, store });

        // Add proof that this agent has been delegated capabilities on the space
        const proof = await Proof.parse(W3_PROOF);
        const space = await client.addSpace(proof);
        await client.setCurrentSpace(space.did());

        console.log('✅ Web3.Storage client initialized successfully');
        console.log('📍 Space DID:', space.did());

        return client;
    } catch (error) {
        console.error('❌ Failed to initialize Web3.Storage client:', error);
        throw new Error(`Web3.Storage client initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
} 