const { User } = require("../models");
const { sendPushNotification } = require("../utils/push");

// Helper to check if Stripe is active in the environment
const isStripeConfigured = () => {
  return !!process.env.STRIPE_SECRET_KEY;
};

// Initialize Stripe if configured
const getStripeInstance = () => {
  if (isStripeConfigured()) {
    return require("stripe")(process.env.STRIPE_SECRET_KEY);
  }
  return null;
};

// POST /billing/cancel
// One-tap subscription cancellation endpoint
async function cancelSubscription(req, res) {
  const user = req.dbUser;
  const stripe = getStripeInstance();

  try {
    if (stripe && user.stripeSubscriptionId) {
      // 1. Call Stripe API to cancel at period end
      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      // 2. Update status to reflect cancellation pending period end
      await user.update({
        subscriptionStatus: "canceled",
      });

      // 3. Send immediate push notification confirmation
      if (user.expoPushToken) {
        await sendPushNotification(
          user.expoPushToken,
          "Subscription Canceled",
          "Your premium subscription has been canceled and will not renew. You retain access until the end of your billing cycle."
        );
      }

      return res.json({
        success: true,
        message: "Subscription successfully set to cancel at period end.",
        subscription,
      });
    } else {
      // Development Mock Flow (if Stripe is not configured or user lacks Stripe ID)
      await user.update({
        subscriptionStatus: "canceled",
        isPremium: false, // Turn off immediately for mock simplicity
      });

      if (user.expoPushToken) {
        await sendPushNotification(
          user.expoPushToken,
          "Subscription Canceled (Mock)",
          "Your mock subscription has been successfully canceled."
        );
      }

      return res.json({
        success: true,
        message: "Mock subscription canceled successfully.",
        user,
      });
    }
  } catch (err) {
    console.error("[billingController] cancelSubscription error:", err);
    res.status(500).json({ success: false, error: "Failed to cancel subscription" });
  }
}

