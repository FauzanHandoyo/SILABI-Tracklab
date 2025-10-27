const pool = require('../../db');

async function create(data) {
  const { nama_aset, status_aset, peminjam, latitude, longitude, status_hilang } = data;
  const q = `INSERT INTO aset_inventaris (nama_aset, status_aset, peminjam, latitude, longitude, status_hilang)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
  const lat = latitude == null ? null : parseFloat(latitude);
  const lon = longitude == null ? null : parseFloat(longitude);
  const { rows } = await pool.query(q, [
    nama_aset,
    status_aset,
    peminjam || null,
    Number.isNaN(lat) ? null : lat,
    Number.isNaN(lon) ? null : lon,
    !!status_hilang,
  ]);
  return rows[0];
}

async function findAll() {
  const { rows } = await pool.query('SELECT * FROM aset_inventaris ORDER BY id');
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM aset_inventaris WHERE id = $1', [id]);
  return rows[0];
}

async function updateById(id, data) {
  const fields = [];
  const vals = [];
  let idx = 1;

  for (const key of ['nama_aset','status_aset','peminjam','latitude','longitude','status_hilang']) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      if (key === 'latitude' || key === 'longitude') {
        const v = data[key] == null ? null : parseFloat(data[key]);
        vals.push(Number.isNaN(v) ? null : v);
      } else if (key === 'status_hilang') {
        vals.push(!!data[key]);
      } else {
        vals.push(data[key]);
      }
      fields.push(`${key} = $${idx}`);
      idx++;
    }
  }
  if (fields.length === 0) return findById(id);

  const q = `UPDATE aset_inventaris SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
  vals.push(id);
  const { rows } = await pool.query(q, vals);
  return rows[0];
}

async function deleteById(id) {
  const { rows } = await pool.query('DELETE FROM aset_inventaris WHERE id = $1 RETURNING *', [id]);
  return rows[0];
}

module.exports = { create, findAll, findById, updateById, deleteById };