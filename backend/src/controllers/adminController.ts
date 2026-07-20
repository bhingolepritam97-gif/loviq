const { InviteCode, User, Photo, Report } = require("../models");
const crypto = require("crypto");

// POST /admin/invite-codes/seed
async function seedInviteCodes(req, res) {
  const expectedKey = process.env.ADMIN_API_KEY;

  if (!expectedKey && process.env.NODE_ENV === "production") {
    console.error("[adminController] CRITICAL: ADMIN_API_KEY environment variable is not configured!");
    return res.status(500).json({ success: false, error: "Server security misconfiguration." });
  }

  const adminKey = req.headers["admin-api-key"] || req.headers["x-admin-key"];
  const finalExpectedKey = expectedKey || "loviq_super_admin_secret_key_2026";

  if (adminKey !== finalExpectedKey) {
    return res.status(401).json({ success: false, error: "Unauthorized admin access." });
  }

  const count = Math.min(parseInt(req.body.count, 10) || 50, 500); // Default 50, cap at 500 per call

  try {
    const codesCreated = [];
    for (let i = 0; i < count; i++) {
      const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase();
      const code = `LOVIQ-${randomPart}`;
      
      const invite = await InviteCode.create({
        code,
        createdById: null, // Seeding codes are not tied to an existing user
      });
      codesCreated.push(invite.code);
    }

    res.status(201).json({
      success: true,
      message: `Successfully seeded ${count} invite codes.`,
      codes: codesCreated
    });
  } catch (err) {
    console.error("[adminController] seedInviteCodes error:", err);
    res.status(500).json({ success: false, error: "Failed to seed invite codes." });
  }
}

// Helper for admin key check
function verifyAdminKey(req) {
  const expectedKey = process.env.ADMIN_API_KEY;
  if (!expectedKey && process.env.NODE_ENV === "production") {
    console.error("[adminController] CRITICAL: ADMIN_API_KEY environment variable is not configured!");
    return { valid: false, status: 500, error: "Server security misconfiguration." };
  }

  const adminKey = req.headers["admin-api-key"] || req.headers["x-admin-key"];
  const finalExpectedKey = expectedKey || "loviq_super_admin_secret_key_2026";

  if (adminKey !== finalExpectedKey) {
    return { valid: false, status: 401, error: "Unauthorized admin access." };
  }
  return { valid: true };
}

// GET /admin/verifications/pending
async function getPendingVerifications(req, res) {
  const check = verifyAdminKey(req);
  if (!check.valid) {
    return res.status(check.status).json({ success: false, error: check.error });
  }

  try {
    const pendingUsers = await User.findAll({
      where: { verificationStatus: "pending" },
      include: [{ model: Photo, as: "photos", order: [["order", "ASC"]] }],
      order: [["updatedAt", "ASC"]]
    });
    res.json({ success: true, count: pendingUsers.length, users: pendingUsers });
  } catch (err) {
    console.error("[adminController] getPendingVerifications error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch pending verifications." });
  }
}

// POST /admin/verifications/:id/approve
async function approveVerification(req, res) {
  const check = verifyAdminKey(req);
  if (!check.valid) {
    return res.status(check.status).json({ success: false, error: check.error });
  }

  const userId = req.params.id;
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    await user.update({
      isVerified: true,
      verificationStatus: "verified",
      verifiedAt: new Date()
    });

    if (user.expoPushToken) {
      const { sendPushNotification } = require("../utils/push");
      sendPushNotification(
        user.expoPushToken,
        "Profile Verified! 💙",
        "Congratulations! Your selfie verification has been approved. You now have a blue badge!",
        { type: "verification_approved" }
      ).catch(e => console.error("Verification push failed:", e));
    }

    res.json({ success: true, message: "User verification approved successfully.", user });
  } catch (err) {
    console.error("[adminController] approveVerification error:", err);
    res.status(500).json({ success: false, error: "Failed to approve verification." });
  }
}

