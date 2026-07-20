const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const safetyService = require("../services/safetyService");

/**
 * IP-Based Rate Limiting
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests from this IP, please try again after 15 minutes.",
  },
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login requests per hour
  message: {
    success: false,
    error: "Too many login attempts from this IP, please try again after an hour.",
  },
});

/**
 * Generates a basic device fingerprint from IP, User-Agent, and Accept-Language.
 */
function fingerprintDetector(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers["user-agent"] || "";
  const acceptLang = req.headers["accept-language"] || "";
  
  // Create a basic SHA-256 fingerprint
  const fingerprintHash = crypto
    .createHash("sha256")
    .update(`${ip}|${userAgent}|${acceptLang}`)
    .digest("hex");

  req.deviceFingerprint = fingerprintHash;
  req.clientIp = ip;
  
  next();
}

/**
 * Basic Bot Detection
 * Requires standard headers that normal clients/browsers/mobile apps send.
 */
function botDetector(req, res, next) {
  const userAgent = req.headers["user-agent"];
  
  // Super simple heuristic: block if no user agent (common with curl/postman if not set)
  // In production, we'd whitelist standard mobile app User-Agents.
  if (!userAgent || userAgent.includes("curl") || userAgent.includes("PostmanRuntime")) {
    // We log it but just block the request
    return res.status(403).json({ success: false, error: "Suspicious bot activity detected." });
  }

  next();
}

/**
 * Checks if the request is coming from a duplicate/banned account signature.
 */
async function duplicateAccountCheck(req, res, next) {
  if (req.deviceFingerprint) {
    const isDuplicate = await safetyService.detectDuplicateAccount(req.deviceFingerprint, req.clientIp);
    if (isDuplicate) {
      // We can either soft block (shadow ban) or hard block. Let's hard block registration attempts.
      // Assuming this middleware is placed on the `/register` or `/onboarding` route
      return res.status(403).json({ success: false, error: "Device or IP has been previously banned. Registration blocked." });
    }
  }
  next();
}

module.exports = {
  apiLimiter,
  authLimiter,
  fingerprintDetector,
  botDetector,
  duplicateAccountCheck
};

export {};
