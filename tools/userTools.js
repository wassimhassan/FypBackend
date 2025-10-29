// tools/userTools.js
const User = require("../models/User");

// Whitelist the only fields the AI/tool can see
const SAFE_FIELDS = "username email role createdAt profilePicture phoneNumber";

function clamp(n, min, max) {
  n = Number(n);
  if (!Number.isFinite(n)) n = min;
  return Math.max(min, Math.min(max, n));
}

/**
 * List users with optional search and pagination.
 * args: { q?: string, page?: number, limit?: number, role?: 'student'|'teacher'|'admin' }
 */
exports.listUsers = async (args = {}) => {
  const q     = (args.q || "").trim();
  const page  = clamp(args.page ?? 1, 1, 10_000);
  const limit = clamp(args.limit ?? 25, 1, 100);
  const skip  = (page - 1) * limit;

  const filter = {};
  if (q) {
    filter.$or = [
      { username: new RegExp(q, "i") },
      { email: new RegExp(q, "i") },
    ];
  }
  if (args.role) {
    filter.role = args.role;
  }

  const [rows, total] = await Promise.all([
    User.find(filter)
      .select(SAFE_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    total,
    page,
    pages: Math.ceil(total / limit),
    limit,
    rows,
  };
};
