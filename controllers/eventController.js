// controllers/eventController.js
const Event = require("../models/Event");

// helpers
const isManager = (user) => user && ["admin"].includes(user.role);

exports.createEvent = async (req, res) => {
  try {
    if (!isManager(req.user)) {
      return res.status(403).json({ message: "admins can create events" });
    }

    const payload = {
      ...req.body,
      createdBy: req.user?.id,
    };

    const event = await Event.create(payload);
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const {
      q,
      from,             // ISO date string
      to,               // ISO date string
      mode,             // Online | In-Person | Hybrid
      tag,
      page = 1,
      limit = 20,
      sort = "startsAt", // e.g., "-startsAt" for newest first
    } = req.query;

    const filter = {};
    if (mode) filter.mode = mode;
    if (tag)  filter.tag  = tag;

    // date range
    if (from || to) {
      filter.startsAt = {};
      if (from) filter.startsAt.$gte = new Date(from);
      if (to)   filter.startsAt.$lte = new Date(to);
    }

    // search in title/description/tag
    if (q) {
      filter.$or = [
        { title:       { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { tag:         { $regex: q, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Event.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      Event.countDocuments(filter),
    ]);

    res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    if (!isManager(req.user)) {
      return res.status(403).json({ message: "Only admins can edit events" });
    }
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    if (!isManager(req.user)) {
      return res.status(403).json({ message: "Only admins can delete events" });
    }
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
