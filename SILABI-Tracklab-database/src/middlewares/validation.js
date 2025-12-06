function validateRegistration(req, res, next) {
  const { full_name, email, username, password, confirmPassword, role } = req.body;
  
  if (!full_name || full_name.trim() === '') {
    return res.status(400).json({ error: 'Full name is required' });
  }
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  
  if (!username || username.trim() === '') {
    return res.status(400).json({ error: 'Username is required' });
  }
  
  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }
  
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }
  
  const validRoles = ['user', 'admin', 'technician'];
  if (role && !validRoles.includes(role.toLowerCase())) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  
  next();
}

function validateLogin(req, res, next) {
  const { username, password } = req.body;
  
  if (!username || username.trim() === '') {
    return res.status(400).json({ error: 'Username or email is required' });
  }
  
  if (!password || password.trim() === '') {
    return res.status(400).json({ error: 'Password is required' });
  }
  
  next();
}

function validateUser(req, res, next) {
  const { email, password } = req.body;
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  
  if (password && password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  next();
}

function validateAsset(req, res, next) {
  const { nama_aset, status_aset } = req.body;
  
  if (!nama_aset || nama_aset.trim() === '') {
    return res.status(400).json({ error: 'Asset name is required' });
  }
  
  if (!status_aset || status_aset.trim() === '') {
    return res.status(400).json({ error: 'Asset status is required' });
  }
  
  const validStatuses = ['Tersedia', 'Dipinjam', 'Dalam Perbaikan'];
  if (!validStatuses.includes(status_aset)) {
    return res.status(400).json({ error: 'Invalid status. Must be: Tersedia, Dipinjam, or Dalam Perbaikan' });
  }
  
  next();
}

validateRequest = (req, res, next) => {
  const {
    asset_id,
    user_id,
    request_type,
    status,
    request_date
  } = req.body;
  
  if (!asset_id || !user_id || !request_type || !status || !request_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const validRequestTypes = ['borrow', 'return'];
  if (!validRequestTypes.includes(request_type)) {
    return res.status(400).json({ error: 'Invalid request type' });
  }

  next();
};

module.exports = { 
  validateRegistration, 
  validateLogin, 
  validateUser, 
  validateAsset,
  validateRequest
};