const model = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validateEmail, isValidEmailFormat } = require('../services/emailValidator');

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

async function register(req, res) {
  try {
    const { full_name, email, username, password, role } = req.body;
    
    console.log('Registration attempt:', { full_name, email, username, role });
    
    // Basic format validation
    if (!isValidEmailFormat(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }
    
    console.log('Validating email with Verifalia...');
    
    // Verifalia validation
    const validation = await validateEmail(email);
    
    if (!validation.isValid) {
      console.log('Email validation failed:', validation.status);
      return res.status(400).json({ 
        error: 'Email address is invalid or does not exist' 
      });
    }
    
    console.log('Email validation passed');
    
    // Check if email already exists
    const existingEmail = await model.findByEmail(email);
    if (existingEmail) {
      console.log('Email already registered:', email);
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Check if username already exists
    const existingUsername = await model.findByUsername(username);
    if (existingUsername) {
      console.log('Username already taken:', username);
      return res.status(409).json({ error: 'Username already taken' });
    }
    
    // Create user
    const newUser = await model.create({
      full_name,
      email,
      username,
      password,
      role: role || 'user'
    });
    
    console.log('User created successfully:', newUser.id);
    
    // Generate JWT token
    const token = generateToken(newUser);
    
    // Return user data (excluding password)
    const { password: _, ...userData } = newUser;
    
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: userData
    });
    
  } catch (err) {
    console.error('Registration error:', err);
    
    // Handle PostgreSQL unique constraint violation
    if (err.code === '23505') {
      if (err.constraint === 'users_email_key') {
        return res.status(409).json({ error: 'Email already registered' });
      }
      if (err.constraint === 'users_username_key') {
        return res.status(409).json({ error: 'Username already taken' });
      }
    }
    
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
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

module.exports = { register, login, verifyToken };