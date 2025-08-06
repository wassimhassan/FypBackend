const Career = require('../models/Career');

// Create a new career (Admin only)
const createCareer = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

    const newCareer = await Career.create(req.body);
    res.status(201).json(newCareer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all careers
const getAllCareers = async (_req, res) => {
  try {
    const careers = await Career.find().sort({ createdAt: -1 });
    res.json(careers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a career (Admin only)
const updateCareer = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

    const updated = await Career.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Career not found' });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a career (Admin only)
const deleteCareer = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

    const deleted = await Career.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Career not found' });

    res.json({ message: 'Career deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCareer,
  getAllCareers,
  updateCareer,
  deleteCareer
};
