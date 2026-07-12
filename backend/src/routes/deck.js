const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { getDeck } = require("../controllers/deckController");

const router = express.Router();
router.get("/", requireAuth, getDeck);

module.exports = router;
