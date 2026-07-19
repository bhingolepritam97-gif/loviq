const { z } = require("zod");
const { sequelize, Swipe, Match } = require("../models");

const swipeSchema = z.object({
  swipedId: z.string().uuid(),
  direction: z.enum(["like", "pass", "superlike"]),
  likedContentType: z.enum(["photo", "prompt_answer", "voice_note"]).optional(),
  likedContentId: z.string().uuid().optional(),
  commentText: z.string().max(140).optional(),
});

// POST /swipes
async function createSwipe(req, res) {
  const parsed = swipeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten() });
  }
  const { swipedId, direction, likedContentType, likedContentId, commentText } = parsed.data;
  const swiperId = req.dbUser.id;

  // Enforce daily likes cap for free tier
  const userTier = req.dbUser.tier || "free";
  if (userTier === "free" && ["like", "superlike"].includes(direction)) {
    const now = new Date();
    const lastReset = req.dbUser.lastDailyLikeReset ? new Date(req.dbUser.lastDailyLikeReset) : new Date(0);
    
    let likesUsed = req.dbUser.dailyLikesUsed;
    let superLikesUsed = req.dbUser.dailySuperLikesUsed;
    
    // Reset limits if 24 hours have passed
    if (now.getTime() - lastReset.getTime() > 24 * 60 * 60 * 1000) {
      likesUsed = 0;
      superLikesUsed = 0;
    }

    if (direction === "like" && likesUsed >= 10) {
      return res.status(403).json({
        success: false,
        error: "Daily likes limit reached. Upgrade to Plus or Premium for unlimited likes!"
      });
    }

    if (direction === "superlike" && superLikesUsed >= 1) {
      return res.status(403).json({
        success: false,
        error: "Daily superlike limit reached. Upgrade to Premium for more!"
      });
    }
  }

  // Enforce daily incoming likes reception limit (50 likes cap) to prevent feed overload
  if (["like", "superlike"].includes(direction)) {
    const { Op } = require("sequelize");
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const incomingLikesCount = await Swipe.count({
      where: {
        swipedId,
        direction: { [Op.in]: ["like", "superlike"] },
        createdAt: { [Op.gte]: twentyFourHoursAgo }
      }
    });

    if (incomingLikesCount >= 50) {
      return res.status(429).json({
        success: false,
        error: "This user's feed is currently full. Try matching with them again tomorrow!"
      });
    }
  }

  if (swiperId === swipedId) {
    return res.status(400).json({ success: false, error: "Cannot swipe on yourself" });
  }

  try {
    const result = await sequelize.transaction(async (t) => {
      // Lock the swiper and swiped user rows in consistent alphabetical order to serialize concurrent operations
      const { User } = require("../models");
      const sortedIds = [swiperId, swipedId].sort();
      await User.findAll({
        where: { id: sortedIds },
        transaction: t,
        lock: t.LOCK.UPDATE,
        order: [["id", "ASC"]]
      });

      // Confirm the liked content actually belongs to swipedId (prevents spoofing)
      if (likedContentType && likedContentId) {
        let contentBelongsToUser = false;
        if (likedContentType === "photo") {
          const { Photo } = require("../models");
          const photo = await Photo.findOne({ where: { id: likedContentId, userId: swipedId }, transaction: t });
          contentBelongsToUser = !!photo;
        } else if (likedContentType === "prompt_answer" || likedContentType === "voice_note") {
          const { UserPromptAnswer } = require("../models");
          const answer = await UserPromptAnswer.findOne({ where: { id: likedContentId, userId: swipedId }, transaction: t });
          contentBelongsToUser = !!answer;
        }
        
        if (!contentBelongsToUser) {
          throw new Error("Content does not belong to this user");
        }
      }

      // Upsert: if this pair was already swiped (e.g. re-surfaced after 90
      // days per the spec), update the direction rather than erroring.
      const [swipe] = await Swipe.upsert(
        { 
          swiperId, 
          swipedId, 
          direction,
          likedContentType: likedContentType || null,
          likedContentId: likedContentId || null,
          commentText: commentText || null
        },
        { transaction: t, returning: true }
      );

      let match = null;
      if (direction === "like" || direction === "superlike") {
        const reciprocal = await Swipe.findOne({
          where: { swiperId: swipedId, swipedId: swiperId, direction: ["like", "superlike"] },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (reciprocal) {
          // Order the pair consistently so the unique index on
          // (user_a_id, user_b_id) can't be violated by A-B vs B-A races.
          const [userAId, userBId] = [swiperId, swipedId].sort();
          
          const UserModel = require("../models/user");
          const userA = await UserModel.findByPk(userAId, { transaction: t });
          const userB = await UserModel.findByPk(userBId, { transaction: t });

           const isMixedGender = (userA.gender === "Woman" && userB.gender === "Man") ||
                                 (userA.gender === "Man" && userB.gender === "Woman");
 
           let restrictedMode = false;
           let onlyUserIdCanMessageFirst = null;
           let messageDeadline = null;
           let chatUnlocked = true;
 
           if (isMixedGender) {
             restrictedMode = true;
             chatUnlocked = false;
             if (userA.gender === "Woman") {
               onlyUserIdCanMessageFirst = userA.id;
             } else if (userB.gender === "Woman") {
               onlyUserIdCanMessageFirst = userB.id;
             }
           }
 
           if (restrictedMode) {
             messageDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
           }
 
           [match] = await Match.findOrCreate({
             where: { userAId, userBId },
             defaults: { 
               userAId, 
               userBId, 
               status: "active",
               restrictedMode,
               onlyUserIdCanMessageFirst,
               messageDeadline,
               firstMessageSent: false,
               chatUnlocked
             },
             transaction: t,
           });
        }
      }

      // Update counters if free tier and not a pass
      if (userTier === "free" && ["like", "superlike"].includes(direction)) {
        const { User } = require("../models");
        const swiperUser = await User.findByPk(swiperId, { transaction: t, lock: t.LOCK.UPDATE });
        const now = new Date();
        let likesUsed = swiperUser.dailyLikesUsed;
        let superLikesUsed = swiperUser.dailySuperLikesUsed;
        const lastReset = swiperUser.lastDailyLikeReset ? new Date(swiperUser.lastDailyLikeReset) : new Date(0);
        
        if (now.getTime() - lastReset.getTime() > 24 * 60 * 60 * 1000) {
          likesUsed = 0;
          superLikesUsed = 0;
        }

        if (direction === "like") likesUsed++;
        if (direction === "superlike") superLikesUsed++;

        await swiperUser.update({
          dailyLikesUsed: likesUsed,
          dailySuperLikesUsed: superLikesUsed,
          lastDailyLikeReset: now
        }, { transaction: t });
      }

      return { swipe, match };
    });

    if (result.match) {
      const { User } = require("../models");
      const swiper = req.dbUser;
      const swiped = await User.findByPk(swipedId);
      const { sendPushNotification } = require("../utils/push");
 
      const getBody = (recipient: any, sender: any) => {
        const isMixed = (recipient.gender === "Woman" && sender.gender === "Man") ||
                        (recipient.gender === "Man" && sender.gender === "Woman");
        if (isMixed) {
          if (recipient.gender === "Woman") {
            return `You have a new match! Say hello.`;
          } else {
            return `You matched! She can start the conversation.`;
          }
        }
        return `You and ${sender.name || "someone"} liked each other!`;
      };
 
      if (swiped && swiped.expoPushToken) {
        sendPushNotification(
          swiped.expoPushToken,
          "New Match!",
          getBody(swiped, swiper),
          { type: "match", matchId: result.match.id }
        ).catch((e: any) => console.error("Swiped push failed:", e));
      }
 
      if (swiper && swiper.expoPushToken) {
        sendPushNotification(
          swiper.expoPushToken,
          "New Match!",
          getBody(swiper, swiped),
          { type: "match", matchId: result.match.id }
        ).catch((e: any) => console.error("Swiper push failed:", e));
      }
    }

    res.status(201).json({
      success: true,
      swipe: result.swipe,
      match: result.match, // null unless this swipe just created a mutual match
    });
  } catch (err) {
    if (err.message === "Content does not belong to this user") {
      return res.status(400).json({ success: false, error: err.message });
    }
    console.error("[swipesController] createSwipe error:", err);
    res.status(500).json({ success: false, error: "Failed to process swipe" });
  }
}

async function getLikes(req, res) {
  const { User, Photo } = require("../models");
  const { Op } = require("sequelize");

  try {
    const myId = req.dbUser.id;
    const isPremium = req.dbUser.isPremium === true;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Find users I've already swiped on
    const mySwipes = await Swipe.findAll({
      attributes: ["swipedId"],
      where: { swiperId: myId }
    });
    const swipedUserIds = mySwipes.map(s => s.swipedId);

    const swiperIdCond = swipedUserIds.length > 0
      ? { [Op.notIn]: [...swipedUserIds, myId] }
      : { [Op.ne]: myId };

    // Base conditions for active incoming likes
    const baseWhere = {
      swipedId: myId,
      direction: { [Op.in]: ["like", "superlike"] },
      expiredAt: null,
      swiperId: swiperIdCond
    };

    const userInclude = {
      model: User,
      as: "swiper",
      required: true,
      where: {
        isVerified: true,
        isActive: true,
        isTestAccount: false,
        lastActiveAt: { [Op.gte]: thirtyDaysAgo }
      }
    };

    // 1. Get total count of incoming likes
    const count = await Swipe.count({
      where: baseWhere,
      include: [userInclude]
    });

    if (!isPremium) {
      return res.json({
        success: true,
        isPremium: false,
        count,
        likes: []
      });
    }

    // 2. Fetch the batch of likes (Smart Batching: max 6, superlikes first, then oldest first)
    const incomingLikes = await Swipe.findAll({
      where: baseWhere,
      include: [
        {
          ...userInclude,
          include: [{ model: Photo, as: "photos" }]
        }
      ],
      order: [
        ["direction", "DESC"], // 'superlike' comes before 'like' alphabetically when descending
        ["createdAt", "ASC"]   // Oldest first so people don't starve in the queue
      ],
      limit: 6
    });

    const { Prompt, UserPromptAnswer } = require("../models");
    const now = new Date();
    
    // Asynchronously enrich likes with content previews
    const shapedLikes = await Promise.all(incomingLikes.map(async like => {
      const u = like.swiper.toJSON();
      if (u.photos && u.photos.length > 0) {
        u.photos = [u.photos[0]];
      }
      
      if (u.lastActiveAt) {
        const lastActive = new Date(u.lastActiveAt);
        const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
        if (diffHours <= 24) {
          u.activityBadge = 'Active today';
        } else if (diffHours <= 168) {
          u.activityBadge = 'Active this week';
        } else {
          u.activityBadge = null;
        }
      } else {
        u.activityBadge = null;
      }

      // Fetch liked content preview if applicable
      let likedContentPreview = null;
      if (like.likedContentType && like.likedContentId) {
        if (like.likedContentType === 'photo') {
          const photo = await Photo.findByPk(like.likedContentId, { attributes: ['id', 'url'] });
          likedContentPreview = photo ? photo.toJSON() : null;
        } else if (like.likedContentType === 'prompt_answer' || like.likedContentType === 'voice_note') {
          const answer = await UserPromptAnswer.findByPk(like.likedContentId, {
            attributes: ['id', 'answerText', 'audioUrl'],
            include: [{ model: Prompt, as: 'prompt', attributes: ['questionText'] }],
          });
          likedContentPreview = answer ? answer.toJSON() : null;
        }
      }

      return {
        swipeId: like.id,
        swipedAt: like.createdAt,
        direction: like.direction,
        likedContentType: like.likedContentType,
        likedContentPreview,
        commentText: like.commentText,
        user: u
      };
    }));

    return res.json({
      success: true,
      isPremium: true,
      count,
      likes: shapedLikes
    });

  } catch (error) {
    console.error("[swipesController] getLikes error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch likes list" });
  }
}

