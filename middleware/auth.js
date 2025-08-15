const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Not logged in." });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token." });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  // req.user is set by protect
  const role = req.user?.role;
  if (!role || !roles.includes(role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

module.exports = { protect, requireRole };