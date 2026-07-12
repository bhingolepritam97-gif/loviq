const { z } = require("zod");
const { sequelize, Swipe, Match } = require("../models");

const swipeSchema = z.object({
  swipedId: z.string().uuid(),
  direction: z.enum(["like", "pass", "superlike"]),
});

// POST /swipes  { swipedId, direction }
async function createSwipe(req, res) {
  const parsed = swipeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten() });
  }
  const { swipedId, direction } = parsed.data;
  const swiperId = req.dbUser.id;

  if (swiperId === swipedId) {
    return res.status(400).json({ success: false, error: "Cannot swipe on yourself" });
  }

  const result = await sequelize.transaction(async (t) => {
    // Upsert: if this pair was already swiped (e.g. re-surfaced after 90
    // days per the spec), update the direction rather than erroring.
    const [swipe] = await Swipe.upsert(
      { swiperId, swipedId, direction },
      { transaction: t, returning: true }
    );

    let match = null;
    if (direction === "like" || direction === "superlike") {
      const reciprocal = await Swipe.findOne({
        where: { swiperId: swipedId, swipedId: swiperId, direction: ["like", "superlike"] },
        transaction: t,
      });

      if (reciprocal) {
        // Order the pair consistently so the unique index on
        // (user_a_id, user_b_id) can't be violated by A-B vs B-A races.
        const [userAId, userBId] = [swiperId, swipedId].sort();
        [match] = await Match.findOrCreate({
          where: { userAId, userBId },
          defaults: { userAId, userBId, status: "active" },
          transaction: t,
        });
      }
    }

    return { swipe, match };
  });

  if (result.match) {
    const { User } = require("../models");
    const otherUser = await User.findByPk(swipedId);
    if (otherUser && otherUser.expoPushToken) {
      const { sendPushNotification } = require("../utils/push");
      await sendPushNotification(
        otherUser.expoPushToken,
        "New Match!",
        `You and ${req.dbUser.name || "someone"} liked each other!`,
        { type: "match", matchId: result.match.id }
      );
    }
  }

  res.status(201).json({
    success: true,
    swipe: result.swipe,
    match: result.match, // null unless this swipe just created a mutual match
  });
}

module.exports = { createSwipe };
