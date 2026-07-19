const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { createSwipe, getLikes, getSent, recyclePasses, rewindSwipe } = require("../controllers/swipesController");

const router = express.Router();
router.post("/", requireAuth, createSwipe);
router.get("/likes", requireAuth, getLikes);
router.get("/sent", requireAuth, getSent);
router.post("/recycle", requireAuth, recyclePasses);
router.post("/rewind", requireAuth, rewindSwipe);

module.exports = router;


export {};
