require("dotenv").config();
const { Op } = require("sequelize");
const { Match, Swipe, User, sequelize } = require("../models");

async function runCleanup() {
  console.log("[cleaner] Starting database cleanup run...");
  const transaction = await sequelize.transaction();

  try {
    const now = new Date();
    
    // 1. Expire restricted matches where the first message deadline has passed
    const [expiredMatchesCount] = await Match.update(
      { status: "unmatched" },
      {
        where: {
          status: "active",
          restrictedMode: true,
          firstMessageSent: false,
          messageDeadline: { [Op.lt]: now }
        },
        transaction
      }
    );
    if (expiredMatchesCount > 0) {
      console.log(`[cleaner] Auto-expired ${expiredMatchesCount} matches.`);
    }

    // 2. Soft-expire likes from users who have been inactive for over 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const inactiveUsers = await User.findAll({
      attributes: ["id"],
      where: {
        lastActiveAt: { [Op.lt]: thirtyDaysAgo }
      },
      transaction
    });
    
    const inactiveUserIds = inactiveUsers.map(u => u.id);
    
    if (inactiveUserIds.length > 0) {
      const [expiredLikesCount] = await Swipe.update(
        { expiredAt: new Date() },
        {
          where: {
            swiperId: { [Op.in]: inactiveUserIds },
            expiredAt: null
          },
          transaction
        }
      );
      if (expiredLikesCount > 0) {
        console.log(`[cleaner] Soft-expired ${expiredLikesCount} likes from inactive users.`);
      }
    }

    await transaction.commit();
    console.log("[cleaner] Database cleanup run completed successfully.");
    process.exit(0);
  } catch (err) {
    try {
      await transaction.rollback();
    } catch (rollbackErr) {
      console.error("[cleaner] Transaction rollback failed:", rollbackErr);
    }
    console.error("[cleaner] Database cleanup run failed:", err);
    process.exit(1);
  }
}

runCleanup();

export {};
