const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const auth = require('../middleware/auth');

// Get all clients
router.get('/', auth, async (req, res) => {
  try {
    const clients = await Client.find({ lawyer: req.user.id }).sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get single client
router.get('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, lawyer: req.user.id })
      .populate('cases', 'caseNumber title status');
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create client
router.post('/', auth, async (req, res) => {
  try {
    const newClient = new Client({
      ...req.body,
      lawyer: req.user.id
    });
    
    const client = await newClient.save();
    res.status(201).json(client);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update client
router.put('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, lawyer: req.user.id },
      req.body,
      { new: true }
    );
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete client
router.delete('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({ _id: req.params.id, lawyer: req.user.id });
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json({ message: 'Client deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;