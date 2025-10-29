const express = require("express");
const router = express.Router();
const { chatWithAgent } = require("../controllers/agentController");

router.post("/chat", chatWithAgent);

module.exports = router;
