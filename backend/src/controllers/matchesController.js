const { Op } = require("sequelize");
const { Match, User, Photo, Message } = require("../models");

// GET /matches
async function listMatches(req, res) {
  const myId = req.dbUser.id;

  const matches = await Match.findAll({
    where: {
      status: "active",
      [Op.or]: [{ userAId: myId }, { userBId: myId }],
    },
    include: [
      { model: User, as: "userA", include: [{ model: Photo, as: "photos" }] },
      { model: User, as: "userB", include: [{ model: Photo, as: "photos" }] },
      { 
        model: Message, 
        as: "messages",
        order: [["createdAt", "DESC"]],
        limit: 1 // Fetch just the latest message for preview
      }
    ],
    order: [["createdAt", "DESC"]],
  });

  // Return the *other* user in each match, not both sides.
  const shaped = matches.map((m) => {
    const other = m.userAId === myId ? m.userB : m.userA;
    const lastMessage = m.messages && m.messages.length > 0 ? m.messages[0].content : null;
    const lastMessageTime = m.messages && m.messages.length > 0 ? m.messages[0].createdAt : m.createdAt;
    
    return { matchId: m.id, matchedAt: m.createdAt, user: other, lastMessage, lastMessageTime };
  });

  res.json({ success: true, matches: shaped });
}

// POST /matches/:id/unmatch
async function unmatch(req, res) {
  const myId = req.dbUser.id;
  const match = await Match.findByPk(req.params.id);

  if (!match) return res.status(404).json({ success: false, error: "Match not found" });
  if (match.userAId !== myId && match.userBId !== myId) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  await match.update({ status: "unmatched" });
  res.json({ success: true });
}

// GET /matches/:id/messages
async function getMessages(req, res) {
  const myId = req.dbUser.id;
  const matchId = req.params.id;

  const match = await Match.findByPk(matchId);
  if (!match) return res.status(404).json({ success: false, error: "Match not found" });
  if (match.userAId !== myId && match.userBId !== myId) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  const messages = await Message.findAll({
    where: { matchId },
    order: [["createdAt", "ASC"]],
  });

  res.json({ success: true, messages });
}

// POST /matches/:id/messages
async function sendMessage(req, res) {
  const myId = req.dbUser.id;
  const matchId = req.params.id;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, error: "Message content required" });
  }

  const match = await Match.findByPk(matchId);
  if (!match) return res.status(404).json({ success: false, error: "Match not found" });
  if (match.userAId !== myId && match.userBId !== myId) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  const message = await Message.create({
    matchId,
    senderId: myId,
    content: content.trim(),
  });

  // Update match updatedAt to reflect new activity
  await match.update({ updatedAt: new Date() });

  // Emit to socket room
  if (req.io) {
    req.io.to(`match_${matchId}`).emit("new_message", message);
  }

  // Send push notification
  const otherUserId = match.userAId === myId ? match.userBId : match.userAId;
  const otherUser = await User.findByPk(otherUserId);
  if (otherUser && otherUser.expoPushToken) {
    const { sendPushNotification } = require("../utils/push");
    await sendPushNotification(
      otherUser.expoPushToken,
      "New Message",
      `${req.dbUser.name || "Someone"}: ${content.trim()}`,
      { type: "message", matchId }
    );
  }

  res.status(201).json({ success: true, message });
}

// GET /matches/:id
async function getMatch(req, res) {
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
}

module.exports = { listMatches, unmatch, getMessages, sendMessage, getMatch };
