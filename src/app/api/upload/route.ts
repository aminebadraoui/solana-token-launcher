import { NextRequest, NextResponse } from 'next/server';
import { PinataSDK } from 'pinata';

// Initialize Pinata client
const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT!,
    pinataGateway: 'gateway.pinata.cloud'
});

export async function POST(request: NextRequest) {
    console.log('🔄 Starting IPFS upload via Pinata...');

    try {
        // Validate environment variables
        if (!process.env.PINATA_JWT) {
            console.error('❌ Missing PINATA_JWT environment variable');
            return NextResponse.json(
                { error: 'Server configuration error: Missing Pinata JWT' },
                { status: 500 }
            );
        }

        console.log('✅ Pinata JWT found, length:', process.env.PINATA_JWT.length);

        // Parse the multipart form data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const metadata = formData.get('metadata') as string;

        // Check if this is a token creation request (has both file and metadata)
        if (metadata) {
            console.log('🪙 Token creation upload detected - uploading image and metadata');
            return await handleTokenCreationUpload(file, metadata);
        } else {
            console.log('📁 Simple file upload detected');
            return await handleSimpleFileUpload(file);
        }

    } catch (error: any) {
        console.error('❌ Upload failed:', error);

        // Enhanced error logging
        if (error.response) {
            console.error('Pinata API Error Response:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        }

        if (error.message) {
            console.error('Error message:', error.message);
        }

        return NextResponse.json(
            {
                error: 'Server upload failed',
                details: error.message || 'Unknown error occurred',
                type: 'pinata_upload_error'
            },
            { status: 500 }
        );
    }
}

async function handleSimpleFileUpload(file: File) {
    if (!file) {
        console.error('❌ No file provided in request');
        return NextResponse.json(
            { error: 'No file provided' },
            { status: 400 }
        );
    }

    console.log('📁 File details:', {
        name: file.name,
        size: file.size,
        type: file.type
    });

    console.log('📤 Uploading file to Pinata...');

    // Upload to Pinata using the correct API method from documentation
    const uploadResult = await pinata.upload.public.file(file);

    console.log('✅ Pinata upload successful:', {
        id: uploadResult.id,
        cid: uploadResult.cid,
        size: uploadResult.size,
        name: uploadResult.name
    });

    // Construct the IPFS URL using the CID
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${uploadResult.cid}`;

    // Return the IPFS hash and URL
    return NextResponse.json({
        success: true,
        ipfsHash: uploadResult.cid,
        ipfsUrl: ipfsUrl,
        size: uploadResult.size,
        id: uploadResult.id,
        name: uploadResult.name
    });
}

async function handleTokenCreationUpload(file: File | null, metadataString: string) {
    let imageUri = '';
    let imageCid = '';

    // Upload image if provided
    if (file && file.size > 0) {
        console.log('📸 Uploading image to Pinata...', {
            name: file.name,
            size: file.size,
            type: file.type
        });

        const imageUploadResult = await pinata.upload.public.file(file);
        imageCid = imageUploadResult.cid;
        imageUri = `https://gateway.pinata.cloud/ipfs/${imageCid}`;

        console.log('✅ Image uploaded successfully:', {
            cid: imageCid,
            url: imageUri
        });
    } else {
        console.log('⚠️ No image provided or empty file');
    }

    // Parse and update metadata with image URI
    let metadata;
    try {
        metadata = JSON.parse(metadataString);
        if (imageUri) {
            metadata.image = imageUri;
            // Also update properties.files if it exists
            if (metadata.properties && metadata.properties.files) {
                metadata.properties.files = [{
                    uri: imageUri,
                    type: file?.type || 'image/png'
                }];
            }
        }
    } catch (parseError) {
        console.error('❌ Failed to parse metadata JSON:', parseError);
        throw new Error('Invalid metadata JSON');
    }

    console.log('📄 Uploading metadata to Pinata...', {
        name: metadata.name,
        symbol: metadata.symbol,
        hasImage: !!imageUri
    });

    // Create metadata file and upload
    const metadataFile = new File(
        [JSON.stringify(metadata, null, 2)],
        'metadata.json',
        { type: 'application/json' }
    );

    const metadataUploadResult = await pinata.upload.public.file(metadataFile);
    const metadataCid = metadataUploadResult.cid;
    const metadataUri = `https://gateway.pinata.cloud/ipfs/${metadataCid}`;

    console.log('✅ Metadata uploaded successfully:', {
        cid: metadataCid,
        url: metadataUri
    });

    // Return both image and metadata results
    return NextResponse.json({
        success: true,
        imageCid,
        imageUri,
        metadataCid,
        metadataUri,
        // Legacy fields for compatibility
        ipfsHash: metadataCid,
        ipfsUrl: metadataUri
    });
} 