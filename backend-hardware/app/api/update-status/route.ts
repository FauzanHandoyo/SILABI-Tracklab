import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, status } = body;

    if (!nama || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: nama and status' },
        { status: 400 }
      );
    }

    console.log('📥 [Hardware API] Received:', { nama, status });

    const status_hilang = status === 'HILANG/PINDAH';
    const status_aset = status === 'DI TEMPAT' ? 'Tersedia' : 'Hilang';

    const query = `
      UPDATE aset_inventaris 
      SET 
        status_hilang = $1,
        status_aset = $2,
        last_updated = CURRENT_TIMESTAMP
      WHERE nama_aset = $3
      RETURNING *
    `;
    
    console.log('🔍 Updating asset:', nama);
    console.log('📝 New values:', { status_hilang, status_aset });
    
    const result = await pool.query(query, [status_hilang, status_aset, nama]);

    console.log('📊 Rows affected:', result.rowCount);
    console.log('✅ Updated data:', result.rows[0]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Asset not found', nama },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Status updated successfully',
        data: result.rows[0]
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  } catch (error: any) {
    console.error('❌ [Hardware API] Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Database error', details: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}