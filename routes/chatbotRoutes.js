// routes/chatbotRoutes.js (CommonJS)
const express = require("express");
const { chatWithAI } = require("../controllers/chatbotController");

const router = express.Router();

router.get("/ping", (_req, res) => res.send("pong"));
router.post("/chat", chatWithAI);

module.exports = router;
