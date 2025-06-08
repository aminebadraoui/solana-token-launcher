import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

// Database setup
async function getDb() {
    const dbPath = path.join(process.cwd(), 'tokens.db');

    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
    });

    // Create table if it doesn't exist
    await db.exec(`
    CREATE TABLE IF NOT EXISTS token_creations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_address TEXT NOT NULL,
      token_mint TEXT NOT NULL,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      supply INTEGER NOT NULL,
      decimals INTEGER NOT NULL,
      description TEXT,
      metadata_uri TEXT,
      signature TEXT,
      revoke_mint_auth BOOLEAN DEFAULT FALSE,
      revoke_freeze_auth BOOLEAN DEFAULT FALSE,
      revoke_update_auth BOOLEAN DEFAULT FALSE,
      custom_creator BOOLEAN DEFAULT FALSE,
      creator_address TEXT,
      timestamp TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    return db;
}

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        const {
            walletAddress,
            tokenMint,
            name,
            symbol,
            supply,
            decimals,
            description,
            metadataUri,
            signature,
            options,
            creatorAddress,
            timestamp,
        } = data;

        // Validate required fields
        if (!walletAddress || !tokenMint || !name || !symbol) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate creator address if custom creator is enabled
        if (options?.customCreator && !creatorAddress) {
            return NextResponse.json(
                { error: 'Creator address is required when custom creator is enabled' },
                { status: 400 }
            );
        }

        const db = await getDb();

        // Insert token creation record
        const result = await db.run(
            `INSERT INTO token_creations (
        wallet_address,
        token_mint,
        name,
        symbol,
        supply,
        decimals,
        description,
        metadata_uri,
        signature,
        revoke_mint_auth,
        revoke_freeze_auth,
        revoke_update_auth,
        custom_creator,
        creator_address,
        timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                walletAddress,
                tokenMint,
                name,
                symbol,
                supply,
                decimals,
                description || '',
                metadataUri || '',
                signature || '',
                options?.revokeMintAuth || false,
                options?.revokeFreezeAuth || false,
                options?.revokeUpdateAuth || false,
                options?.customCreator || false,
                creatorAddress || null,
                timestamp,
            ]
        );

        await db.close();

        return NextResponse.json({
            success: true,
            id: result.lastID,
            message: 'Token creation logged successfully',
        });
    } catch (error) {
        console.error('Error logging token creation:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const wallet = url.searchParams.get('wallet');
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        const db = await getDb();

        let query = `
      SELECT 
        id, wallet_address, token_mint, name, symbol, supply, decimals,
        description, metadata_uri, signature,
        revoke_mint_auth, revoke_freeze_auth, revoke_update_auth, custom_creator,
        creator_address, timestamp, created_at
      FROM token_creations
    `;
        const params: any[] = [];

        if (wallet) {
            query += ' WHERE wallet_address = ?';
            params.push(wallet);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const tokens = await db.all(query, params);

        await db.close();

        return NextResponse.json({
            success: true,
            tokens,
            count: tokens.length,
        });
    } catch (error) {
        console.error('Error fetching token creations:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 