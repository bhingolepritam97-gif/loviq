const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { getDeck, getTopPicks } = require("../controllers/deckController");

const router = express.Router();
router.get("/", requireAuth, getDeck);
router.get("/top-picks", requireAuth, getTopPicks);

module.exports = router;

export {};
