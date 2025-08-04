const Scholarship = require('../models/Scholarship');
const User = require('../models/User'); // if needed

// Create a new scholarship (Admin only)
const createScholarship = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

    const scholarship = await Scholarship.create(req.body);
    res.status(201).json(scholarship);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all scholarships
const getAllScholarships = async (_req, res) => {
  try {
    const scholarships = await Scholarship.find().sort({ createdAt: -1 });
    res.json(scholarships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Apply to a scholarship (Students only)
const applyToScholarship = async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Only students can apply' });

    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) return res.status(404).json({ message: 'Scholarship not found' });

    if (scholarship.applicants.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already applied' });
    }

    scholarship.applicants.push(req.user.id);
    await scholarship.save();

    res.json({ message: 'Application successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a scholarship
const updateScholarship = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

    const updated = await Scholarship.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Scholarship not found' });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a scholarship
const deleteScholarship = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

    const deleted = await Scholarship.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Scholarship not found' });

    res.json({ message: 'Scholarship deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createScholarship, getAllScholarships, applyToScholarship, updateScholarship, deleteScholarship };
