const express = require("express");
const ctrl = require("../controllers/adminController");
const { requireAdmin } = require("../middleware/adminAuth");

const router = express.Router();
const path = require("path");

// Serve the static administration dashboard web interface (auth is handled in the UI overlay via prompt)
router.use("/dashboard", express.static(path.join(__dirname, "../../public/admin")));

// Verify admin API key for all backend control routes
router.use(requireAdmin);

router.post("/invite-codes/seed", ctrl.seedInviteCodes);
router.get("/verifications/pending", ctrl.getPendingVerifications);
router.post("/verifications/:id/approve", ctrl.approveVerification);
router.post("/verifications/:id/reject", ctrl.rejectVerification);
router.get("/reports", ctrl.getReports);
router.post("/reports/:id/resolve", ctrl.resolveReport);
router.get("/dashboard-stats", ctrl.getDashboardStats);
router.get("/appeals", ctrl.getAppeals);
router.post("/appeals/:id/resolve", ctrl.resolveAppeal);
router.post("/run-cleaners", ctrl.runCleaners);
router.get("/analytics", ctrl.getAnalytics);

module.exports = router;


export {};
