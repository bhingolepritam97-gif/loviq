const express = require("express");
const { requireAuth } = require("../middleware/auth");
const ctrl = require("../controllers/usersController");

const router = express.Router();

router.patch("/me/push-token", requireAuth, ctrl.updatePushToken);
router.get("/me", requireAuth, ctrl.getCurrentUser);
router.patch("/me", requireAuth, ctrl.updateCurrentUser);
router.post("/me/ai-suggestions", requireAuth, ctrl.getAiSuggestions);
router.get("/:id", requireAuth, ctrl.getUser);
router.patch("/:id", requireAuth, ctrl.updateUser);
router.delete("/:id", requireAuth, ctrl.deleteUser);
router.post("/:id/photos", requireAuth, ctrl.addPhoto);
router.delete("/:id/photos/:photoId", requireAuth, ctrl.deletePhoto);
router.patch("/:id/photos/order", requireAuth, ctrl.reorderPhotos);
router.post("/:id/block", requireAuth, ctrl.blockUser);
router.get("/:id/blocks", requireAuth, ctrl.getBlocks);
router.delete("/:id/block/:blockedId", requireAuth, ctrl.unblockUser);
router.post("/:id/report", requireAuth, ctrl.reportUser);

module.exports = router;