// POST /admin/verifications/:id/reject
async function rejectVerification(req, res) {
  const check = verifyAdminKey(req);
  if (!check.valid) {
    return res.status(check.status).json({ success: false, error: check.error });
  }

  const userId = req.params.id;
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    await user.update({
      isVerified: false,
      verificationStatus: "unverified",
      verifiedAt: null
    });

    if (user.expoPushToken) {
      const { sendPushNotification } = require("../utils/push");
      sendPushNotification(
        user.expoPushToken,
        "Verification Rejected ⚠️",
        "Your selfie verification attempt could not be verified. Please try again with better lighting.",
        { type: "verification_rejected" }
      ).catch(e => console.error("Verification push failed:", e));
    }

    res.json({ success: true, message: "User verification rejected successfully.", user });
  } catch (err) {
    console.error("[adminController] rejectVerification error:", err);
    res.status(500).json({ success: false, error: "Failed to reject verification." });
  }
}

// GET /admin/reports
async function getReports(req, res) {
  const check = verifyAdminKey(req);
  if (!check.valid) {
    return res.status(check.status).json({ success: false, error: check.error });
  }

  try {
    const reports = await Report.findAll({
      where: { status: "pending" },
      include: [
        { model: User, as: "reporter", attributes: ["id", "name", "phone"] },
        { model: User, as: "reported", attributes: ["id", "name", "phone"] }
      ],
      order: [["createdAt", "ASC"]]
    });
    res.json({ success: true, count: reports.length, reports });
  } catch (err) {
    console.error("[adminController] getReports error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch reports." });
  }
}

// POST /admin/reports/:id/resolve
async function resolveReport(req, res) {
  const check = verifyAdminKey(req);
  if (!check.valid) {
    return res.status(check.status).json({ success: false, error: check.error });
  }

  const reportId = req.params.id;
  const { banUser, banReason } = req.body;

  const { Match, BannedIdentity } = require("../models");
  const { Op } = require("sequelize");

  try {
    const report = await Report.findByPk(reportId);
    if (!report) {
      return res.status(404).json({ success: false, error: "Report not found." });
    }

    await report.update({ status: "resolved" });

    if (banUser) {
      const targetUserId = report.reportedId;
      const targetUser = await User.findByPk(targetUserId);
      if (targetUser) {
        // 1. Mark user as banned in DB
        await targetUser.update({
          isBanned: true,
          banReason: banReason || "Violation of community guidelines."
        });

        // Phase 7: Insert into BannedIdentity to prevent re-registration
        if (targetUser.phone) {
          try {
            await BannedIdentity.findOrCreate({
              where: { phone: targetUser.phone },
              defaults: { reason: banReason || "Violation of community guidelines." }
            });
          } catch (err) {
            console.error("[adminController] Failed to add BannedIdentity:", err);
          }
        }

        // 2. Clear all active matches involving the banned user
        await Match.destroy({
          where: {
            [Op.or]: [{ userAId: targetUserId }, { userBId: targetUserId }]
          }
        });

        // 3. Eject their active WebSocket connections instantly
        if (req.io) {
          req.io.to(`user_${targetUserId}`).disconnectSockets(true);
          console.log(`[adminController] Ejected banned user ${targetUserId} from socket connections.`);
        }
      }
    }

    res.json({ success: true, message: "Report resolved successfully." });
  } catch (err) {
    console.error("[adminController] resolveReport error:", err);
    res.status(500).json({ success: false, error: "Failed to resolve report." });
  }
}

// GET /admin/dashboard-stats
async function getDashboardStats(req, res) {
  const check = verifyAdminKey(req);
  if (!check.valid) {
    return res.status(check.status).json({ success: false, error: check.error });
  }

  try {
    const pendingVerificationsCount = await User.count({ where: { verificationStatus: "pending" } });
    const pendingReportsCount = await Report.count({ where: { status: "pending" } });
    const pendingAppealsCount = await User.count({ where: { appealStatus: "pending" } });

    res.json({
      success: true,
      stats: {
        pendingVerifications: pendingVerificationsCount,
        pendingReports: pendingReportsCount,
        pendingAppeals: pendingAppealsCount
      }
    });
  } catch (err) {
    console.error("[adminController] getDashboardStats error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch dashboard stats." });
  }
}

// GET /admin/appeals
async function getAppeals(req, res) {
  const check = verifyAdminKey(req);
  if (!check.valid) {
    return res.status(check.status).json({ success: false, error: check.error });
  }

  try {
    const appeals = await User.findAll({
      where: { appealStatus: "pending" },
      attributes: ["id", "name", "phone", "banReason", "appealText", "updatedAt"],
      order: [["updatedAt", "ASC"]]
    });
    res.json({ success: true, count: appeals.length, appeals });
  } catch (err) {
    console.error("[adminController] getAppeals error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch pending appeals." });
  }
}

