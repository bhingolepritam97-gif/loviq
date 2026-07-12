const admin = require("../config/firebase");
const { User } = require("../models");

/**
 * Verifies the Firebase ID token sent from the mobile app (Authorization:
 * Bearer <idToken>). On success, attaches req.firebaseUser (decoded token)
 * and req.dbUser (the matching row in our own `users` table, auto-created
 * on first sight so profile creation can attach to it immediately).
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ success: false, error: "Missing bearer token" });
    }

    // Verify the real Firebase token
    const decoded = await admin.auth().verifyIdToken(token);
    req.firebaseUser = decoded;

    let dbUser = await User.findOne({ where: { firebaseUid: decoded.uid } });

    if (!dbUser) {
      // First time we've seen this Firebase user — create the shell row.
      // Profile completion (name, photos, bio, etc.) happens via PATCH /users/:id.
      dbUser = await User.create({
        firebaseUid: decoded.uid,
        phone: decoded.phone_number || "unknown",
        profileCompleted: false,
      });
    }

    req.dbUser = dbUser;
    next();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[auth] token verification failed:", err.message);
    return res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}

module.exports = { requireAuth };
