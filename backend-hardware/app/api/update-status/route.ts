import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function POST(req: NextRequest) {
  const client = await pool.connect();
  
  try {
    const body = await req.json();
    const { nama, status, rssi } = body; // Added rssi field

    if (!nama || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: nama and status' },
        { status: 400 }
      );
    }

    console.log('📥 [Hardware API] Received:', { nama, status, rssi });

    const status_hilang = status === 'HILANG/PINDAH';
    const status_aset = status === 'DI TEMPAT' ? 'Tersedia' : 'Hilang';

    // Start transaction
    await client.query('BEGIN');

    // 1. Get old asset data first
    const getAssetQuery = 'SELECT * FROM aset_inventaris WHERE nama_aset = $1';
    const oldAssetResult = await client.query(getAssetQuery, [nama]);

    if (oldAssetResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Asset not found', nama },
        { status: 404 }
      );
    }

    const oldAsset = oldAssetResult.rows[0];
    console.log('📋 Old asset status:', oldAsset.status_aset);

    // 2. Update asset
    const updateQuery = `
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
    
    const updateResult = await client.query(updateQuery, [status_hilang, status_aset, nama]);
    const updatedAsset = updateResult.rows[0];

    console.log('📊 Rows affected:', updateResult.rowCount);
    console.log('✅ Updated data:', updatedAsset);

    // 3. Create history record if status changed
    if (oldAsset.status_aset !== status_aset) {
      const historyQuery = `
        INSERT INTO asset_history (
          asset_id,
          nama_aset,
          event_type,
          old_status,
          new_status,
          rssi,
          timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `;

      const historyResult = await client.query(historyQuery, [
        updatedAsset.id,
        updatedAsset.nama_aset,
        'hardware_scan',
        oldAsset.status_aset,
        status_aset,
        rssi || null
      ]);

      console.log('📝 [History] Created log:', {
        asset: updatedAsset.nama_aset,
        change: `${oldAsset.status_aset} → ${status_aset}`,
        rssi: rssi || 'N/A'
      });

      // 4. Create notification if asset went missing
      if (status_aset === 'Hilang' && oldAsset.status_aset !== 'Hilang') {
        const notificationQuery = `
          INSERT INTO notifications (
            user_id,
            title,
            message,
            type,
            is_read,
            created_at
          )
          SELECT 
            u.id,
            $1,
            $2,
            'warning',
            false,
            NOW()
          FROM users u
          WHERE u.role IN ('admin', 'staff')
        `;

        await client.query(notificationQuery, [
          '⚠️ Asset Missing',
          `Asset "${updatedAsset.nama_aset}" (${updatedAsset.kode_aset}) is now missing!`
        ]);

        console.log('🔔 [Notification] Created missing asset alert');
      }

      // 5. Create notification if asset returned
      if (status_aset === 'Tersedia' && oldAsset.status_aset === 'Hilang') {
        const notificationQuery = `
          INSERT INTO notifications (
            user_id,
            title,
            message,
            type,
            is_read,
            created_at
          )
          SELECT 
            u.id,
            $1,
            $2,
            'success',
            false,
            NOW()
          FROM users u
          WHERE u.role IN ('admin', 'staff')
        `;

        await client.query(notificationQuery, [
          '✅ Asset Found',
          `Asset "${updatedAsset.nama_aset}" (${updatedAsset.kode_aset}) has been found!`
        ]);

        console.log('🔔 [Notification] Created asset found alert');
      }
    } else {
      console.log('ℹ️ [History] No status change, skipping log');
    }

    // Commit transaction
    await client.query('COMMIT');

    return NextResponse.json(
      {
        success: true,
        message: 'Status updated successfully',
        data: updatedAsset
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
    await client.query('ROLLBACK');
    console.error('❌ [Hardware API] Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Database error', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
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