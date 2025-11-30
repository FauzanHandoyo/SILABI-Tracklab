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
  
  // Build dynamic query based on provided fields
  const updates = [];
  const values = [];
  let paramCount = 1;
  
  if (nama_aset !== undefined) {
    updates.push(`nama_aset = $${paramCount++}`);
    values.push(nama_aset);
  }
  if (category !== undefined) {
    updates.push(`category = $${paramCount++}`);
    values.push(category);
  }
  if (location !== undefined) {
    updates.push(`location = $${paramCount++}`);
    values.push(location);
  }
  if (status_aset !== undefined) {
    updates.push(`status_aset = $${paramCount++}`);
    values.push(status_aset);
  }
  if (assigned_to !== undefined) {
    updates.push(`assigned_to = $${paramCount++}`);
    values.push(assigned_to);
  }
  if (peminjam !== undefined) {
    updates.push(`peminjam = $${paramCount++}`);
    values.push(peminjam);
  }
  if (status_hilang !== undefined) {
    updates.push(`status_hilang = $${paramCount++}`);
    values.push(status_hilang);
  }
  if (latitude !== undefined) {
    updates.push(`latitude = $${paramCount++}`);
    values.push(latitude);
  }
  if (longitude !== undefined) {
    updates.push(`longitude = $${paramCount++}`);
    values.push(longitude);
  }
  
  // Always update timestamp
  updates.push('last_updated = CURRENT_TIMESTAMP');
  
  // Add ID as last parameter
  values.push(id);
  
  // FIX: Check if there are any updates
  if (updates.length === 1) { // Only timestamp
    return await getById(id); // No fields to update, return current data
  }
  
  const query = `
    UPDATE aset_inventaris 
    SET ${updates.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;
  
  console.log('Update query:', query);
  console.log('Update values:', values);
  
  try {
  const result = await pool.query(query, values);
  console.log('Database UPDATE successful');
  console.log('Rows affected:', result.rowCount); // <-- KEY LINE
  console.log('Updated data:', result.rows[0]);
  return result.rows[0];
} catch (error) {
  console.error('Database update error:', error);
  throw error;
}
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