// POST /billing/webhook
// Stripe webhook listener (processes updates, deletes, trial expirations, and renewal reminders)
async function handleWebhook(req, res) {
  const stripe = getStripeInstance();
  let event = req.body;

  // Verify Stripe webhook signature
  if (stripe) {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("[billingController] Missing STRIPE_WEBHOOK_SECRET.");
      return res.status(500).send("Configuration Error: Missing webhook secret");
    }

    const sig = req.headers["stripe-signature"];
    try {
      // Use rawBody buffer attached by express.json verification
      const payload = req.rawBody || req.body;
      event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error("[billingController] Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    console.warn("[billingController] Webhook running in Mock Mode (No signature validation)");
  }

  try {
    const eventType = event.type;
    const dataObject = event.data.object;

    console.log(`[billingController] Processing Stripe webhook event: ${eventType}`);

    switch (eventType) {
      // 1. Subscription created/updated (activate premium, sync dates)
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = dataObject;
        const customerId = subscription.customer;
        const subscriptionId = subscription.id;
        const status = subscription.status; // trialing, active, past_due, canceled, etc.
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;

        // Find user by stripe subscription or customer ID
        let user = await User.findOne({
          where: { stripeSubscriptionId: subscriptionId }
        });

        if (!user && subscription.metadata && subscription.metadata.userId) {
          user = await User.findByPk(subscription.metadata.userId);
        }

        if (!user) {
          // Fallback search by customer ID
          user = await User.findOne({ where: { stripeCustomerId: customerId } });
        }

        if (user) {
          const isPremiumActive = ["active", "trialing"].includes(status);
          const priceAmount = subscription.items?.data[0]?.price?.unit_amount;
          const priceLocked = priceAmount ? (priceAmount / 100) : null;

          await user.update({
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: customerId,
            subscriptionStatus: status,
            isPremium: isPremiumActive,
            subscriptionCurrentPeriodEnd: currentPeriodEnd,
            subscriptionTrialEnd: trialEnd,
            subscriptionPriceLocked: priceLocked !== null ? priceLocked : user.subscriptionPriceLocked,
          });

          if (isPremiumActive && user.expoPushToken) {
            await sendPushNotification(
              user.expoPushToken,
              "Premium Activated! 🎉",
              "Thank you for your purchase. Enjoy unlimited likes, travel mode, and verified indicators!"
            );
          }
        } else {
          console.warn(`[billingController] No user found for subscription: ${subscriptionId}`);
        }
        break;
      }

      // 2. Subscription deleted/ended (revoke premium status)
      case "customer.subscription.deleted": {
        const subscription = dataObject;
        const user = await User.findOne({ where: { stripeSubscriptionId: subscription.id } });

        if (user) {
          await user.update({
            subscriptionStatus: "deleted",
            isPremium: false,
          });

          if (user.expoPushToken) {
            await sendPushNotification(
              user.expoPushToken,
              "Premium Expired",
              "Your subscription has ended. Upgrade anytime in Settings to regain premium features."
            );
          }
        }
        break;
      }

      // 3. Free trial will end (warn user 48 hours out)
      case "customer.subscription.trial_will_end": {
        const subscription = dataObject;
        const user = await User.findOne({ where: { stripeSubscriptionId: subscription.id } });

        if (user && user.expoPushToken) {
          // Stripe triggers this 3 days prior. Send notice letting user know they have 48 hours left to cancel safely.
          await sendPushNotification(
            user.expoPushToken,
            "Trial Ending Soon ⏰",
            "Your free trial ends in 48 hours. Cancel anytime in account settings to avoid being billed."
          );
        }
        break;
      }

      // 4. Renewal reminders (annual vs weekly/monthly)
      case "invoice.upcoming": {
        const invoice = dataObject;
        const subscriptionId = invoice.subscription;
        const user = await User.findOne({ where: { stripeSubscriptionId: subscriptionId } });

        if (user && user.expoPushToken) {
          // Retrieve subscription detail if Stripe client is active to check pricing interval
          let interval = "month";
          if (stripe && subscriptionId) {
            try {
              const sub = await stripe.subscriptions.retrieve(subscriptionId);
              interval = sub.items.data[0].plan.interval; // day, week, month, year
            } catch (err) {
              console.error("[billingController] Failed to query subscription interval:", err.message);
            }
          }

          if (interval === "year") {
            // Annual plan renewal notice (sent 7 days prior by configuring upcoming invoice notice settings)
            await sendPushNotification(
              user.expoPushToken,
              "Upcoming Yearly Renewal",
              "Reminder: Your annual subscription automatically renews in 7 days. Manage your settings anytime."
            );
          } else {
            // Weekly/Monthly renewal notice (sent 24 hours prior)
            await sendPushNotification(
              user.expoPushToken,
              "Renewal Notice",
              "Reminder: Your subscription automatically renews in 24 hours. Cancel anytime in Settings."
            );
           }
        }
        break;
      }

      default:
        console.log(`[billingController] Unhandled Stripe webhook event: ${eventType}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("[billingController] Webhook processing failed:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

const isRazorpayConfigured = () => {
  return !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET;
};

const getRazorpayInstance = () => {
  if (isRazorpayConfigured()) {
    const Razorpay = require("razorpay");
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return null;
};

// POST /billing/razorpay/order
// Expects: { tier: 'plus' | 'premium', duration: 'weekly' | 'monthly' | 'yearly' }
async function createRazorpayOrder(req, res) {
  const { tier, duration } = req.body;
  const razorpay = getRazorpayInstance();

  if (!tier || !duration) {
    return res.status(400).json({ success: false, error: "Tier and duration are required." });
  }

  // Define pricing tiers in INR paise (1 INR = 100 paise)
  const prices = {
    plus: {
      weekly: 19900,   // ₹199
      monthly: 49900,  // ₹499
      yearly: 299900,  // ₹2,999
    },
    premium: {
      weekly: 29900,   // ₹299
      monthly: 79900,  // ₹799
      yearly: 499900,  // ₹4,999
    }
  };

  if (!prices[tier] || !prices[tier][duration]) {
    return res.status(400).json({ success: false, error: "Invalid tier or duration selection." });
  }

  const amount = prices[tier][duration];

  try {
    if (razorpay) {
      const order = await razorpay.orders.create({
        amount,
        currency: "INR",
        receipt: `receipt_${req.dbUser.id.substring(0, 8)}_${Date.now()}`,
        notes: {
          userId: req.dbUser.id,
          tier,
          duration
        }
      });

      return res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      });
    } else {
      if (process.env.NODE_ENV === "production") {
        return res.status(500).json({ success: false, error: "Razorpay is not configured." });
      }
      // Mock flow if credentials not configured
      console.warn("[billingController] Razorpay not configured. Returning mock order details.");
      return res.json({
        success: true,
        isMock: true,
        orderId: `order_mock_${Math.random().toString(36).substring(7)}`,
        amount,
        currency: "INR"
      });
    }
  } catch (err) {
    console.error("[billingController] createRazorpayOrder error:", err);
    res.status(500).json({ success: false, error: "Failed to generate payment order." });
  }
}

// POST /billing/razorpay/verify
// Expects: { razorpay_order_id, razorpay_payment_id, razorpay_signature, tier, amount }
async function verifyRazorpayPayment(req, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, tier, amount } = req.body;
  const user = req.dbUser;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !tier) {
    return res.status(400).json({ success: false, error: "Verification details and tier are required." });
  }

  try {
    const isMock = razorpay_order_id.startsWith("order_mock_") && process.env.NODE_ENV !== "production";
    let verified = false;

    if (isMock) {
      verified = true;
    } else {
      if (!isRazorpayConfigured()) {
        return res.status(500).json({ success: false, error: "Razorpay integration is not configured in production." });
      }
      const crypto = require("crypto");
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      verified = generatedSignature === razorpay_signature;
    }

    if (!verified) {
      return res.status(400).json({ success: false, error: "Signature verification failed." });
    }

    // Update user properties
    const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // default 30 days
    const priceLocked = amount ? (parseFloat(amount) / 100) : null;
    
    await user.update({
      tier,
      isPremium: true,
      subscriptionStatus: "active",
      stripeSubscriptionId: razorpay_order_id, // map order ID to subscription slot for cancel/refund lookups
      subscriptionCurrentPeriodEnd: currentPeriodEnd,
      subscriptionPriceLocked: priceLocked !== null ? priceLocked : user.subscriptionPriceLocked
    });

    if (user.expoPushToken) {
      await sendPushNotification(
        user.expoPushToken,
        "Premium Activated! 🎉",
        `Enjoy your new ${tier.toUpperCase()} subscription features!`
      ).catch(e => console.error("Push failed:", e));
    }

    res.json({
      success: true,
      message: "Payment successfully verified. Subscription activated.",
      user: {
        id: user.id,
        tier: user.tier,
        isPremium: user.isPremium
      }
    });
  } catch (err) {
    console.error("[billingController] verifyRazorpayPayment error:", err);
    res.status(500).json({ success: false, error: "Failed to verify payment." });
  }
}

// POST /billing/razorpay/webhook
async function handleRazorpayWebhook(req, res) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (secret) {
    const crypto = require("crypto");
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest !== req.headers["x-razorpay-signature"]) {
      console.error("[billingController] Razorpay webhook signature mismatch.");
      return res.status(400).send("Signature mismatch");
    }
  } else if (process.env.NODE_ENV === "production") {
    console.error("[billingController] Missing RAZORPAY_WEBHOOK_SECRET in production.");
    return res.status(500).send("Configuration Error: Missing webhook secret");
  }

  const event = req.body;
  console.log(`[billingController] Processing Razorpay webhook: ${event.event}`);

  try {
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      
      const user = await User.findOne({
        where: { stripeSubscriptionId: orderId } // mapped to subscription slots
      });

      if (user && user.subscriptionStatus !== "active") {
        await user.update({
          isPremium: true,
          subscriptionStatus: "active"
        });
      }
    } else if (event.event === "refund.processed") {
      const refund = event.payload.refund.entity;
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;

      const user = await User.findOne({
        where: { stripeSubscriptionId: orderId }
      });

      if (user) {
        await user.update({
          isPremium: false,
          subscriptionStatus: "refunded",
          tier: "free"
        });

        if (user.expoPushToken) {
          await sendPushNotification(
            user.expoPushToken,
            "Subscription Refunded 💸",
            "Your subscription payment has been refunded. Your account is returned to Free tier."
          ).catch(e => console.error("Refund push failed:", e));
        }
      }
    }

    res.json({ status: "ok" });
  } catch (err) {
    console.error("[billingController] Razorpay webhook handling failed:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

module.exports = { 
  cancelSubscription, 
  handleWebhook,
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook
};


export {};
