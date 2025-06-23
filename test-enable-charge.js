/**
 * Test script to demonstrate ENABLE_CHARGE environment variable functionality
 * This script simulates the shouldChargeServiceFees function behavior
 */

function shouldChargeServiceFees(enableCharge, nodeEnv) {
    const isDevelopment = nodeEnv === 'development';

    // In development, only charge if explicitly enabled
    if (isDevelopment) {
        return enableCharge === 'true';
    }

    // In production, always charge unless explicitly disabled
    return enableCharge !== 'false';
}

// Test scenarios
console.log('🧪 Testing ENABLE_CHARGE Environment Variable\n');

const testCases = [
    // Development scenarios
    { env: 'development', charge: undefined, expected: false, description: 'Development - no env var' },
    { env: 'development', charge: 'false', expected: false, description: 'Development - explicitly false' },
    { env: 'development', charge: 'true', expected: true, description: 'Development - explicitly true' },

    // Production scenarios
    { env: 'production', charge: undefined, expected: true, description: 'Production - no env var' },
    { env: 'production', charge: 'true', expected: true, description: 'Production - explicitly true' },
    { env: 'production', charge: 'false', expected: false, description: 'Production - explicitly false' },
];

testCases.forEach(({ env, charge, expected, description }) => {
    const result = shouldChargeServiceFees(charge, env);
    const status = result === expected ? '✅' : '❌';
    const action = result ? 'CHARGE' : 'FREE';

    console.log(`${status} ${description}`);
    console.log(`   Environment: ${env}`);
    console.log(`   ENABLE_CHARGE: ${charge || 'undefined'}`);
    console.log(`   Result: ${action} service fees`);
    console.log(`   Expected: ${expected ? 'CHARGE' : 'FREE'}`);
    console.log('');
});

console.log('🎯 Summary:');
console.log('• Development: Service fees are FREE by default');
console.log('• Development: Set ENABLE_CHARGE=true to enable charging');
console.log('• Production: Service fees are CHARGED by default');
console.log('• Production: Set ENABLE_CHARGE=false to disable charging');
console.log('• Only affects service fees to platform wallet');
console.log('• Solana network transaction fees always apply'); 