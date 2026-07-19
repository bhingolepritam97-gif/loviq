const requireAdmin = (req, res, next) => {
  const expectedKey = process.env.ADMIN_API_KEY;
  if (!expectedKey && process.env.NODE_ENV === "production") {
    console.error("[adminAuth] CRITICAL: ADMIN_API_KEY environment variable is not configured!");
    return res.status(500).json({ success: false, error: "Server security misconfiguration." });
  }

  const adminKey = req.headers["admin-api-key"] || req.headers["x-admin-key"];
  const finalExpectedKey = expectedKey || "loviq_super_admin_secret_key_2026";

  if (adminKey !== finalExpectedKey) {
    return res.status(401).json({ success: false, error: "Unauthorized admin access." });
  }
  next();
};

module.exports = { requireAdmin };

export {};
