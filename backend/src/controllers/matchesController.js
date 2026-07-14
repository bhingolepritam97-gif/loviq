const { Op } = require("sequelize");
const { Match, User, Photo, Message } = require("../models");

// GET /matches
async function listMatches(req, res) {
  try {
    const myId = req.dbUser.id;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;

    const matches = await Match.findAll({
      where: {
        status: "active",
        [Op.or]: [{ userAId: myId }, { userBId: myId }],
      },
      include: [
        { model: User, as: "userA", include: [{ model: Photo, as: "photos" }] },
        { model: User, as: "userB", include: [{ model: Photo, as: "photos" }] }
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset
    });

    // Instead of nested include with limit: 1, fetch latest message per match safely
    const matchIds = matches.map(m => m.id);
    const latestMessages = {};
    
    if (matchIds.length > 0) {
      for (const mId of matchIds) {
        const msg = await Message.findOne({
          where: { matchId: mId },
          order: [["createdAt", "DESC"]]
        });
        if (msg) latestMessages[mId] = msg;
      }
    }

    const shaped = matches.map((m) => {
      const other = m.userAId === myId ? m.userB : m.userA;
      // Optimize payload: only send primary photo for match previews
      if (other && other.photos && other.photos.length > 0) {
         other.photos = [other.photos[0]];
      }

      const msg = latestMessages[m.id];
      const lastMessage = msg ? msg.content : null;
      const lastMessageTime = msg ? msg.createdAt : m.createdAt;
      
      return { matchId: m.id, matchedAt: m.createdAt, user: other, lastMessage, lastMessageTime };
    });

    res.json({ success: true, matches: shaped });
  } catch (err) {
    console.error("[matchesController] listMatches error:", err);
    res.status(500).json({ success: false, error: "Failed to list matches" });
  }
}

// POST /matches/:id/unmatch
async function unmatch(req, res) {
  try {
    const myId = req.dbUser.id;
    const match = await Match.findByPk(req.params.id);

    if (!match) return res.status(404).json({ success: false, error: "Match not found" });
    if (match.userAId !== myId && match.userBId !== myId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    await match.update({ status: "unmatched" });
    res.json({ success: true });
  } catch (err) {
    console.error("[matchesController] unmatch error:", err);
    res.status(500).json({ success: false, error: "Failed to unmatch" });
  }
}

// GET /matches/:id/messages
async function getMessages(req, res) {
  try {
    const myId = req.dbUser.id;
    const matchId = req.params.id;
    const limit = parseInt(req.query.limit, 10) || 50;
    const cursor = req.query.cursor; // Last seen message ID

    const match = await Match.findByPk(matchId);
    if (!match) return res.status(404).json({ success: false, error: "Match not found" });
    if (match.userAId !== myId && match.userBId !== myId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const whereClause = { matchId };
    
    if (cursor) {
      const cursorMsg = await Message.findByPk(cursor);
      if (cursorMsg) {
        whereClause.createdAt = { [Op.lt]: cursorMsg.createdAt };
      }
    }

    const messages = await Message.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]], // Get most recent `limit` messages
      limit
    });

    // Return in chronological order for UI
    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    console.error("[matchesController] getMessages error:", err);
    res.status(500).json({ success: false, error: "Failed to load messages" });
  }
}

// POST /matches/:id/messages
async function sendMessage(req, res) {
  try {
    const myId = req.dbUser.id;
    const matchId = req.params.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: "Message content required" });
    }

    const match = await Match.findByPk(matchId, {
      include: [
        { model: User, as: "userA" },
        { model: User, as: "userB" }
      ]
    });
    
    if (!match) return res.status(404).json({ success: false, error: "Match not found" });
    if (match.userAId !== myId && match.userBId !== myId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const message = await Message.create({
      matchId,
      senderId: myId,
      content: content.trim(),
    });

    await match.update({ updatedAt: new Date() });

    if (req.io) {
      req.io.to(`match_${matchId}`).emit("new_message", message);
    }

    // Fix N+1: Use pre-fetched user from include
    const otherUser = match.userAId === myId ? match.userB : match.userA;
    if (otherUser && otherUser.expoPushToken) {
      const { sendPushNotification } = require("../utils/push");
      sendPushNotification(
        otherUser.expoPushToken,
        "New Message",
        `${req.dbUser.name || "Someone"}: ${content.trim()}`,
        { type: "message", matchId }
      ).catch(e => console.error("Push failed:", e));
    }

    res.status(201).json({ success: true, message });
  } catch (err) {
    console.error("[matchesController] sendMessage error:", err);
    res.status(500).json({ success: false, error: "Failed to send message" });
  }
}

// GET /matches/:id
async function getMatch(req, res) {
  try {
    const myId = req.dbUser.id;
    const matchId = req.params.id;

    const match = await Match.findByPk(matchId, {
      include: [
        { model: User, as: "userA", include: [{ model: Photo, as: "photos" }] },
        { model: User, as: "userB", include: [{ model: Photo, as: "photos" }] },
      ]
    });

    if (!match) return res.status(404).json({ success: false, error: "Match not found" });
    if (match.userAId !== myId && match.userBId !== myId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const other = match.userAId === myId ? match.userB : match.userA;
    res.json({ success: true, match: { matchId: match.id, matchedAt: match.createdAt, user: other } });
  } catch (err) {
    console.error("[matchesController] getMatch error:", err);
    res.status(500).json({ success: false, error: "Failed to get match" });
  }
}

module.exports = { listMatches, unmatch, getMessages, sendMessage, getMatch };
