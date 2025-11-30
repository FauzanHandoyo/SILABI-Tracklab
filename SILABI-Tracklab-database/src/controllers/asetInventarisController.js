const model = require('../models/asetInventarisModel');
const pool = require('../../db');

async function getAllAset(req, res) {
  try {
    const { status, category, location } = req.query;
    
    let asets;
    if (status) {
      asets = await model.getByStatus(status);
    } else if (category) {
      asets = await model.getByCategory(category);
    } else if (location) {
      asets = await model.getByLocation(location);
    } else {
      asets = await model.getAll();
    }
    
    res.json(asets);
  } catch (err) {
    console.error('Error fetching assets:', err);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
}

async function getAsetById(req, res) {
  try {
    const { id } = req.params;
    const aset = await model.getById(id);
    
    if (!aset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json(aset);
  } catch (err) {
    console.error('Error fetching asset:', err);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
}

async function createAset(req, res) {
  try {
    const newAset = await model.create(req.body);
    res.status(201).json(newAset);
  } catch (err) {
    console.error('Error creating asset:', err);
    res.status(500).json({ error: 'Failed to create asset' });
  }
}

async function updateAset(req, res) {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Start transaction
    await client.query('BEGIN');

    // 1. Get old asset data first
    const getQuery = 'SELECT * FROM aset_inventaris WHERE id = $1';
    const oldAssetResult = await client.query(getQuery, [id]);

    if (oldAssetResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Asset not found' });
    }

    const oldAsset = oldAssetResult.rows[0];
    console.log('📋 Old asset data:', oldAsset);

    // 2. Determine what changed BEFORE updating
    const changes = [];

    // Check status change
    if (updateData.status_aset !== undefined && oldAsset.status_aset !== updateData.status_aset) {
      changes.push({
        type: 'status_change',
        old_status: oldAsset.status_aset,
        new_status: updateData.status_aset
      });
      console.log(`🔄 Status change detected: ${oldAsset.status_aset} → ${updateData.status_aset}`);
    }

    // Check location change
    if (updateData.location !== undefined && oldAsset.location !== updateData.location) {
      changes.push({
        type: 'location_change',
        old_location: oldAsset.location,
        new_location: updateData.location
      });
      console.log(`📍 Location change detected: ${oldAsset.location} → ${updateData.location}`);
    }

    // Check category change
    if (updateData.category !== undefined && oldAsset.category !== updateData.category) {
      changes.push({
        type: 'category_change',
        old_value: oldAsset.category,
        new_value: updateData.category
      });
      console.log(`📂 Category change detected: ${oldAsset.category} → ${updateData.category}`);
    }

    // Check assigned_to change
    if (updateData.assigned_to !== undefined && oldAsset.assigned_to !== updateData.assigned_to) {
      changes.push({
        type: 'assignment_change',
        old_value: oldAsset.assigned_to,
        new_value: updateData.assigned_to
      });
      console.log(`👤 Assignment change detected: ${oldAsset.assigned_to} → ${updateData.assigned_to}`);
    }

    // 3. Build dynamic update query
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });

    // Add last_updated
    fields.push(`last_updated = CURRENT_TIMESTAMP`);
    values.push(id);

    const updateQuery = `
      UPDATE aset_inventaris 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    console.log('🔍 Updating asset:', id);
    console.log('📝 New values:', updateData);

    const updateResult = await client.query(updateQuery, values);
    const updatedAsset = updateResult.rows[0];

    console.log('✅ Database UPDATE successful');
    console.log('📊 Rows affected:', updateResult.rowCount);
    console.log('✅ Updated data:', updatedAsset);

    // 4. Create history records for each change
    if (changes.length > 0) {
      console.log(`📝 Creating ${changes.length} history record(s)...`);
      
      for (const change of changes) {
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
          change.type,
          change.old_status || change.old_value || null,
          change.new_status || change.new_value || null,
          change.old_location || null,
          change.new_location || null,
          null // No RSSI for manual updates
        ]);

        console.log('✅ [History] Created log:', historyResult.rows[0]);
        console.log('   Asset:', updatedAsset.nama_aset);
        console.log('   Type:', change.type);
        console.log('   Change:', `${change.old_status || change.old_value || 'N/A'} → ${change.new_status || change.new_value || 'N/A'}`);
      }

      // 5. Create notification for status changes
      if (changes.some(c => c.type === 'status_change')) {
        try {
          const statusChange = changes.find(c => c.type === 'status_change');
          
          let notifTitle = '';
          let notifMessage = '';
          let notifType = 'info';

          if (statusChange.new_status === 'Hilang') {
            notifTitle = '⚠️ Asset Status Changed';
            notifMessage = `Asset "${updatedAsset.nama_aset}" status changed to Missing`;
            notifType = 'warning';
          } else if (statusChange.new_status === 'Tersedia' && statusChange.old_status === 'Hilang') {
            notifTitle = '✅ Asset Status Changed';
            notifMessage = `Asset "${updatedAsset.nama_aset}" is now Available`;
            notifType = 'success';
          } else if (statusChange.new_status === 'Dalam Perbaikan') {
            notifTitle = '🔧 Asset Under Maintenance';
            notifMessage = `Asset "${updatedAsset.nama_aset}" is now under maintenance`;
            notifType = 'warning';
          } else if (statusChange.new_status === 'Dipinjam') {
            notifTitle = '📤 Asset Borrowed';
            notifMessage = `Asset "${updatedAsset.nama_aset}" has been borrowed`;
            notifType = 'info';
          } else {
            notifTitle = 'ℹ️ Asset Status Changed';
            notifMessage = `Asset "${updatedAsset.nama_aset}" status: ${statusChange.old_status} → ${statusChange.new_status}`;
            notifType = 'info';
          }

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
              $3,
              false,
              NOW()
            FROM users u
            WHERE u.role IN ('admin', 'staff')
          `;

          await client.query(notificationQuery, [notifTitle, notifMessage, notifType]);
          console.log('🔔 [Notification] Created status change alert');
        } catch (notifError) {
          console.log('⚠️ [Notification] Skipped:', notifError.message);
        }
      }
    } else {
      console.log('ℹ️ [History] No significant changes detected');
    }

    // Commit transaction
    await client.query('COMMIT');

    res.json(updatedAsset);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating asset:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ error: 'Failed to update asset', details: err.message });
  } finally {
    client.release();
  }
}

