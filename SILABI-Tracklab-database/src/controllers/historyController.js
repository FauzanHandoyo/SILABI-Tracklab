const model = require('../models/historyModel');

async function getAllHistory(req, res) {
  try {
    const filters = {
      asset_id: req.query.asset_id,
      days: req.query.days || 7,
      event_type: req.query.event_type,
      limit: req.query.limit || 100
    };

    const history = await model.getAll(filters);
    res.json(history);
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
}

async function getHistoryById(req, res) {
  try {
    const history = await model.getById(req.params.id);
    if (!history) {
      return res.status(404).json({ error: 'History record not found' });
    }
    res.json(history);
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
}

async function createHistory(req, res) {
  try {
    const history = await model.create(req.body);
    res.status(201).json(history);
  } catch (err) {
    console.error('Error creating history:', err);
    res.status(500).json({ error: 'Failed to create history record' });
  }
}

async function getAssetHistory(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = await model.getByAssetId(req.params.assetId, limit);
    res.json(history);
  } catch (err) {
    console.error('Error fetching asset history:', err);
    res.status(500).json({ error: 'Failed to fetch asset history' });
  }
}

module.exports = {
  getAllHistory,
  getHistoryById,
  createHistory,
  getAssetHistory
};