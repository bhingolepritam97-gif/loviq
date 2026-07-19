const express = require("express");
const { requireAuth } = require("../middleware/auth");
const ctrl = require("../controllers/promptsController");

const router = express.Router();

router.get("/", requireAuth, ctrl.getPrompts);
router.post("/answers", requireAuth, ctrl.saveAnswers);

module.exports = router;

export {};