async function getSent(req, res) {
  const { User, Photo } = require("../models");
  const { Op } = require("sequelize");

  try {
    const myId = req.dbUser.id;

    const sentSwipes = await Swipe.findAll({
      where: {
        swiperId: myId,
        direction: { [Op.in]: ["like", "superlike"] }
      },
      include: [
        {
          model: User,
          as: "swiped",
          required: true,
          where: { isActive: true },
          include: [{ model: Photo, as: "photos" }]
        }
      ],
      order: [["createdAt", "DESC"]],
      limit: 50
    });

    const shapedSent = sentSwipes.map(like => {
      const u = like.swiped.toJSON();
      if (u.photos && u.photos.length > 0) {
        u.photos = [u.photos[0]];
      }
      return {
        swipeId: like.id,
        swipedAt: like.createdAt,
        direction: like.direction,
        commentText: like.commentText,
        user: u
      };
    });

    return res.json({
      success: true,
      likes: shapedSent
    });

  } catch (error) {
    console.error("[swipesController] getSent error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch sent likes list" });
  }
}

async function recyclePasses(req, res) {
  try {
    const swiperId = req.dbUser.id;

    // Delete all swipes where direction is 'pass'
    const deletedCount = await Swipe.destroy({
      where: {
        swiperId,
        direction: 'pass'
      }
    });

    res.json({
      success: true,
      message: `Successfully recycled ${deletedCount} passed profiles.`,
      count: deletedCount
    });
  } catch (err) {
    console.error("[swipesController] recyclePasses error:", err);
    res.status(500).json({ success: false, error: "Failed to recycle skipped profiles." });
  }
}

