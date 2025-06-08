import { NextRequest, NextResponse } from 'next/server';
import { NFTStorage, File } from 'nft.storage';

// Initialize NFT.Storage client
// You'll need to get an API key from https://nft.storage/
const NFT_STORAGE_API_KEY = process.env.NFT_STORAGE_API_KEY || '';
const client = new NFTStorage({ token: NFT_STORAGE_API_KEY });

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;
        const metadata = JSON.parse(formData.get('metadata') as string);

        if (!image) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        // Upload image to IPFS
        const imageFile = new File([await image.arrayBuffer()], image.name, {
            type: image.type,
        });

        const imageCid = await client.storeBlob(imageFile);
        const imageUri = `ipfs://${imageCid}`;

        // Create complete metadata with image URI
        const completeMetadata = {
            ...metadata,
            image: imageUri,
            properties: {
                ...metadata.properties,
                files: [
                    {
                        uri: imageUri,
                        type: image.type,
                    },
                ],
            },
        };

        // Upload metadata to IPFS
        const metadataFile = new File(
            [JSON.stringify(completeMetadata)],
            'metadata.json',
            { type: 'application/json' }
        );

        const metadataCid = await client.storeBlob(metadataFile);
        const metadataUri = `ipfs://${metadataCid}`;

        return NextResponse.json({
            success: true,
            imageUri,
            metadataUri,
            imageCid,
            metadataCid,
        });
    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        return NextResponse.json(
            { error: 'Failed to upload to IPFS' },
            { status: 500 }
        );
    }
} 