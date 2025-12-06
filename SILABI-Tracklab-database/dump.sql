
-- for user table 
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE NOT NULL;

DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- for asset requests
CREATE TABLE aset_requests (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    request_type VARCHAR(50) NOT NULL, -- e.g., 'borrow', 'return'
    status VARCHAR(50) DEFAULT 'pending', -- e.g., 'pending', 'approved', 'denied'
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approval_date TIMESTAMP,
    return_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES aset_inventaris(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_aset_requests_status ON aset_requests(status);
CREATE INDEX idx_aset_requests_user_id ON aset_requests(user_id);
CREATE INDEX idx_aset_requests_asset_id ON aset_requests(asset_id);

-- for asset
CREATE TABLE aset_inventaris (
    id SERIAL PRIMARY KEY,
    nama_aset VARCHAR(255) NOT NULL,
    status_aset VARCHAR(50) NOT NULL, 
    peminjam VARCHAR(255),          
    lokasi_terakhir VARCHAR(255),
    status_hilang BOOLEAN DEFAULT FALSE
);

ALTER TABLE aset_inventaris
DROP COLUMN lokasi_terakhir;

ALTER TABLE aset_inventaris
ADD COLUMN latitude DOUBLE PRECISION;

ALTER TABLE aset_inventaris
ADD COLUMN longitude DOUBLE PRECISION;