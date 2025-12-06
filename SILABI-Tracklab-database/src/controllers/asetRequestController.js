const asetRequestModel = require('../models/asetRequestModel');

async function getAllRequests(req, res) {
    try {
        const filters = {
            status: req.query.status,
            asset_id: req.query.asset_id,
            user_id: req.query.user_id
        };
        const requests = await asetRequestModel.getAllRequests(filters);
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function getRequestById(req, res) {
    try {
        const request = await asetRequestModel.getRequestById(req.params.id);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        res.json(request);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function createRequest(req, res) {
    try {
        const newRequest = await asetRequestModel.createRequest(req.body);
        res.status(201).json(newRequest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function updateRequest(req, res) {
    try {
        const updated = await asetRequestModel.updateRequest(req.params.id, req.body);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function deleteRequest(req, res) {
    try {
        await asetRequestModel.deleteRequest(req.params.id);
        res.json({ message: 'Request deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function approveRequest(req, res) {
    try {
        const approved = await asetRequestModel.approveRequest(req.params.id);
        res.json(approved);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function denyRequest(req, res) {
    try {
        const denied = await asetRequestModel.denyRequest(req.params.id);
        res.json(denied);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getAllRequests,
    getRequestById,
    createRequest,
    updateRequest,
    deleteRequest,
    approveRequest,
    denyRequest
};