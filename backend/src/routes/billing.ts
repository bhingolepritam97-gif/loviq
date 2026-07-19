const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { 
  cancelSubscription, 
  handleWebhook,
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook
} = require("../controllers/billingController");

const router = express.Router();

router.post("/cancel", requireAuth, cancelSubscription);
router.post("/webhook", handleWebhook);

router.post("/razorpay/order", requireAuth, createRazorpayOrder);
router.post("/razorpay/verify", requireAuth, verifyRazorpayPayment);
router.post("/razorpay/webhook", handleRazorpayWebhook);

module.exports = router;

export {};
