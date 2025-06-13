#!/usr/bin/env node

import { create } from '@web3-storage/w3up-client'
import { StoreMemory } from '@web3-storage/w3up-client/stores/memory'
import fs from 'fs'

console.log('🆕 Creating completely fresh Web3.Storage space and delegation...\n')

try {
    // Create a fresh client with memory store (no persistence)
    const client = await create({ store: new StoreMemory() })

    console.log('✅ Fresh client created')
    console.log('🔑 Agent DID:', client.agent.did())

    // Create a completely new space
    const space = await client.createSpace('TokenLaunchFresh')
    console.log('🏠 New space created:', space.did())

    // Set as current space
    await client.setCurrentSpace(space.did())
    console.log('🎯 Space set as current')

    // Create delegation for the specific capabilities we need
    const delegation = await client.createDelegation(client.agent, ['space/blob/add', 'space/index/add', 'filecoin/offer', 'upload/add'], {
        audienceData: {
            type: 'device',
            name: 'TokenLauncher'
        }
    })

    console.log('📜 Delegation created')

    // Export the delegation
    const archive = await delegation.archive()
    const proof = Buffer.from(archive.ok).toString('base64')

    console.log('\n🔧 NEW ENVIRONMENT VARIABLES:')
    console.log('=====================================')
    console.log(`W3_KEY="${client.agent.issuer.did()}"`)
    console.log(`W3_PROOF="${proof}"`)
    console.log('=====================================\n')

    // Save to a file for easy copying
    const envContent = `# Fresh Web3.Storage Configuration
W3_KEY="${client.agent.issuer.did()}"
W3_PROOF="${proof}"
`

    fs.writeFileSync('fresh-w3-config.env', envContent)
    console.log('💾 Configuration saved to fresh-w3-config.env')

    console.log('\n📋 NEXT STEPS:')
    console.log('1. Replace W3_KEY and W3_PROOF in your .env.local with the values above')
    console.log('2. Restart your development server')
    console.log('3. Test the upload functionality')

} catch (error) {
    console.error('❌ Error creating fresh space:', error)
    process.exit(1)
} 