// POST /admin/appeals/:id/resolve
async function resolveAppeal(req, res) {
  const check = verifyAdminKey(req);
  if (!check.valid) {
    return res.status(check.status).json({ success: false, error: check.error });
  }

  const userId = req.params.id;
  const { action } = req.body; // 'reinstate' or 'uphold'

  if (action !== "reinstate" && action !== "uphold") {
    return res.status(400).json({ success: false, error: "Invalid action. Must be 'reinstate' or 'uphold'." });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    if (action === "reinstate") {
      await user.update({
        isBanned: false,
        banReason: null,
        appealStatus: "resolved",
        appealText: null
      });

      // Send push alert if they have push token
      if (user.expoPushToken) {
        const { sendPushNotification } = require("../utils/push");
        sendPushNotification(
          user.expoPushToken,
          "Account Reinstated! 🎉",
          "Good news — after reviewing your appeal, we've reinstated your Lovly account. You can log in normally now.",
          { type: "account_reinstated" }
        ).catch(e => console.error("Reinstate push failed:", e));
      }
    } else {
      // uphold
      await user.update({
        appealStatus: "resolved"
      });

      // Send push alert
      if (user.expoPushToken) {
        const { sendPushNotification } = require("../utils/push");
        sendPushNotification(
          user.expoPushToken,
          "Appeal Update ⚠️",
          "After reviewing your appeal, we've decided to keep your account suspended. This decision is final.",
          { type: "appeal_upheld" }
        ).catch(e => console.error("Appeal Uphold push failed:", e));
      }
    }

    res.json({ success: true, message: `Appeal resolved with action: ${action}.` });
  } catch (err) {
    console.error("[adminController] resolveAppeal error:", err);
    res.status(500).json({ success: false, error: "Failed to resolve appeal." });
  }
}

// POST /admin/run-cleaners
async function runCleaners(req, res) {
  const check = verifyAdminKey(req);
  if (!check.valid) {
    return res.status(check.status).json({ success: false, error: check.error });
  }

  const { Op } = require("sequelize");
  const { Match, Swipe, User } = require("../models");
  const results = { matchesExpired: 0, likesExpiredInactive: 0, likesExpiredStale: 0 };

  try {
    const now = new Date();
    // 1. Expire matches
    const expiredCount = await Match.update(
      { status: "unmatched" },
      {
        where: {
          status: "active",
          restrictedMode: true,
          firstMessageSent: false,
          messageDeadline: { [Op.lt]: now }
        }
      }
    );
    results.matchesExpired = expiredCount[0];

    // 2. Expire likes from inactive users
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const inactiveUsers = await User.findAll({
      attributes: ["id"],
      where: { lastActiveAt: { [Op.lt]: thirtyDaysAgo } }
    });
    
    const inactiveUserIds = inactiveUsers.map(u => u.id);
    if (inactiveUserIds.length > 0) {
      const [updatedCount] = await Swipe.update(
        { expiredAt: new Date() },
        {
          where: {
            swiperId: { [Op.in]: inactiveUserIds },
            expiredAt: null
          }
        }
      );
      results.likesExpiredInactive = updatedCount;
    }

    // 3. Expire unanswered likes strictly older than 30 days
    const [staleSwipeCount] = await Swipe.update(
      { expiredAt: new Date() },
      {
        where: {
          direction: { [Op.in]: ["like", "superlike"] },
          expiredAt: null,
          createdAt: { [Op.lt]: thirtyDaysAgo }
        }
      }
    );
    results.likesExpiredStale = staleSwipeCount;

    res.json({ success: true, results });
  } catch (err) {
    console.error("[adminController] runCleaners error:", err);
    res.status(500).json({ success: false, error: "Failed to run cleaners." });
  }
}

