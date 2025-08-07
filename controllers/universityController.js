const University = require('../models/University');

const createUniversity = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

    const newUniversity = await University.create(req.body);
    res.status(201).json(newUniversity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllUniversities = async (_req, res) => {
  try {
    const universities = await University.find().sort({ createdAt: -1 });
    res.json(universities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUniversity = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

    const updated = await University.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'University not found' });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUniversity = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

    const deleted = await University.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'University not found' });

    res.json({ message: 'University deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createUniversity,
  getAllUniversities,
  updateUniversity,
  deleteUniversity
};
