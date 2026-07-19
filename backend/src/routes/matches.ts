const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  listMatches,
  unmatch,
  getMessages,
  sendMessage,
  getMatch,
  getAiStarters,
} = require("../controllers/matchesController");

const router = express.Router();
router.get("/", requireAuth, listMatches);
router.get("/:id", requireAuth, getMatch);
router.post("/:id/unmatch", requireAuth, unmatch);
router.get("/:id/messages", requireAuth, getMessages);
router.post("/:id/messages", requireAuth, sendMessage);
router.post("/:id/ai-starters", requireAuth, getAiStarters);

module.exports = router;

export {};
