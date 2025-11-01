const model = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function login(req, res) {
  try {
    const { username, password } = req.body;
    
    console.log('Login attempt:', { username, password: '***' });
    
    // Find user by username or email
    let user = await model.findByUsername(username);
    if (!user) {
      user = await model.findByEmail(username);
    }
    
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('Comparing passwords...');
    console.log('Input password:', password);
    console.log('Stored hash:', user.password);
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    console.log('Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is disabled' });
    }
    
    // Update last login
    await model.updateById(user.id, { last_login: new Date() });
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Return user data (excluding password)
    const { password: _, ...userData } = user;
    
    console.log('Login successful, sending token');
    
    res.json({
      message: 'Login successful',
      token,
      user: userData
    });
    
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
}

async function verifyToken(req, res) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await model.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const { password: _, ...userData } = user;
    res.json({ user: userData });
    
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { login, verifyToken };