const model = require('../models/asetInventarisModel');

async function createAsset(req, res) {
  try {
    const asset = await model.create(req.body);
    res.status(201).json(asset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAllAssets(req, res) {
  try {
    const rows = await model.findAll();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAssetById(req, res) {
  try {
    const asset = await model.findById(req.params.id);
    if (!asset) return res.status(404).json({ error: 'Not found' });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateAsset(req, res) {
  try {
    const asset = await model.updateById(req.params.id, req.body);
    if (!asset) return res.status(404).json({ error: 'Not found' });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteAsset(req, res) {
  try {
    const asset = await model.deleteById(req.params.id);
    if (!asset) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true, asset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createAsset, getAllAssets, getAssetById, updateAsset, deleteAsset };