async function deleteAset(req, res) {
  try {
    const { id } = req.params;
    const deletedAset = await model.deleteById(id);
    
    if (!deletedAset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json({ message: 'Asset deleted successfully', asset: deletedAset });
  } catch (err) {
    console.error('Error deleting asset:', err);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
}

async function getStats(req, res) {
  try {
    const allAssets = await model.getAll();
    
    const stats = {
      total: allAssets.length,
      available: allAssets.filter(a => a.status_aset === 'Tersedia').length,
      inUse: allAssets.filter(a => a.status_aset === 'Dipinjam').length,
      inRepair: allAssets.filter(a => a.status_aset === 'Dalam Perbaikan').length,
      missing: allAssets.filter(a => a.status_hilang === true).length,
      byCategory: {},
      byLocation: {}
    };
    
    // Count by category
    allAssets.forEach(asset => {
      if (asset.category) {
        stats.byCategory[asset.category] = (stats.byCategory[asset.category] || 0) + 1;
      }
    });
    
    // Count by location
    allAssets.forEach(asset => {
      if (asset.location) {
        stats.byLocation[asset.location] = (stats.byLocation[asset.location] || 0) + 1;
      }
    });
    
    res.json(stats);
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
}

module.exports = {
  getAllAset,
  getAsetById,
  createAset,
  updateAset,
  deleteAset,
  getStats
};