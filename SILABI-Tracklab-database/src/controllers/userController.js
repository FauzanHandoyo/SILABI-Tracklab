const model = require('../models/userModel');
const bcrypt = require('bcryptjs');

async function register(req, res) {
  try {
    const { full_name, email, username, password, role } = req.body;
    
    // Check if email already exists
    const existingEmail = await model.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Check if username already exists
    const existingUsername = await model.findByUsername(username);
    if (existingUsername) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await model.create({
      full_name,
      email,
      username,
      password: hashedPassword,
      role: role?.toLowerCase() || 'user'
    });
    
    res.status(201).json({
      message: 'User registered successfully',
      user
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message });
  }
}

async function createUser(req, res) {
  try {
    const userData = { ...req.body };
    
    // Hash password if provided
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    
    const user = await model.create(userData);
    res.status(201).json(user);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email or username already exists' });
    }
    res.status(500).json({ error: err.message });
  }
}

async function getAllUsers(req, res) {
  try {
    const rows = await model.findAll();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getUserById(req, res) {
  try {
    const user = await model.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateUser(req, res) {
  try {
    const userData = { ...req.body };
    
    // Hash password if being updated
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    
    const user = await model.updateById(req.params.id, userData);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteUser(req, res) {
  try {
    const user = await model.deleteById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ deleted: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { register, createUser, getAllUsers, getUserById, updateUser, deleteUser };