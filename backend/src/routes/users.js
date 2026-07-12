const express = require("express");
const { requireAuth } = require("../middleware/auth");
const ctrl = require("../controllers/usersController");

const router = express.Router();

router.patch("/me/push-token", requireAuth, ctrl.updatePushToken);
router.get("/:id", requireAuth, ctrl.getUser);
router.patch("/:id", requireAuth, ctrl.updateUser);
router.delete("/:id", requireAuth, ctrl.deleteUser);
router.post("/:id/photos", requireAuth, ctrl.addPhoto);
router.delete("/:id/photos/:photoId", requireAuth, ctrl.deletePhoto);
router.patch("/:id/photos/order", requireAuth, ctrl.reorderPhotos);
router.post("/:id/block", requireAuth, ctrl.blockUser);
router.post("/:id/report", requireAuth, ctrl.reportUser);

module.exports = router;
