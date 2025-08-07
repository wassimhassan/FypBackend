// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Admin dashboard routes
router.get("/", userController.getAllUsers);         // GET all users
router.post("/", userController.createUser);         // POST new user
router.put("/:id", userController.updateUser);       // PUT update user by ID
router.delete("/:id", userController.deleteUser);    // DELETE user by ID
router.get("/teachers", userController.getAllTeachers);

module.exports = router;