// GET /admin/analytics
async function getAnalytics(req, res) {
  const check = verifyAdminKey(req);
  if (!check.valid) {
    return res.status(check.status).json({ success: false, error: check.error });
  }

  const { sequelize } = require("../models");

  try {
    // 1. Total Users vs Verified Users
    const [[{ totalUsers, verifiedUsers }]] = await sequelize.query(`
      SELECT 
        COUNT(*) as "totalUsers",
        SUM(CASE WHEN is_verified = true THEN 1 ELSE 0 END) as "verifiedUsers"
      FROM users 
      WHERE is_test_account = false
    `);

    // 2. DAU (Daily Active Users)
    const [[{ dau }]] = await sequelize.query(`
      SELECT COUNT(*) as dau 
      FROM users 
      WHERE last_active_at >= NOW() - INTERVAL '24 hours' 
      AND is_test_account = false
    `);

    // 3. Match Rate (Total Matches / Total Likes)
    const [[{ totalMatches }]] = await sequelize.query(`
      SELECT COUNT(*) as "totalMatches" FROM matches
    `);
    const [[{ totalLikes }]] = await sequelize.query(`
      SELECT COUNT(*) as "totalLikes" FROM swipes WHERE direction IN ('like', 'superlike')
    `);

    const matchRate = totalLikes > 0 ? (totalMatches / totalLikes) : 0;

    // 4. Ghosting Rate (Matches with 0 messages)
    const [[{ totalMessages }]] = await sequelize.query(`
      SELECT COUNT(DISTINCT match_id) as "matchesWithMessage" FROM messages
    `);
    
    const ghostingRate = totalMatches > 0 ? ((totalMatches - totalMessages) / totalMatches) : 0;

    res.json({
      success: true,
      data: {
        totalUsers: parseInt(totalUsers || 0, 10),
        verifiedUsers: parseInt(verifiedUsers || 0, 10),
        dau: parseInt(dau || 0, 10),
        totalMatches: parseInt(totalMatches || 0, 10),
        totalLikes: parseInt(totalLikes || 0, 10),
        matchRate: parseFloat(matchRate.toFixed(4)),
        ghostingRate: parseFloat(ghostingRate.toFixed(4))
      }
    });
  } catch (err) {
    console.error("[adminController] getAnalytics error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch analytics." });
  }
}

// GET /admin/moderation-logs
async function getModerationLogs(req, res) {
  const check = verifyAdminKey(req);
  if (!check.valid) return res.status(check.status).json({ success: false, error: check.error });

  const { ModerationLog } = require("../models");
  try {
    const logs = await ModerationLog.findAll({
      order: [["createdAt", "DESC"]],
      limit: 100
    });
    res.json({ success: true, logs });
  } catch (err) {
    console.error("[adminController] getModerationLogs error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch logs." });
  }
}

// POST /admin/users/:id/shadow-ban
async function shadowBanUser(req, res) {
  const check = verifyAdminKey(req);
  if (!check.valid) return res.status(check.status).json({ success: false, error: check.error });

  const userId = req.params.id;
  const { action } = req.body; // 'apply' or 'lift'
  const { User, ModerationLog } = require("../models");

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, error: "User not found." });

    if (action === "apply") {
      await user.update({ isShadowBanned: true, shadowBannedAt: new Date() });
      await ModerationLog.create({ userId, actionType: "shadow_ban", reason: "Manual admin action." });
    } else {
      await user.update({ isShadowBanned: false, shadowBannedAt: null });
      await ModerationLog.create({ userId, actionType: "lift_shadow_ban", reason: "Manual admin action." });
    }

    res.json({ success: true, message: `Shadow ban ${action}ed.` });
  } catch (err) {
    console.error("[adminController] shadowBanUser error:", err);
    res.status(500).json({ success: false, error: "Failed to apply shadow ban." });
  }
}

// POST /admin/users/:id/strike
async function issueStrike(req, res) {
  const check = verifyAdminKey(req);
  if (!check.valid) return res.status(check.status).json({ success: false, error: check.error });

  const userId = req.params.id;
  const { reason, weight } = req.body;
  const safetyService = require("../services/safetyService");

  try {
    await safetyService.applyStrike(userId, reason || "Manual admin strike.", weight || 1, 1.0);
    res.json({ success: true, message: "Strike issued successfully." });
  } catch (err) {
    console.error("[adminController] issueStrike error:", err);
    res.status(500).json({ success: false, error: "Failed to issue strike." });
  }
}

module.exports = { 
  seedInviteCodes,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
  getReports,
  resolveReport,
  getDashboardStats,
  getAppeals,
  resolveAppeal,
  runCleaners,
  getAnalytics,
  getModerationLogs,
  shadowBanUser,
  issueStrike
};


export {};
