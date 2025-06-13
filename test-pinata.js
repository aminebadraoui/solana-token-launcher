const { PinataSDK } = require('pinata');
require('dotenv').config({ path: '.env.local' });

async function testPinata() {
    console.log('🔍 Testing Pinata Configuration...\n');

    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log('  PINATA_JWT present:', !!process.env.PINATA_JWT);
    console.log('  PINATA_JWT length:', process.env.PINATA_JWT?.length || 0);
    console.log('');

    if (!process.env.PINATA_JWT) {
        console.error('❌ Missing PINATA_JWT environment variable');
        return;
    }

    try {
        // Initialize Pinata
        const pinata = new PinataSDK({
            pinataJwt: process.env.PINATA_JWT,
            pinataGateway: 'gateway.pinata.cloud'
        });

        console.log('✅ Pinata SDK initialized successfully\n');

        // Test authentication by getting account info
        console.log('🔑 Testing authentication...');
        const testAuth = await pinata.testAuthentication();
        console.log('  Authentication result:', testAuth);
        console.log('');

        // Test a simple file upload
        console.log('📤 Testing file upload...');
        const testContent = `Test upload from Solana Token Launcher at ${new Date().toISOString()}`;
        const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });

        const uploadResult = await pinata.upload.file(testFile).addMetadata({
            name: 'test-upload.txt',
            keyValues: {
                uploadedAt: new Date().toISOString(),
                source: 'solana-token-launcher-test'
            }
        });

        console.log('✅ Test upload successful!');
        console.log('  IPFS Hash:', uploadResult.IpfsHash);
        console.log('  Pin Size:', uploadResult.PinSize);
        console.log('  Gateway URL:', `https://gateway.pinata.cloud/ipfs/${uploadResult.IpfsHash}`);

    } catch (error) {
        console.error('❌ Pinata test failed:', error.message);
        if (error.response) {
            console.error('API Error Details:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        }
    }
}

// Run the test
testPinata().catch(console.error); 