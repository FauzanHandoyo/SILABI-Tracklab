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
    const { nama, status, rssi } = body;

    if (!nama || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: nama and status' },
        { status: 400 }
      );
    }

    console.log('[Hardware API] Received:', { nama, status, rssi });

    // Format RSSI as location string
    const rssiLocation = rssi ? `${rssi} dBm` : 'Unknown';
    console.log('[Location] RSSI:', rssiLocation);

    // Check if this is a Gateway boot message
    const isGatewayBoot = nama === 'SILABI_GATEWAY_BOOT';

    if (isGatewayBoot) {
      console.log('[Gateway] Gateway connected');
      
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
        WHERE u.role IN ('admin', 'staff', 'technician')
      `;

      await client.query(notificationQuery, [
        'Gateway Connected',
        `ESP32 Gateway is now online and monitoring assets`
      ]);

      console.log('[Notification] Gateway connection alert created');

      return NextResponse.json(
        { success: true, message: 'Gateway boot registered' },
        {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    const status_hilang = status === 'HILANG/PINDAH';
    const status_aset = status === 'DI TEMPAT' ? 'Tersedia' : 'Hilang';

    await client.query('BEGIN');

    // Get old asset data
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
    console.log('[Update] Old:', { status: oldAsset.status_aset, location: oldAsset.location });

    // Update asset with raw RSSI as location
    const updateQuery = `
      UPDATE aset_inventaris 
      SET 
        status_hilang = $1,
        status_aset = $2,
        location = $3,
        last_updated = CURRENT_TIMESTAMP
      WHERE nama_aset = $4
      RETURNING *
    `;
    
    console.log('[Update] New:', { status: status_aset, location: rssiLocation });
    
    const updateResult = await client.query(updateQuery, [
      status_hilang, 
      status_aset, 
      rssiLocation,
      nama
    ]);
    const updatedAsset = updateResult.rows[0];

    console.log('[Update] Success:', updateResult.rowCount, 'rows');

    // Create history record if status or location changed
    if (oldAsset.status_aset !== status_aset || oldAsset.location !== rssiLocation) {
      const historyQuery = `
        INSERT INTO asset_history (
          asset_id,
          event_type,
          old_status,
          new_status,
          old_location,
          new_location,
          rssi,
          timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `;

      const historyResult = await client.query(historyQuery, [
        updatedAsset.id,
        'hardware_scan',
        oldAsset.status_aset,
        status_aset,
        oldAsset.location,
        rssiLocation,
        rssi || null
      ]);

      console.log('[History] Created:', {
        id: historyResult.rows[0].id,
        asset: updatedAsset.nama_aset,
        status_change: `${oldAsset.status_aset} -> ${status_aset}`,
        rssi_change: `${oldAsset.location || 'Unknown'} -> ${rssiLocation}`
      });

      // Notification if asset went missing
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
          WHERE u.role IN ('admin', 'staff', 'technician')
        `;

        await client.query(notificationQuery, [
          'Asset Missing',
          `Asset "${updatedAsset.nama_aset}" is missing. Last signal: ${rssiLocation}`
        ]);

        console.log('[Notification] Missing asset alert created');
      }

      // Notification if asset found
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
          WHERE u.role IN ('admin', 'staff', 'technician')
        `;

        await client.query(notificationQuery, [
          'Asset Found',
          `Asset "${updatedAsset.nama_aset}" found. Signal strength: ${rssiLocation}`
        ]);

        console.log('[Notification] Asset found alert created');
      }
    } else {
      console.log('[History] No changes detected');
    }

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
    console.error('[Hardware API] Error:', error);
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