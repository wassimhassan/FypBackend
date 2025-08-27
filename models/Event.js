// models/Event.js
const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    title:        { type: String, required: true, trim: true, maxlength: 140 },
    description:  { type: String, default: "", maxlength: 5000 },

    // Date & time (store in UTC, format on the client)
    startsAt:     { type: Date, required: true, index: true },
    endsAt:       { type: Date },

    // Presentation / categorization
    tag:          { type: String, default: "", trim: true },       // e.g., "University Fair"
    category:     { type: String, default: "", trim: true },       // optional extra bucket

    // Delivery mode & location
    mode:         { type: String, enum: ["Online", "In-Person", "Hybrid"], default: "Online" },
    type:         { type: String, default: "", trim: true },       // e.g., "Virtual"
    location:     {
      venue:      { type: String, default: "" },
      address:    { type: String, default: "" },
      city:       { type: String, default: "" },
      country:    { type: String, default: "" },
      mapUrl:     { type: String, default: "" },
      onlineLink: { type: String, default: "" }                    // Zoom/Teams/website
    },

    // Misc
    isPublic:     { type: Boolean, default: true },
    organizer:    { type: String, default: "" },                   // visible name
    createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Basic sanity guard
EventSchema.path("endsAt").validate(function (v) {
  if (!v) return true;
  return !this.startsAt || v >= this.startsAt;
}, "endsAt must be after startsAt");

module.exports = mongoose.model("Event", EventSchema);
