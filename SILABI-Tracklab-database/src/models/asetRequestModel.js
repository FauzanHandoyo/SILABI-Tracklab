const pool = require('../../db');

async function getAllRequests(filters = {}) {
  let query = `
    SELECT 
      ar.id,
      ar.asset_id,
      ar.user_id,
      u.full_name AS user_name,
      a.nama_aset AS asset_name,
      ar.request_type,
      ar.status,
      ar.request_date,
      ar.approval_date,
      ar.return_date,
      ar.notes
    FROM aset_requests ar
    JOIN users u ON ar.user_id = u.id
    JOIN aset_inventaris a ON ar.asset_id = a.id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;
  if (filters.status) {
    query += ` AND ar.status = $${paramIndex++}`;
    params.push(filters.status);
  }
  if (filters.asset_id) {
    query += ` AND ar.asset_id = $${paramIndex++}`;
    params.push(filters.asset_id);
  }
  if (filters.user_id) {
    query += ` AND ar.user_id = $${paramIndex++}`;
    params.push(filters.user_id);
  }
  query += ' ORDER BY ar.id ASC';
  const result = await pool.query(query, params);
  return result.rows;
}

async function getRequestById(id) {
    const query = `
    SELECT
      id,
      asset_id,
      user_id,
        request_type,
        status,
        request_date,
        approval_date,
        return_date,
        notes
    FROM aset_requests
    WHERE id = $1
  `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
}  

async function createRequest(data) {
    const {
        asset_id,
        user_id,
        request_type,
        status,
        request_date,
        approval_date,
        return_date,
        notes
    } = data;

    const query = `
    INSERT INTO aset_requests (
      asset_id,
        user_id,
        request_type,
        status,
        request_date,
        approval_date,
        return_date,
        notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;
    const values = [
        asset_id,
        user_id,
        request_type,
        status,
        request_date,
        approval_date,
        return_date,
        notes
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
}

async function updateRequest(id, data) {
    const {
        asset_id,
        user_id,
        request_type,
        status,
        request_date,
        approval_date,
        return_date,
        notes
    } = data;   

    const query = `
    UPDATE aset_requests
    SET
        asset_id = $1,
        user_id = $2,
        request_type = $3,
        status = $4,
        request_date = $5,
        approval_date = $6,
        return_date = $7,
        notes = $8
    WHERE id = $9
    RETURNING *;
  `;
    const values = [
        asset_id,
        user_id,
        request_type,
        status,
        request_date,
        approval_date,
        return_date,
        notes,
        id
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
}   

async function deleteRequest(id) {
    const query = `
    DELETE FROM aset_requests
    WHERE id = $1
    RETURNING *;
  `;
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
}

async function approveRequest(id) {
    const query = `
    UPDATE aset_requests
    SET status = 'Approved',
        approval_date = NOW()
    WHERE id = $1
    RETURNING *;
  `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
}

async function denyRequest(id) {
    const query = `
    UPDATE aset_requests
    SET status = 'Denied',
        approval_date = NOW()
    WHERE id = $1
    RETURNING *;
  `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
}

module.exports = {
    getAllRequests,
    getRequestById,
    createRequest,
    updateRequest,
  deleteRequest,
  approveRequest,
  denyRequest
};