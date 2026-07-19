const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const safetyController = require("../controllers/safetyController");

router.post("/trusted-contacts", requireAuth, safetyController.addTrustedContact);
router.get("/trusted-contacts", requireAuth, safetyController.getTrustedContacts);
router.post("/share-date", requireAuth, safetyController.shareDate);
router.post("/sos", requireAuth, safetyController.triggerSos);

router.post("/report", requireAuth, safetyController.reportUser);
router.post("/block", requireAuth, safetyController.blockUser);

// Public route for the trusted contact to view the date share
router.get("/date/:id", safetyController.getDateShareContent);

module.exports = router;

export {};
