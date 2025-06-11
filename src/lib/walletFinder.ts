import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface WalletInfo {
    address: string;
    balance: number; // in SOL
    lamports: number; // raw lamports
    formattedBalance: string;
    isValidCreator: boolean;
}

interface WalletScanOptions {
    minBalance?: number; // minimum SOL balance required
    maxResults?: number; // maximum number of results
    sortByBalance?: boolean;
}

interface RichListEntry {
    address: string;
    balance?: number;  // For fallback data
    quantity?: number; // For API response data
    percentage: number;
    rank: number;
}

/**
 * Cache for fetched wallet addresses (expires after 30 minutes)
 */
let cachedRichList: RichListEntry[] = [];
let richListCacheTimestamp: number = 0; // Reset to force fresh fetch
const RICH_LIST_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Cache for individual wallet balances (expires after 1 hour)
 */
const balanceCache = new Map<string, { balance: number; timestamp: number }>(); // Reset cache
const BALANCE_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Known exchange/institutional addresses to filter out from rich list
 */
const EXCHANGE_ADDRESSES = new Set([
    'MJKqp326RZCHnAAbew9MDdui3iCKWco7fsK9sVuZTX2', // Major exchange
    '52C9T2T7JRojtxumYnYZhyUmrN7kqzvCLc4Ksvjk7TxD', // Exchange wallet
    '8BseXT9EtoEhBTKFFYkwTnjKSUZwhtmdKY2Jrj8j45Rt', // Institutional
    'GitYucwpNcg6Dx1Y15UQ9TQn8LZMX1uuqQNn8rXxEWNC', // Known exchange
    '9QgXqrgdbVU8KcpfskqJpAXKzbaYQJecgMAruSWoXDkM', // Exchange/validator
]);

/**
 * Fetch current Solana rich list from CoinCarp
 */
