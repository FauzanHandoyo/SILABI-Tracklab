const model = require('../models/userModel');
const bcrypt = require('bcryptjs');

async function register(req, res) {
  try {
    const user = await model.create(req.body);
    res.status(201).json({ 
      message: 'User registered successfully', 
      user 
    });
  } catch (err) {
    if (err.message === 'Email already exists' || err.message === 'Username already exists') {
      return res.status(400).json({ error: err.message });
    }
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
}

async function createUser(req, res) {
  try {
    const user = await model.create(req.body);
    res.status(201).json({ 
      message: 'User created successfully', 
      user 
    });
  } catch (err) {
    if (err.message === 'Email already exists' || err.message === 'Username already exists') {
      return res.status(400).json({ error: err.message });
    }
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
}

async function getAllUsers(req, res) {
  try {
    const users = await model.findAll();
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

async function getUserById(req, res) {
  try {
    const user = await model.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

async function getCurrentUser(req, res) {
  try {
    console.log('Getting current user, req.user:', req.user);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await model.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}

async function updateUser(req, res) {
  try {
    const user = await model.updateById(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ 
      message: 'User updated successfully', 
      user 
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
}

async function updateCurrentUser(req, res) {
  try {
    const userId = req.user.id;
    const { full_name, email, username } = req.body;
    
    // Build update object (exclude password - use separate endpoint)
    const updateData = {};
    if (full_name) updateData.full_name = full_name;
    if (email) updateData.email = email;
    if (username) updateData.username = username;
    
    const user = await model.updateById(userId, updateData);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ 
      message: 'Profile updated successfully', 
      user: userWithoutPassword 
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

async function changePassword(req, res) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    console.log('Change password request for user:', userId);
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    
    // Get user with password (use special function that includes password)
    const user = await model.findByIdWithPassword(userId);
    
    console.log('User found:', user ? 'Yes' : 'No');
    console.log('User has password field:', user && user.password ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.password) {
      console.error('User password is undefined');
      return res.status(500).json({ error: 'Unable to verify password' });
    }
    
    // Verify current password
    console.log('Verifying current password...');
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    console.log('Current password valid:', isValidPassword);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    console.log('Hashing new password...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    console.log('Updating password in database...');
    await model.updateById(userId, { password: hashedPassword });
    
    console.log('Password changed successfully');
    
    res.json({ 
      message: 'Password changed successfully' 
    });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
}

async function deleteUser(req, res) {
  try {
    const user = await model.deleteById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ 
      message: 'User deleted successfully', 
      user 
    });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
}

module.exports = {
  register,
  createUser,
  getAllUsers,
  getUserById,
  getCurrentUser,
  updateUser,
  updateCurrentUser,
  changePassword,
  deleteUser
};