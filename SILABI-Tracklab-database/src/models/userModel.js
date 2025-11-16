const pool = require('../../db');
const bcrypt = require('bcrypt');

async function create(data) {
  const { full_name, email, username, password, role } = data;
  
  // Hash password before storing
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const q = `INSERT INTO users (full_name, email, username, password, role)
             VALUES ($1, $2, $3, $4, $5) RETURNING id, full_name, email, username, role, is_active, email_verified, created_at`;
  const { rows } = await pool.query(q, [
    full_name,
    email,
    username,
    hashedPassword, // Use hashed password instead of plain text
    role || 'user'
  ]);
  return rows[0];
}

async function findAll() {
  const { rows } = await pool.query(
    'SELECT id, full_name, email, username, role, is_active, email_verified, created_at, last_login FROM users ORDER BY id'
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT id, full_name, email, username, role, is_active, email_verified, created_at, last_login FROM users WHERE id = $1',
    [id]
  );
  return rows[0];
}

async function findByIdWithPassword(id) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE id = $1',
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

async function findByUsername(username) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE username = $1',
    [username]
  );
  return rows[0];
}

async function updateById(id, data) {
  const fields = [];
  const vals = [];
  let idx = 1;

  for (const key of ['full_name', 'email', 'username', 'password', 'role', 'is_active', 'email_verified', 'last_login']) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      fields.push(`${key} = $${idx}`);
      vals.push(data[key]);
      idx++;
    }
  }
  
  if (fields.length === 0) return findById(id);

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  const q = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, full_name, email, username, role, is_active, email_verified, created_at, updated_at`;
  vals.push(id);
  const { rows } = await pool.query(q, vals);
  return rows[0];
}

async function deleteById(id) {
  const { rows } = await pool.query(
    'DELETE FROM users WHERE id = $1 RETURNING id, full_name, email, username',
    [id]
  );
  return rows[0];
}

module.exports = { 
  create, 
  findAll, 
  findById, 
  findByIdWithPassword,
  findByEmail, 
  findByUsername, 
  updateById, 
  deleteById 
};