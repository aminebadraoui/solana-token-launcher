// Simple test script to verify API endpoints
// Run with: node test-endpoints.js

const BASE_URL = 'http://localhost:3000';

async function testApiEndpoints() {
    console.log('🧪 Testing API Endpoints...\n');

    try {
        // Test GET /api/log-token
        console.log('1. Testing GET /api/log-token');
        const response = await fetch(`${BASE_URL}/api/log-token`);
        const data = await response.json();

        if (response.ok) {
            console.log('✅ Success:', data);
            console.log(`   Found ${data.tokens.length} tokens in database\n`);
        } else {
            console.log('❌ Error:', data);
        }

        // Test POST /api/log-token (simulate token creation log)
        console.log('2. Testing POST /api/log-token');
        const testToken = {
            walletAddress: 'TEST_WALLET_ADDRESS',
            tokenMint: 'TEST_MINT_ADDRESS',
            name: 'Test Token',
            symbol: 'TEST',
            supply: 1000000,
            decimals: 9,
            description: 'This is a test token',
            metadataUri: 'ipfs://test-hash',
            signature: 'test-signature',
            options: {
                revokeMintAuth: true,
                revokeFreezeAuth: false,
                revokeUpdateAuth: false,
                customCreator: true,
            },
            creatorAddress: '11111111111111111111111111111112', // Test creator address
            timestamp: new Date().toISOString(),
        };

        const postResponse = await fetch(`${BASE_URL}/api/log-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testToken),
        });

        const postData = await postResponse.json();

        if (postResponse.ok) {
            console.log('✅ Success:', postData);
            console.log('   Test token logged successfully\n');
        } else {
            console.log('❌ Error:', postData);
        }

        // Test filtered query
        console.log('3. Testing filtered query /api/log-token?wallet=TEST_WALLET_ADDRESS');
        const filteredResponse = await fetch(`${BASE_URL}/api/log-token?wallet=TEST_WALLET_ADDRESS`);
        const filteredData = await filteredResponse.json();

        if (filteredResponse.ok) {
            console.log('✅ Success:', filteredData);
            console.log(`   Found ${filteredData.tokens.length} tokens for test wallet\n`);
        } else {
            console.log('❌ Error:', filteredData);
        }

    } catch (error) {
        console.log('❌ Network Error:', error.message);
        console.log('   Make sure the development server is running (npm run dev)\n');
    }
}

// Run the tests
testApiEndpoints(); 