async function rewindSwipe(req, res) {
  const { Op } = require("sequelize");
  const { Match } = require("../models");
  const swiperId = req.dbUser.id;
  const userTier = req.dbUser.tier || "free";

  if (userTier === "free") {
    return res.status(403).json({
      success: false,
      error: "Rewind is a premium feature. Please upgrade to Plus or Premium to unlock."
    });
  }

  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const lastSwipe = await Swipe.findOne({
      where: {
        swiperId,
        createdAt: { [Op.gte]: fiveMinutesAgo }
      },
      order: [["createdAt", "DESC"]]
    });

    if (!lastSwipe) {
      return res.status(400).json({
        success: false,
        error: "No recent swipe found to rewind."
      });
    }

    await Match.destroy({
      where: {
        [Op.or]: [
          { userAId: swiperId, userBId: lastSwipe.swipedId },
          { userAId: lastSwipe.swipedId, userBId: swiperId }
        ]
      }
    });

    await lastSwipe.destroy();

    res.json({
      success: true,
      message: "Last swipe successfully rewound."
    });
  } catch (err) {
    console.error("[swipesController] rewindSwipe error:", err);
    res.status(500).json({ success: false, error: "Failed to rewind swipe." });
  }
}

module.exports = { createSwipe, getLikes, getSent, recyclePasses, rewindSwipe };

export {};
