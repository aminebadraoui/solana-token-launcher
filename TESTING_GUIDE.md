# 🧪 Solana Token Creator - Comprehensive Testing Guide

## Table of Contents
1. [Pre-Testing Setup](#pre-testing-setup)
2. [Multi-Wallet Configuration](#multi-wallet-configuration)
3. [Environment Configuration](#environment-configuration)
4. [Core Functionality Testing](#core-functionality-testing)
5. [Premium Features Testing](#premium-features-testing)
6. [New Features Testing](#new-features-testing)
7. [Edge Cases & Error Handling](#edge-cases--error-handling)
8. [Fee Collection Verification](#fee-collection-verification)
9. [User Experience Testing](#user-experience-testing)
10. [Production Readiness](#production-readiness)
11. [Testing Checklist](#testing-checklist)

---

## Pre-Testing Setup

### Required Tools
- [ ] Multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Phantom Wallet extensions installed
- [ ] Solana CLI (optional, for advanced debugging)
- [ ] Network monitoring tools (browser dev tools)
- [ ] Test images (1000x1000 PNG files)

### Test Data Preparation
- [ ] Prepare 3-5 test token metadata sets
- [ ] Create test images in various formats (PNG, JPG, oversized files)
- [ ] Prepare social media links for testing
- [ ] Have Solscan bookmarked for transaction verification

---

## Multi-Wallet Configuration

### 1. App Owner Wallet (Fee Collector)
```bash
Purpose: Receives all transaction fees from the app
Network: Start with Devnet, move to Mainnet later
Setup Steps:
```

1. **Create Primary Fee Collection Wallet**
   - Use a separate browser or incognito mode
   - Install Phantom wallet extension
   - Create new wallet with strong password
   - **CRITICAL**: Save seed phrase securely (this is your revenue wallet)
   - Label: `APP_OWNER_WALLET_DEVNET`
   - Copy public address: `[YOUR_FEE_WALLET_ADDRESS]`

2. **Fund the Fee Wallet**
   - Switch to Devnet in Phantom settings
   - Use Solana faucet: https://faucet.solana.com/
   - Add 2-3 SOL for testing

### 2. User Test Wallets

#### Wallet 1: Basic User Testing
```bash
Purpose: Standard token creation flows
Label: USER_WALLET_1_BASIC
Funding: 2-3 SOL on Devnet
```

#### Wallet 2: Premium Features Testing
```bash
Purpose: Testing paid features (creator info, social links)
Label: USER_WALLET_2_PREMIUM  
Funding: 3-4 SOL on Devnet
```

#### Wallet 3: Edge Cases Testing
```bash
Purpose: Error scenarios, insufficient funds
Label: USER_WALLET_3_EDGE
Funding: 0.1-0.5 SOL on Devnet (intentionally low)
```

#### Wallet 4: Clone Testing
```bash
Purpose: Testing token cloning feature
Label: USER_WALLET_4_CLONE
Funding: 2-3 SOL on Devnet
```

---

## Environment Configuration

### 1. Update Fee Collection Address
```bash
# In your app's environment variables or configuration
1. Locate fee collection configuration in your code
2. Update to your APP_OWNER_WALLET address
3. Verify fee amounts:
   - Base token creation: 0.1 SOL
   - Creator info feature: +0.1 SOL
   - Social links feature: +0.1 SOL
```

### 2. Network Settings
```bash
# Ensure all wallets are on the same network
1. Set all Phantom wallets to Devnet
2. Verify your app connects to Devnet RPC
3. Confirm API endpoints are Devnet-compatible
```

### 3. Start Development Server
```bash
# Navigate to the correct directory first!
cd solana-token-launcher
npm run dev
```

---

## Core Functionality Testing

### Test Case 1: Basic Token Creation
**Wallet**: USER_WALLET_1_BASIC  
**Expected Fee**: 0.1 SOL

#### Test Steps:
1. **Navigate to App**
   - Visit `http://localhost:3000`
   - Verify all pages load correctly

2. **Connect Wallet**
   - Click "Create Token" 
   - Connect USER_WALLET_1_BASIC
   - Verify wallet connection shows correct address

3. **Fill Token Details**
   ```
   Token Name: "Test Token Alpha"
   Symbol: "TTA"
   Decimals: 9 (default)
   Supply: 1,000,000
   Description: "This is a test token for app validation and functionality testing."
   ```

4. **Upload Token Image**
   - Upload a 1000x1000 PNG image
   - Verify preview displays correctly
   - Test file size validation

5. **Configure Basic Settings**
   - Keep default authority settings (all revoked)
   - Do NOT enable creator info or social links

6. **Create Token**
   - Click "Create Token" button
   - Verify transaction details in Phantom popup
   - Approve transaction
   - Wait for confirmation

7. **Verification Steps**
   - [ ] Transaction succeeds
   - [ ] Mint address is displayed
   - [ ] Token metadata is accessible
   - [ ] Image uploaded to IPFS successfully
   - [ ] Fee wallet received exactly 0.1 SOL

---

### Test Case 2: Token Creation with Image Issues
**Wallet**: USER_WALLET_1_BASIC  
**Purpose**: Test image handling edge cases

#### Test Steps:
1. **Test Oversized Image**
   - Upload image >5MB
   - Verify error message appears
   - Verify no transaction occurs

2. **Test Invalid Format**
   - Upload PDF or GIF file
   - Verify format validation works
   - Verify clear error messaging

3. **Test No Image**
   - Create token without image
   - Verify token creation still works
   - Verify default handling

---

## Premium Features Testing

### Test Case 3: Creator Info Feature
**Wallet**: USER_WALLET_2_PREMIUM  
**Expected Fee**: 0.2 SOL (0.1 base + 0.1 premium)

#### Test Steps:
1. **Enable Creator Info**
   - Toggle "Creator's Info" switch
   - Verify fee calculation updates (+0.1 SOL)

2. **Fill Creator Details**
   ```
   Custom Creator: ✅ Enabled
   Creator Address: [Valid Solana address]
   Creator Name: "Test Creator Studio"
   ```

3. **Create Token**
   - Complete token creation process
   - Verify total fee is 0.2 SOL

4. **Verification**
   - [ ] Fee wallet received 0.2 SOL
   - [ ] Metadata includes custom creator info
   - [ ] Creator address is correctly set

---

### Test Case 4: Social Links Feature
**Wallet**: USER_WALLET_2_PREMIUM  
**Expected Fee**: 0.2 SOL (0.1 base + 0.1 social)

#### Test Steps:
1. **Enable Social Links**
   - Toggle "Social Links" switch
   - Verify fee updates

2. **Add Social Links**
   ```
   Twitter: https://twitter.com/testtoken
   Telegram: https://t.me/testtoken
   Website: https://testtoken.com
   ```

3. **Create Token**
   - Complete creation process
   - Verify fee collection

4. **Verification**
   - [ ] Social links in metadata
   - [ ] Links are accessible
   - [ ] Correct fee charged

---

### Test Case 5: Maximum Premium Features
**Wallet**: USER_WALLET_2_PREMIUM  
**Expected Fee**: 0.3 SOL (0.1 base + 0.1 creator + 0.1 social)

#### Test Steps:
1. **Enable All Premium Features**
   - Creator info: ✅
   - Social links: ✅
   - Verify total shows 0.3 SOL

2. **Create Token with All Features**
   - Complete full premium token creation
   - Verify all features work together

3. **Verification**
   - [ ] Fee wallet received 0.3 SOL
   - [ ] All premium features in metadata
   - [ ] Token functions correctly

---

## New Features Testing

### Test Case 6: Top Creators Modal
**Wallet**: Any test wallet

#### Test Steps:
1. **Open Modal**
   - Click "👑 Top Creators" button
   - Verify modal opens with loading state

2. **Test Creator List**
   - [ ] Real pump.fun creators load
   - [ ] Rank badges display correctly
   - [ ] Token counts show properly
   - [ ] Addresses are formatted correctly

3. **Test Creator Selection**
   - Click on a creator
   - Verify form auto-fills with creator address
   - Verify modal closes properly

4. **Test Solscan Links**
   - Click "🔍 Solscan" links
   - Verify links open in new tabs
   - Verify correct creator addresses

5. **Test Modal Interactions**
   - [ ] Close button works
   - [ ] Click outside to close
   - [ ] Responsive design on mobile
   - [ ] Loading and error states

---

### Test Case 7: Documentation/Support Page
**Purpose**: Verify new support page functionality

#### Test Steps:
1. **Navigation Testing**
   - Click "Support" in main navigation
   - Verify page loads with consistent styling
   - Check URL is `/docs`

2. **Design Consistency**
   - [ ] Same background as other pages (`dark-gradient-bg`)
   - [ ] Header component is included
   - [ ] Typography matches other pages
   - [ ] Color scheme is consistent

3. **Tab Navigation**
   - Click "Token Creation" tab
   - Click "Next Steps" tab
   - Verify active states work
   - Verify content switches correctly

4. **Expandable Sections**
   - Test each expandable section
   - Verify smooth animations
   - Check keyboard navigation (Tab, Enter)
   - Verify ARIA accessibility

5. **External Links**
   - Test Raydium link opens correctly
   - Test DEX Screener link
   - Test Solscan links
   - Test Solana Explorer links
   - Verify all open in new tabs

6. **Help Banner Integration**
   - Go to token creation form
   - Verify help banner appears
   - Click "Get Support" button
   - Verify redirects to support page

---

### Test Case 8: Token Cloning Feature
**Wallet**: USER_WALLET_4_CLONE

#### Test Steps:
1. **Access Trending Page**
   - Navigate to `/trending`
   - Verify trending tokens load
   - Check API data is current

2. **Clone a Token**
   - Click "🚀 Clone" on any token
   - Verify redirects to `/create-token?clone=[mint]`
   - Check loading states

3. **Verify Auto-Population**
   - [ ] Form fills with variations of original name
   - [ ] Symbol is modified appropriately
   - [ ] Description is preserved
   - [ ] Image downloads and converts
   - [ ] Social links extracted from metadata

4. **Create Cloned Token**
   - Complete token creation process
   - Verify success and fee collection
   - Compare with original token

---

## Edge Cases & Error Handling

### Test Case 9: Insufficient Funds
**Wallet**: USER_WALLET_3_EDGE (low SOL balance)

#### Test Steps:
1. **Attempt Token Creation**
   - Try creating token with 0.05 SOL balance
   - Verify transaction fails gracefully
   - Check error messaging is clear

2. **Verification**
   - [ ] No partial charges occur
   - [ ] Clear error message shown
   - [ ] User can retry after funding
   - [ ] No stuck states

---

### Test Case 10: Network Issues
**Purpose**: Test app behavior during network problems

#### Test Steps:
1. **Simulate Network Issues**
   - Disconnect internet during token creation
   - Throttle network speed
   - Test with high network congestion

2. **Verify Handling**
   - [ ] Proper error messages
   - [ ] Retry mechanisms work
   - [ ] No data corruption
   - [ ] Graceful degradation

---

### Test Case 11: Wallet Connection Issues
**Purpose**: Test wallet interaction edge cases

#### Test Steps:
1. **Connection Problems**
   - Try connecting with locked wallet
   - Test wallet disconnection during process
   - Switch wallets mid-process

2. **Verification**
   - [ ] Clear connection prompts
   - [ ] Process resumes correctly
   - [ ] No partial transactions

---

## Fee Collection Verification

### Fee Tracking Worksheet

#### Pre-Testing Balance
```
APP_OWNER_WALLET Initial Balance: ______ SOL
Date/Time: ________________
Block Height: _____________
```

#### Transaction Log
| Test Case | Expected Fee | Actual Fee | Transaction ID | Status |
|-----------|-------------|------------|----------------|---------|
| Basic Token | 0.1 SOL | _____ SOL | ________________ | ✅/❌ |
| Creator Info | 0.2 SOL | _____ SOL | ________________ | ✅/❌ |
| Social Links | 0.2 SOL | _____ SOL | ________________ | ✅/❌ |
| Full Premium | 0.3 SOL | _____ SOL | ________________ | ✅/❌ |
| Clone Token | 0.1 SOL | _____ SOL | ________________ | ✅/❌ |

#### Post-Testing Balance
```
APP_OWNER_WALLET Final Balance: ______ SOL
Total Fees Collected: ______ SOL
Expected Total: ______ SOL
Difference: ______ SOL
```

### Solscan Verification
1. **Check Each Transaction**
   - Open each transaction ID in Solscan
   - Verify fee transfer to correct wallet
   - Verify token mint creation
   - Check metadata upload success

2. **Cross-Reference**
   - Compare with user wallet transaction history
   - Verify amounts match expectations
   - Check for any unexpected transactions

---

## User Experience Testing

### Test Case 12: Mobile Responsiveness
**Devices**: iOS Safari, Android Chrome

#### Test Steps:
1. **Mobile Layout**
   - Test all pages on mobile devices
   - Verify forms are usable
   - Check button sizes and spacing

2. **Touch Interactions**
   - Test wallet connection on mobile
   - Verify image upload works
   - Check modal interactions

3. **Verification**
   - [ ] All features work on mobile
   - [ ] Text is readable
   - [ ] Buttons are properly sized
   - [ ] No horizontal scrolling

---

### Test Case 13: Browser Compatibility
**Browsers**: Chrome, Firefox, Safari, Edge

#### Test Steps:
1. **Cross-Browser Testing**
   - Test core functionality in each browser
   - Verify wallet connections work
   - Check CSS rendering

2. **Verification**
   - [ ] Consistent appearance
   - [ ] All features functional
   - [ ] No console errors
   - [ ] Performance is acceptable

---

### Test Case 14: Performance Testing
**Purpose**: Ensure app performs well under various conditions

#### Test Steps:
1. **Load Testing**
   - Test with slow internet (3G simulation)
   - Monitor page load times
   - Check resource usage

2. **Stress Testing**
   - Rapid button clicking
   - Quick wallet switching
   - Multiple tab usage

3. **Verification**
   - [ ] App remains responsive
   - [ ] No memory leaks
   - [ ] Reasonable load times
   - [ ] Graceful error handling

---

## Production Readiness

### Pre-Mainnet Checklist
- [ ] All Devnet tests pass successfully
- [ ] Fee collection verified multiple times
- [ ] No console errors in any browser
- [ ] Mobile experience is smooth
- [ ] All external links work correctly
- [ ] Error handling covers all scenarios
- [ ] Security review completed
- [ ] Performance benchmarks met

### Mainnet Migration Steps
1. **Update Configuration**
   - Switch RPC endpoints to Mainnet
   - Update fee wallet to Mainnet address
   - Verify API endpoints support Mainnet

2. **Gradual Rollout**
   - Test with small SOL amounts first
   - Monitor first few transactions closely
   - Have rollback plan ready

3. **Monitoring Setup**
   - Set up balance alerts for fee wallet
   - Monitor error rates and performance
   - Track user feedback and issues

---

## Testing Checklist

### ✅ Pre-Testing Setup
- [ ] Multiple wallets created and funded
- [ ] Test data and images prepared
- [ ] Development server running correctly
- [ ] All browsers installed and configured

### ✅ Core Functionality
- [ ] Basic token creation works
- [ ] Fee collection verified
- [ ] Image upload and IPFS storage
- [ ] Metadata creation and verification
- [ ] Transaction success confirmation

### ✅ Premium Features
- [ ] Creator info feature works and charges correctly
- [ ] Social links feature works and charges correctly
- [ ] Multiple premium features work together
- [ ] Fee calculations are accurate

### ✅ New Features
- [ ] Top Creators modal loads and functions
- [ ] Creator selection auto-fills form
- [ ] Solscan links work correctly
- [ ] Documentation page accessible and functional
- [ ] Tab navigation works smoothly
- [ ] Expandable sections animate properly
- [ ] Help banner integration works
- [ ] Token cloning feature complete workflow

### ✅ Edge Cases
- [ ] Insufficient funds handled gracefully
- [ ] Network issues don't break app
- [ ] Invalid inputs rejected properly
- [ ] Wallet connection issues handled
- [ ] Large file uploads rejected
- [ ] Invalid file formats rejected

### ✅ User Experience
- [ ] Mobile responsive design works
- [ ] Cross-browser compatibility verified
- [ ] Performance under load acceptable
- [ ] Accessibility features work
- [ ] Error messages are clear and helpful

### ✅ Fee Collection
- [ ] All fees collected in correct wallet
- [ ] Fee amounts match expectations
- [ ] No partial or stuck transactions
- [ ] Solscan verification completed
- [ ] Transaction IDs recorded

### ✅ Production Ready
- [ ] Security review completed
- [ ] All tests documented
- [ ] Rollback plan prepared
- [ ] Monitoring setup planned
- [ ] Beta user feedback collected

---

## Emergency Procedures

### If Fee Collection Fails
1. **Immediate Actions**
   - Stop all app promotion
   - Disable fee collection temporarily
   - Investigate transaction logs

2. **Investigation Steps**
   - Check wallet configuration
   - Verify RPC connection
   - Review recent code changes
   - Check Solana network status

### If Critical Bug Found
1. **Damage Control**
   - Document the issue completely
   - Implement temporary fix if possible
   - Communicate with affected users

2. **Resolution Process**
   - Create fix and test thoroughly
   - Deploy to staging environment
   - Re-run full testing suite
   - Deploy to production with monitoring

---

## Success Metrics

### Technical Metrics
- **Success Rate**: >99% transaction completion
- **Fee Collection**: 100% accuracy
- **Performance**: <3s page load times
- **Uptime**: >99.9% availability

### User Experience Metrics
- **Mobile Usability**: All features work on mobile
- **Cross-Browser**: Consistent experience across browsers
- **Error Rate**: <1% user-reported errors
- **Support Requests**: <5% of users need support

---

## Final Notes

1. **Documentation**: Keep this guide updated as features change
2. **Version Control**: Tag releases after successful testing
3. **Backup Plans**: Always have rollback procedures ready
4. **User Feedback**: Collect and act on user reports
5. **Continuous Monitoring**: Set up alerts for fee collection and errors

**Remember**: Test thoroughly on Devnet before any Mainnet deployment. Your fee collection wallet is your business revenue - protect it carefully!

---

*Last Updated: [Current Date]*  
*Version: 1.0*  
*Tested By: [Your Name]* 