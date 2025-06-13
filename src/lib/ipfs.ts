// IPFS Gateway configuration
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

/**
 * Convert IPFS CID to HTTPS gateway URL for better compatibility
 * @param cid - The IPFS Content Identifier
 * @returns HTTPS gateway URL
 */
export function convertToHttpsGateway(cid: string): string {
    // Remove ipfs:// prefix if present
    const cleanCid = cid.replace(/^ipfs:\/\//, '');
    return `${IPFS_GATEWAY}${cleanCid}`;
} 