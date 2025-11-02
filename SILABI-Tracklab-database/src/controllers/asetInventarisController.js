const model = require('../models/asetInventarisModel');

async function getAllAset(req, res) {
  try {
    const { status, category, location } = req.query;
    
    let asets;
    if (status) {
      asets = await model.getByStatus(status);
    } else if (category) {
      asets = await model.getByCategory(category);
    } else if (location) {
      asets = await model.getByLocation(location);
    } else {
      asets = await model.getAll();
    }
    
    res.json(asets);
  } catch (err) {
    console.error('Error fetching assets:', err);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
}

async function getAsetById(req, res) {
  try {
    const { id } = req.params;
    const aset = await model.getById(id);
    
    if (!aset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json(aset);
  } catch (err) {
    console.error('Error fetching asset:', err);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
}

async function createAset(req, res) {
  try {
    const newAset = await model.create(req.body);
    res.status(201).json(newAset);
  } catch (err) {
    console.error('Error creating asset:', err);
    res.status(500).json({ error: 'Failed to create asset' });
  }
}

async function updateAset(req, res) {
  try {
    const { id } = req.params;
    const updatedAset = await model.updateById(id, req.body);
    
    if (!updatedAset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json(updatedAset);
  } catch (err) {
    console.error('Error updating asset:', err);
    res.status(500).json({ error: 'Failed to update asset' });
  }
}

async function deleteAset(req, res) {
  try {
    const { id } = req.params;
    const deletedAset = await model.deleteById(id);
    
    if (!deletedAset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json({ message: 'Asset deleted successfully', asset: deletedAset });
  } catch (err) {
    console.error('Error deleting asset:', err);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
}

async function getStats(req, res) {
  try {
    const allAssets = await model.getAll();
    
    const stats = {
      total: allAssets.length,
      available: allAssets.filter(a => a.status_aset === 'Tersedia').length,
      inUse: allAssets.filter(a => a.status_aset === 'Dipinjam').length,
      inRepair: allAssets.filter(a => a.status_aset === 'Dalam Perbaikan').length,
      missing: allAssets.filter(a => a.status_hilang === true).length,
      byCategory: {},
      byLocation: {}
    };
    
    // Count by category
    allAssets.forEach(asset => {
      if (asset.category) {
        stats.byCategory[asset.category] = (stats.byCategory[asset.category] || 0) + 1;
      }
    });
    
    // Count by location
    allAssets.forEach(asset => {
      if (asset.location) {
        stats.byLocation[asset.location] = (stats.byLocation[asset.location] || 0) + 1;
      }
    });
    
    res.json(stats);
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
}

module.exports = {
  getAllAset,
  getAsetById,
  createAset,
  updateAset,
  deleteAset,
  getStats
};