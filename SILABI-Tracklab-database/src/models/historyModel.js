const pool = require('../../db');

async function getAll(filters = {}) {
  let query = `
    SELECT 
      h.id,
      h.asset_id,
      h.event_type,
      h.old_status,
      h.new_status,
      h.old_location,
      h.new_location,
      h.rssi,
      h.latitude,
      h.longitude,
      h.changed_by,
      h.timestamp,
      a.nama_aset,
      a.category
    FROM asset_history h
    LEFT JOIN aset_inventaris a ON h.asset_id = a.id
    WHERE 1=1
  `;
  
  const values = [];
  let paramCount = 1;

  if (filters.asset_id) {
    query += ` AND h.asset_id = $${paramCount}`;
    values.push(filters.asset_id);
    paramCount++;
  }

  if (filters.days) {
    query += ` AND h.timestamp >= NOW() - INTERVAL '${parseInt(filters.days)} days'`;
  }

  if (filters.event_type) {
    query += ` AND h.event_type = $${paramCount}`;
    values.push(filters.event_type);
    paramCount++;
  }

  query += ' ORDER BY h.timestamp DESC';

  if (filters.limit) {
    query += ` LIMIT ${parseInt(filters.limit)}`;
  }

  const result = await pool.query(query, values);
  return result.rows;
}

async function getById(id) {
  const query = `
    SELECT 
      h.*,
      a.nama_aset,
      a.category
    FROM asset_history h
    LEFT JOIN aset_inventaris a ON h.asset_id = a.id
    WHERE h.id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
}

async function create(data) {
  const {
    asset_id,
    event_type,
    old_status,
    new_status,
    old_location,
    new_location,
    rssi,
    latitude,
    longitude,
    changed_by
  } = data;

  const query = `
    INSERT INTO asset_history (
      asset_id,
      event_type,
      old_status,
      new_status,
      old_location,
      new_location,
      rssi,
      latitude,
      longitude,
      changed_by,
      timestamp
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
    RETURNING *
  `;

  const values = [
    asset_id,
    event_type,
    old_status || null,
    new_status || null,
    old_location || null,
    new_location || null,
    rssi || null,
    latitude || null,
    longitude || null,
    changed_by || null
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

async function getByAssetId(assetId, limit = 50) {
  const query = `
    SELECT 
      h.*,
      a.nama_aset,
      a.category
    FROM asset_history h
    LEFT JOIN aset_inventaris a ON h.asset_id = a.id
    WHERE h.asset_id = $1
    ORDER BY h.timestamp DESC
    LIMIT $2
  `;
  const result = await pool.query(query, [assetId, limit]);
  return result.rows;
}

module.exports = {
  getAll,
  getById,
  create,
  getByAssetId
};