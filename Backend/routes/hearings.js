const express = require('express');
const router = express.Router();
const Hearing = require('../models/Hearing');
const auth = require('../middleware/auth');

// Get all hearings
router.get('/', auth, async (req, res) => {
  try {
    const hearings = await Hearing.find({ lawyer: req.user.id })
      .populate('case', 'caseNumber title')
      .sort({ date: 1 });
    res.json(hearings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get upcoming hearings
router.get('/upcoming', auth, async (req, res) => {
  try {
    const hearings = await Hearing.find({ 
      lawyer: req.user.id,
      date: { $gte: new Date() },
      status: 'scheduled'
    })
      .populate('case', 'caseNumber title')
      .sort({ date: 1 })
      .limit(10);
    res.json(hearings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create hearing
router.post('/', auth, async (req, res) => {
  try {
    const newHearing = new Hearing({
      ...req.body,
      lawyer: req.user.id
    });
    
    const hearing = await newHearing.save();
    res.status(201).json(hearing);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update hearing
router.put('/:id', auth, async (req, res) => {
  try {
    const hearing = await Hearing.findOneAndUpdate(
      { _id: req.params.id, lawyer: req.user.id },
      req.body,
      { new: true }
    );
    
    if (!hearing) {
      return res.status(404).json({ message: 'Hearing not found' });
    }
    res.json(hearing);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete hearing
router.delete('/:id', auth, async (req, res) => {
  try {
    const hearing = await Hearing.findOneAndDelete({ _id: req.params.id, lawyer: req.user.id });
    
    if (!hearing) {
      return res.status(404).json({ message: 'Hearing not found' });
    }
    res.json({ message: 'Hearing deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;