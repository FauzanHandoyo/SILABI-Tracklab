const pool = require('../../db');

async function getAll() {
  const query = `
    SELECT 
      id,
      nama_aset,
      category,
      location,
      status_aset,
      assigned_to,
      peminjam,
      status_hilang,
      latitude,
      longitude,
      last_updated
    FROM aset_inventaris 
    ORDER BY id ASC
  `;
  const result = await pool.query(query);
  return result.rows;
}

async function getById(id) {
  const query = `
    SELECT 
      id,
      nama_aset,
      category,
      location,
      status_aset,
      assigned_to,
      peminjam,
      status_hilang,
      latitude,
      longitude,
      last_updated
    FROM aset_inventaris 
    WHERE id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
}

async function create(data) {
  const { 
    nama_aset, 
    category,
    location,
    status_aset, 
    assigned_to,
    peminjam, 
    status_hilang, 
    latitude, 
    longitude 
  } = data;
  
  const query = `
    INSERT INTO aset_inventaris (
      nama_aset, 
      category,
      location,
      status_aset, 
      assigned_to,
      peminjam, 
      status_hilang, 
      latitude, 
      longitude,
      last_updated
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
    RETURNING *
  `;
  
  const values = [
    nama_aset, 
    category || null,
    location || null,
    status_aset, 
    assigned_to || null,
    peminjam || null, 
    status_hilang || false, 
    latitude || null, 
    longitude || null
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0];
}

async function updateById(id, data) {
  const { 
    nama_aset, 
    category,
    location,
    status_aset, 
    assigned_to,
    peminjam, 
    status_hilang, 
    latitude, 
    longitude 
  } = data;
  
  const query = `
    UPDATE aset_inventaris 
    SET 
      nama_aset = COALESCE($1, nama_aset),
      category = COALESCE($2, category),
      location = COALESCE($3, location),
      status_aset = COALESCE($4, status_aset),
      assigned_to = COALESCE($5, assigned_to),
      peminjam = COALESCE($6, peminjam),
      status_hilang = COALESCE($7, status_hilang),
      latitude = COALESCE($8, latitude),
      longitude = COALESCE($9, longitude),
      last_updated = CURRENT_TIMESTAMP
    WHERE id = $10
    RETURNING *
  `;
  
  const values = [
    nama_aset, 
    category,
    location,
    status_aset, 
    assigned_to,
    peminjam, 
    status_hilang, 
    latitude, 
    longitude, 
    id
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0];
}

async function deleteById(id) {
  const query = 'DELETE FROM aset_inventaris WHERE id = $1 RETURNING *';
  const result = await pool.query(query, [id]);
  return result.rows[0];
}

async function getByStatus(status) {
  const query = `
    SELECT 
      id,
      nama_aset,
      category,
      location,
      status_aset,
      assigned_to,
      peminjam,
      status_hilang,
      latitude,
      longitude,
      last_updated
    FROM aset_inventaris 
    WHERE status_aset = $1
    ORDER BY id ASC
  `;
  const result = await pool.query(query, [status]);
  return result.rows;
}

async function getByCategory(category) {
  const query = `
    SELECT 
      id,
      nama_aset,
      category,
      location,
      status_aset,
      assigned_to,
      peminjam,
      status_hilang,
      latitude,
      longitude,
      last_updated
    FROM aset_inventaris 
    WHERE category = $1
    ORDER BY id ASC
  `;
  const result = await pool.query(query, [category]);
  return result.rows;
}

async function getByLocation(location) {
  const query = `
    SELECT 
      id,
      nama_aset,
      category,
      location,
      status_aset,
      assigned_to,
      peminjam,
      status_hilang,
      latitude,
      longitude,
      last_updated
    FROM aset_inventaris 
    WHERE location = $1
    ORDER BY id ASC
  `;
  const result = await pool.query(query, [location]);
  return result.rows;
}

module.exports = {
  getAll,
  getById,
  create,
  updateById,
  deleteById,
  getByStatus,
  getByCategory,
  getByLocation
};