async function fetchSolanaRichList(): Promise<RichListEntry[]> {
    // Check cache first
    const now = Date.now();
    if (cachedRichList.length > 0 && (now - richListCacheTimestamp) < RICH_LIST_CACHE_DURATION) {
        console.log(`📦 Using cached rich list (${cachedRichList.length} addresses)`);
        return cachedRichList;
    }

    console.log('🌐 Fetching live Solana rich list from CoinCarp...');

    try {
        // Try to fetch from a proxy or direct API if available
        const response = await fetch('/api/solana-richlist', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (response.ok) {
            const data = await response.json();
            const apiRichList = data.richList || [];

            // Transform API data to our format (normalize quantity to balance)
            cachedRichList = apiRichList.map((entry: any) => ({
                address: entry.address,
                balance: entry.quantity || entry.balance || 0,
                percentage: entry.percentage,
                rank: entry.rank
            }));

            richListCacheTimestamp = now;
            console.log(`✅ Fetched ${cachedRichList.length} addresses from rich list API`);
            return cachedRichList;
        }
    } catch (error) {
        console.log('⚠️ API fetch failed, falling back to static high-value addresses');
    }

    // Fallback to known high-value individual addresses if API fails
    const fallbackAddresses: RichListEntry[] = [
        { address: 'FbGeZS8LiPCZiFpFwdUUeF2yxXtSsdfJoHTsVMvM8STh', balance: 1799.981, percentage: 0.35, rank: 22 },
        { address: 'C8BSJt7GVYZNpkLTM9rHFzh1VQm14bYQPQFS77NSSugG', balance: 1644.558, percentage: 0.32, rank: 23 },
        { address: '9oua4J9GGEzHUqCyqiQs3D6rf5ZouwNzm8S2Hm415q9B', balance: 1593.080, percentage: 0.31, rank: 24 },
        { address: '4rF6k3aRX54yhHakGDEbwvPzb36d2PKw688VqchP3bNU', balance: 1400.000, percentage: 0.27, rank: 25 },
        { address: 'BifEkWRt8sZnpKkuh4nThqK8VJxUprfKwuq6uXBDFmcW', balance: 1357.923, percentage: 0.27, rank: 26 },
        { address: '8MyWcZGvLKWcnePJCdgE7aZEt3Bf7ttM7RkCRCyDtYMi', balance: 1312.339, percentage: 0.26, rank: 27 },
        { address: '5MPGAb9xjdpscnRFBnp4ZCGJrndU6JmMrmbJKqSaLn9i', balance: 1250.000, percentage: 0.24, rank: 28 },
        { address: '8yJ5J9ZrNQNErD3xDRebp7jwxbKU1vLtY5Yn11wv4r3X', balance: 1226.507, percentage: 0.24, rank: 29 },
        { address: '2Ls7ywRZTSeViL17DKZCoBZVb1u9oB7jyjowqqCNaxvq', balance: 1211.006, percentage: 0.24, rank: 30 },
        { address: 'AE99TFcM9DHRRLTxBZjJxLQ1Gdo89S9yyDAU8WUEmPpb', balance: 1208.333, percentage: 0.24, rank: 31 },
        { address: '9prVdaYZTtH1LDbZZHdKrvSqTD1WM4q4NNMMWgzn4rE1', balance: 1169.372, percentage: 0.23, rank: 32 },
        { address: 'Db3z2bUaQy6NS8iMKPikEALS248Rt1WAzR3kRL82XDRD', balance: 1167.808, percentage: 0.23, rank: 33 },
        { address: '4XCJ5PbHJWP1xfBKyYmV6GnUox1KY1czCiBQW1U3NCNj', balance: 1166.858, percentage: 0.23, rank: 34 },
        { address: '9WX4J4EnJXq5PX4gjdDEuQ6tAZUivjjMZrdGiZcG7Nmf', balance: 1133.073, percentage: 0.22, rank: 35 },
        { address: 'H6vpvhyv8nVeXsoE3GCyZ4q2EViENnzwTJzw5fe8LnFV', balance: 1028.930, percentage: 0.20, rank: 36 },
        { address: 'GYj8DfqHfDacQvhQbstvZMRWduUMu81ptLU7RwvYxgG6', balance: 1010.255, percentage: 0.20, rank: 37 },
        { address: '3UhvFW6b3QoUtJ51TG1QhneYxWJ8sEYUhrchrna3SEzq', balance: 991.990, percentage: 0.19, rank: 38 },
        { address: '8Htve3nXPsvXk88WrJHH6nQBQCjw4bSCJLuEpT6ArfMY', balance: 906.306, percentage: 0.18, rank: 39 },
        { address: 'CKCPbSG7Zre8mN8Xar9NoEMjeKfozJ7Lip14cSv2BTHR', balance: 895.012, percentage: 0.17, rank: 40 },
        { address: '4JvDtKc7cy3pyi2SSfXTtHy1XJbSX8hcZfUKRwC9s2HZ', balance: 891.036, percentage: 0.17, rank: 41 }
    ];

    cachedRichList = fallbackAddresses;
    richListCacheTimestamp = now;
    console.log(`⚡ Using fallback rich list with ${fallbackAddresses.length} verified addresses`);
    return fallbackAddresses;
}

/**
 * Get verified high-SOL creator wallet addresses from live rich list
 */
export async function fetchHighSolWallets(): Promise<string[]> {
    console.log('🌐 Fetching live high-SOL wallet addresses...');

    try {
        const richList = await fetchSolanaRichList();

        // Filter out known exchanges and institutional addresses
        const individualWallets = richList
            .filter(entry => !EXCHANGE_ADDRESSES.has(entry.address))
            .filter(entry => (entry.balance || 0) >= 100) // Only wallets with 100+ SOL
            .sort((a, b) => (b.balance || 0) - (a.balance || 0)) // Sort by balance descending
            .slice(0, 50) // Take top 50 individual wallets
            .map(entry => entry.address);

        // Add known active whale addresses that are reliably funded
        const knownActiveWhales = [
            '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', // Known large holder
            'C8BSJt7GVYZNpkLTM9rHFzh1VQm14bYQPQFS77NSSugG', // Verified active whale
            'A3p5D4YCT2Sy89kqcx3M5FBcm69JYBMmwrk3dxtCFNrk', // Large SOL holder
            'APhKPyKNZXK4k2M1sCfTsXJL8YmKBaLNnHRuDHJ9Lqe5', // Active trader
            'ETn4MZx1ZLNP3XVVp1KvYzFJrP4qNHGWJp1oJJKMNhUg'  // Known whale
        ];

        // Combine and deduplicate
        const allWallets = [...new Set([...individualWallets, ...knownActiveWhales])];

        console.log(`✅ Found ${allWallets.length} potential individual high-SOL wallets`);
        return allWallets;
    } catch (error) {
        console.error('Error fetching rich list:', error);

        // Return reliable fallback addresses that we know have balances
        return [
            'C8BSJt7GVYZNpkLTM9rHFzh1VQm14bYQPQFS77NSSugG', // Verified ~1.7M SOL
            '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', // Known whale
            'A3p5D4YCT2Sy89kqcx3M5FBcm69JYBMmwrk3dxtCFNrk', // Large holder  
            'APhKPyKNZXK4k2M1sCfTsXJL8YmKBaLNnHRuDHJ9Lqe5', // Active trader
            'ETn4MZx1ZLNP3XVVp1KvYzFJrP4qNHGWJp1oJJKMNhUg'  // Backup whale
        ];
    }
}

/**
 * Get balance for a single wallet address with caching
 */
export async function getWalletBalance(
    connection: Connection,
    address: string
): Promise<WalletInfo | null> {
    try {
        // Check cache first
        const cached = balanceCache.get(address);
        const now = Date.now();

        if (cached && (now - cached.timestamp) < BALANCE_CACHE_DURATION) {
            const balance = cached.balance;
            return {
                address,
                balance,
                lamports: balance * LAMPORTS_PER_SOL,
                formattedBalance: balance.toFixed(4),
                isValidCreator: balance >= 0.1,
            };
        }

        const publicKey = new PublicKey(address);
        const lamports = await connection.getBalance(publicKey);
        const balance = lamports / LAMPORTS_PER_SOL;

        // Cache the result
        balanceCache.set(address, { balance, timestamp: now });

        return {
            address,
            balance,
            lamports,
            formattedBalance: balance.toFixed(4),
            isValidCreator: balance >= 0.1,
        };
    } catch (error) {
        console.error(`Error fetching balance for ${address}:`, error);
        return null;
    }
}

/**
 * Get balances for multiple wallet addresses
 */
export async function getMultipleWalletBalances(
    connection: Connection,
    addresses: string[]
): Promise<WalletInfo[]> {
    const results = await Promise.allSettled(
        addresses.map(address => getWalletBalance(connection, address))
    );

    return results
        .map(result => result.status === 'fulfilled' ? result.value : null)
        .filter((wallet): wallet is WalletInfo => wallet !== null);
}

/**
 * Scan for high-SOL wallets using verified addresses only
 */
export async function scanForHighSolWallets(
    connection: Connection,
    options: WalletScanOptions = {}
): Promise<WalletInfo[]> {
    const {
        minBalance = 10, // default minimum 10 SOL
        maxResults = 30,
        sortByBalance = true,
    } = options;

    console.log(`🔍 Scanning verified wallets with at least ${minBalance} SOL...`);

    // Get verified wallet addresses
    const walletAddresses = await fetchHighSolWallets();
    console.log(`📋 Got ${walletAddresses.length} wallet addresses to check`);

    // Get balances for all wallets
    const walletInfos = await getMultipleWalletBalances(connection, walletAddresses);
    console.log(`📊 Successfully checked ${walletInfos.length} verified wallet balances`);

    // Log balance distribution for debugging
    const zeroBalance = walletInfos.filter(w => w.balance === 0).length;
    const lowBalance = walletInfos.filter(w => w.balance > 0 && w.balance < minBalance).length;
    const goodBalance = walletInfos.filter(w => w.balance >= minBalance).length;

    console.log(`💰 Balance distribution: ${zeroBalance} zero, ${lowBalance} low (<${minBalance} SOL), ${goodBalance} good (>=${minBalance} SOL)`);

    // Filter by minimum balance
    let filteredWallets = walletInfos.filter(wallet => wallet.balance >= minBalance);
    console.log(`💰 Found ${filteredWallets.length} wallets with at least ${minBalance} SOL`);

    // If no wallets meet the criteria, lower the threshold and try again
    if (filteredWallets.length === 0 && minBalance > 1) {
        console.log(`⚠️ No wallets found with ${minBalance} SOL, trying with 1 SOL minimum...`);
        filteredWallets = walletInfos.filter(wallet => wallet.balance >= 1);
        console.log(`💰 Found ${filteredWallets.length} wallets with at least 1 SOL`);
    }

    // If still no wallets, take any with >0 balance
    if (filteredWallets.length === 0) {
        console.log(`⚠️ No wallets found with 1 SOL, taking any with >0 balance...`);
        filteredWallets = walletInfos.filter(wallet => wallet.balance > 0);
        console.log(`💰 Found ${filteredWallets.length} wallets with any balance`);
    }

    // Sort by balance if requested
    if (sortByBalance) {
        filteredWallets.sort((a, b) => b.balance - a.balance);
    }

    // Limit results
    const result = filteredWallets.slice(0, maxResults);
    console.log(`🎯 Returning top ${result.length} wallets`);

    // Log the top results for debugging
    result.slice(0, 5).forEach((wallet, i) => {
        console.log(`${i + 1}. ${wallet.address.slice(0, 8)}...${wallet.address.slice(-8)}: ${wallet.formattedBalance} SOL`);
    });

    return result;
}

/**
 * Validate if a wallet address is a good candidate for creator metadata
 */
export async function validateCreatorWallet(
    connection: Connection,
    address: string
): Promise<{
    isValid: boolean;
    balance: number;
    reason?: string;
}> {
    try {
        const walletInfo = await getWalletBalance(connection, address);

        if (!walletInfo) {
            return {
                isValid: false,
                balance: 0,
                reason: 'Invalid wallet address or network error',
            };
        }

        if (walletInfo.balance < 0.1) {
            return {
                isValid: false,
                balance: walletInfo.balance,
                reason: 'Wallet balance too low (minimum 0.1 SOL required)',
            };
        }

        return {
            isValid: true,
            balance: walletInfo.balance,
        };
    } catch (error) {
        return {
            isValid: false,
            balance: 0,
            reason: 'Error validating wallet address',
        };
    }
}

/**
 * Search for wallets with balance in a specific range
 */
export async function findWalletsInRange(
    connection: Connection,
    minSOL: number,
    maxSOL: number,
    maxResults: number = 10
): Promise<WalletInfo[]> {
    console.log(`🔍 Searching for wallets with ${minSOL} - ${maxSOL} SOL`);

    // Get verified wallets and scan them
    const allWallets = await scanForHighSolWallets(connection, {
        minBalance: 0, // Get all wallets first, then filter
        maxResults: 100,
        sortByBalance: true,
    });

    console.log(`📊 Retrieved ${allWallets.length} wallets with balances`);

    // Log all wallet balances for debugging
    allWallets.forEach(wallet => {
        console.log(`💰 ${wallet.address.slice(0, 8)}...${wallet.address.slice(-8)}: ${wallet.balance.toFixed(4)} SOL`);
    });

    // Filter by balance range
    const filteredWallets = allWallets
        .filter(wallet => {
            const inRange = wallet.balance >= minSOL && wallet.balance <= maxSOL;
            if (!inRange) {
                console.log(`❌ Excluding ${wallet.address.slice(0, 8)}... (${wallet.balance.toFixed(4)} SOL - outside range)`);
            } else {
                console.log(`✅ Including ${wallet.address.slice(0, 8)}... (${wallet.balance.toFixed(4)} SOL - in range)`);
            }
            return inRange;
        })
        .sort((a, b) => b.balance - a.balance) // Sort by balance descending
        .slice(0, maxResults);

    console.log(`🎯 Returning ${filteredWallets.length} wallets in range`);
    return filteredWallets;
}

/**
 * Get suggested creator wallets for token creation
 */
export async function getSuggestedCreatorWallets(
    connection: Connection
): Promise<WalletInfo[]> {
    console.log(`🎯 Getting suggested creator wallets...`);

    // Get wallets with real-time balance checking
    const allWallets = await scanForHighSolWallets(connection, {
        minBalance: 1, // at least 1 SOL for credibility
        maxResults: 25,
        sortByBalance: true,
    });

    console.log(`📊 Retrieved ${allWallets.length} potential creator wallets`);

    // Return top wallets sorted by balance
    const suggestedWallets = allWallets
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 15);

    console.log(`✅ Returning ${suggestedWallets.length} suggested creator wallets`);
    return suggestedWallets;
}

/**
 * Add a wallet address to the local tracking (for future enhancement)
 */
export function addToCuratedList(address: string, isCreator: boolean = false) {
    console.log(`📝 Adding ${address} to local tracking (${isCreator ? 'creator' : 'high-SOL'} wallet)`);
    // This could be enhanced to persist to local storage or a database
    // For now, it just logs the action
} 