const model = require('../models/userModel');

async function createUser(req, res) {
  try {
    const user = await model.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    if (err.code === '23505') { // unique violation
      return res.status(409).json({ error: 'Email already exists' });
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
    const user = await model.updateById(req.params.id, req.body);
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

module.exports = { createUser, getAllUsers, getUserById, updateUser, deleteUser };