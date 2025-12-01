import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function GET(req: NextRequest) {
  try {
    console.log('[Get Asset API] Request received from ESP32');

    const query = `
      SELECT 
        id,
        nama_aset,
        status_aset,
        status_hilang,
        category,
        location,
        last_updated
      FROM aset_inventaris
      ORDER BY id ASC
    `;

    const result = await pool.query(query);

    console.log(`[Get Asset API] Found ${result.rows.length} assets`);

    // Format response for ESP32
    const assets = result.rows.map(asset => ({
      id: asset.id,
      nama_aset: asset.nama_aset,
      status_aset: asset.status_aset,
      status_hilang: asset.status_hilang,
      category: asset.category || '',
      location: asset.location || ''
    }));

    return NextResponse.json(assets, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error: any) {
    console.error('[Get Asset API] Database error:', error);
    return NextResponse.json(
      { error: 'Database error', details: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}