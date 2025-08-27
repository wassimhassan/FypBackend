// routes/eventRoutes.js
const express = require("express");
const router = express.Router();
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");

const { protect, requireRole } = require('../middleware/auth');


// Public: list & view
router.get("/", getEvents);
router.get("/:id", getEventById);

// Protected: create/edit/delete
// If you have a verifyJWT middleware, add it before these
router.post("/", protect, createEvent);
router.put("/:id", protect, updateEvent);
router.delete("/:id", protect, deleteEvent);

module.exports = router;
