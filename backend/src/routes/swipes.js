const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { createSwipe } = require("../controllers/swipesController");

const router = express.Router();
router.post("/", requireAuth, createSwipe);

module.exports = router;
