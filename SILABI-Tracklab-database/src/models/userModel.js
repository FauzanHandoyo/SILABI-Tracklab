const pool = require('../../db');

async function create(data) {
  const { email, password, full_name, role } = data;
  const q = `INSERT INTO users (email, password, full_name, role)
             VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role, is_active, email_verified, created_at`;
  const { rows } = await pool.query(q, [
    email,
    password, // TODO: hash with bcrypt before storing
    full_name || null,
    role || 'user'
  ]);
  return rows[0];
}

async function findAll() {
  const { rows } = await pool.query(
    'SELECT id, email, full_name, role, is_active, email_verified, created_at, last_login FROM users ORDER BY id'
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT id, email, full_name, role, is_active, email_verified, created_at, last_login FROM users WHERE id = $1',
    [id]
  );
  return rows[0];
}

async function findByEmail(email) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return rows[0];
}

async function updateById(id, data) {
  const fields = [];
  const vals = [];
  let idx = 1;

  for (const key of ['email', 'password', 'full_name', 'role', 'is_active', 'email_verified', 'last_login']) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      fields.push(`${key} = $${idx}`);
      vals.push(data[key]);
      idx++;
    }
  }
  
  if (fields.length === 0) return findById(id);

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  const q = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, email, full_name, role, is_active, email_verified, created_at, updated_at`;
  vals.push(id);
  const { rows } = await pool.query(q, vals);
  return rows[0];
}

async function deleteById(id) {
  const { rows } = await pool.query(
    'DELETE FROM users WHERE id = $1 RETURNING id, email, full_name',
    [id]
  );
  return rows[0];
}

module.exports = { create, findAll, findById, findByEmail, updateById, deleteById };