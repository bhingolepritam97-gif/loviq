const admin = require("firebase-admin");
require("dotenv").config();

// Auth stays on Firebase (per the cost tradeoff for a 1k-user MVP). This
// backend only *verifies* the ID tokens Firebase already issues on the
// client — it never issues its own tokens or handles OTP itself.

if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // eslint-disable-next-line no-console
    console.warn(
      "[firebase] FIREBASE_SERVICE_ACCOUNT_JSON is not set. Auth middleware " +
        "will reject all requests until this is configured."
    );
  }
}

module.exports = admin;
