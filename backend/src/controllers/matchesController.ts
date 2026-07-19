const { Op } = require("sequelize");
const { Match, User, Photo, Message } = require("../models");

function formatMatchUser(user) {
  if (!user) return null;
  const u = user.toJSON ? user.toJSON() : user;
  u.hasPhone = u.phone !== null && u.phone !== undefined;
  delete u.phone;
  delete u.firebaseUid;
  delete u.dailyLikesUsed;
  delete u.dailySuperLikesUsed;
  delete u.lastDailyLikeReset;
  return u;
}

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

    // Auto-expire matches dynamically on lookup
    const activeMatches = [];
    for (const m of matches) {
      if (m.restrictedMode && !m.firstMessageSent && m.messageDeadline && new Date() > new Date(m.messageDeadline)) {
        m.update({ status: "unmatched" }).catch(err => console.error("Failed to auto-expire match:", err));
      } else {
        activeMatches.push(m);
      }
    }

    // Instead of nested include with limit: 1, fetch latest message per match safely
    const matchIds = activeMatches.map(m => m.id);
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

    const shaped = activeMatches.map((m) => {
      const other = m.userAId === myId ? m.userB : m.userA;
      const formattedOther = formatMatchUser(other);
      // Optimize payload: only send primary photo for match previews
      if (formattedOther && formattedOther.photos && formattedOther.photos.length > 0) {
         formattedOther.photos = [formattedOther.photos[0]];
      }

      const msg = latestMessages[m.id];
      const lastMessage = msg ? msg.content : null;
      const lastMessageTime = msg ? msg.createdAt : m.createdAt;
      const read = msg ? (msg.senderId === myId || msg.isRead === true) : true;
      
      return { 
        matchId: m.id, 
        matchedAt: m.createdAt, 
        user: formattedOther, 
        lastMessage, 
        lastMessageTime,
        read,
        restrictedMode: m.restrictedMode,
        onlyUserIdCanMessageFirst: m.onlyUserIdCanMessageFirst,
        messageDeadline: m.messageDeadline,
        firstMessageSent: m.firstMessageSent,
        chatUnlocked: m.chatUnlocked,
        firstMessageSenderId: m.firstMessageSenderId
      };
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

    const whereClause: any = { matchId };
    
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

    // Expiration and permission validation checks
    if (match.status !== "active") {
      return res.status(400).json({ success: false, error: "Match is not active" });
    }

    if (match.restrictedMode && !match.firstMessageSent) {
      // Auto-expire check before sending
      if (match.messageDeadline && new Date() > new Date(match.messageDeadline)) {
        await match.update({ status: "unmatched" });
        return res.status(400).json({ success: false, error: "Match has expired" });
      }

      // Check if current user is the one allowed to message first
      if (match.onlyUserIdCanMessageFirst !== myId) {
        return res.status(403).json({ 
          success: false, 
          error: "Only the matching woman can send the first message" 
        });
      }
    }

    const textToCheck = content.toLowerCase();
    
    // Phase 7: Extended harassment and scam detection
    const scamKeywords = [
      "money", "crypto", "gift card", "giftcard", "wire transfer", 
      "western union", "send cash", "gpay", "cash app", "venmo", 
      "bank account", "bitcoin", "ethereum"
    ];
    
    const harassmentKeywords = [
      "bitch", "slut", "whore", "cunt", "kill yourself", "die",
      "send nudes", "send pics", "fuck you", "ugly", "fat",
      "rape", "murder", "stalk"
    ];

    const scamWarningTriggered = scamKeywords.some(keyword => textToCheck.includes(keyword));
    const harassmentWarningTriggered = harassmentKeywords.some(keyword => textToCheck.includes(keyword));
    
    const requiresAdminReview = scamWarningTriggered || harassmentWarningTriggered;

    const message = await Message.create({
      matchId,
      senderId: myId,
      content: content.trim(),
      scamWarningTriggered: requiresAdminReview, // we can rename this column later, for now we reuse it
    });

    const isFirstRestrictedMessage = match.restrictedMode && !match.firstMessageSent;
 
     // Mark first message sent to unlock restricted match
     if (isFirstRestrictedMessage) {
       await match.update({ 
         firstMessageSent: true, 
         chatUnlocked: true,
         firstMessageSenderId: myId,
         messageDeadline: null,
         updatedAt: new Date() 
       });
     } else {
       await match.update({ updatedAt: new Date() });
     }
 
     if (req.io) {
       req.io.to(`match_${matchId}`).emit("new_message", message);
       if (isFirstRestrictedMessage) {
         req.io.to(`match_${matchId}`).emit("match_unlocked", {
           matchId,
           chatUnlocked: true,
           firstMessageSent: true,
           firstMessageSenderId: myId
         });
       }
     }
 
     // Fix N+1: Use pre-fetched user from include
     const otherUser = match.userAId === myId ? match.userB : match.userA;
     if (otherUser && otherUser.expoPushToken) {
       const { sendPushNotification } = require("../utils/push");
       const pushTitle = isFirstRestrictedMessage ? "Conversation Started" : "New Message";
       const pushBody = isFirstRestrictedMessage ? "She started the conversation." : `${req.dbUser.name || "Someone"}: ${content.trim()}`;
       
       sendPushNotification(
         otherUser.expoPushToken,
         pushTitle,
         pushBody,
         { type: "message", matchId }
       ).catch(e => console.error("Push failed:", e));
     }

    res.status(201).json({ success: true, message, scamWarningTriggered });
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

    // Auto-expire check dynamically on lookup
    if (match.status === "active" && match.restrictedMode && !match.firstMessageSent && match.messageDeadline && new Date() > new Date(match.messageDeadline)) {
      await match.update({ status: "unmatched" });
      return res.status(404).json({ success: false, error: "Match expired" });
    }

    const other = match.userAId === myId ? match.userB : match.userA;
    const formattedOther = formatMatchUser(other);
    res.json({ 
      success: true, 
      match: { 
        matchId: match.id, 
        matchedAt: match.createdAt, 
        user: formattedOther,
        restrictedMode: match.restrictedMode,
        onlyUserIdCanMessageFirst: match.onlyUserIdCanMessageFirst,
        messageDeadline: match.messageDeadline,
        firstMessageSent: match.firstMessageSent,
        chatUnlocked: match.chatUnlocked,
        firstMessageSenderId: match.firstMessageSenderId
      } 
    });
  } catch (err) {
    console.error("[matchesController] getMatch error:", err);
    res.status(500).json({ success: false, error: "Failed to get match" });
  }
}

async function getAiStarters(req, res) {
  try {
    const myId = req.dbUser.id;
    const isPremium = req.dbUser.isPremium === true;

    if (!isPremium) {
      return res.status(403).json({
        success: false,
        error: "AI Conversation Starters are a premium feature. Please upgrade to unlock."
      });
    }

    const matchId = req.params.id;
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

    const me = match.userAId === myId ? match.userA : match.userB;
    const them = match.userAId === myId ? match.userB : match.userA;

    const myInterests = me.interests || [];
    const theirInterests = them.interests || [];
    const sharedInterests = myInterests.filter(i => theirInterests.includes(i));

    const getOfflineStarters = () => {
      if (sharedInterests.length > 0) {
        const interest = sharedInterests[0];
        return [
          `Hey ${them.name}! I noticed we both love ${interest}. What's your favorite thing about it?`,
          `Great matching with you, ${them.name}! Since we both enjoy ${interest}, any recommendations?`,
          `Hey! Ready to talk about our shared love for ${interest}? 😊`
        ];
      } else if (theirInterests.length > 0) {
        const interest = theirInterests[0];
        return [
          `Hey ${them.name}! I saw on your profile that you enjoy ${interest}. Tell me more!`,
          `Hi! How did you get started with ${interest}? It sounds really cool.`,
          `Hey! Your profile caught my eye, especially your interest in ${interest}. How's your week going?`
        ];
      } else {
        return [
          `Hey ${them.name}! I loved reading your bio. How's your week treating you?`,
          `Hi ${them.name}! What's one thing you're excited about this weekend?`,
          `Hey there! Let's skip the small talk—what's your absolute favorite spot in Pune?`
        ];
      }
    };

    const geminiKey = process.env.GEMINI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!geminiKey && !anthropicKey) {
      console.log("[AI Starters] No API key found. Using local fallback.");
      return res.json({ success: true, starters: getOfflineStarters() });
    }

    const systemPrompt = "You are a witty, charming dating assistant. You are given the profiles of two matched users on a dating app. Suggest 3 personalized, engaging icebreaker opening messages (under 120 characters each) that the user (User A) can send to their match (User B) based on shared interests or details from their profiles. Avoid clichés. Return ONLY the 3 suggestions as a JSON array of strings, nothing else.";
    const userPrompt = `User A (Sender): Name=${me.name}, Bio="${me.bio || ''}", Interests=${myInterests.join(', ')}\nUser B (Recipient): Name=${them.name}, Bio="${them.bio || ''}", Interests=${theirInterests.join(', ')}`;

    let content = "";

    if (geminiKey) {
      // Call Google Gemini 1.5 Flash
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nUser Input:\n${userPrompt}` }] }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini status ${response.status}`);
      }

      const data = await response.json();
      content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    } else {
      // Call Anthropic Claude
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 300,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic status ${response.status}`);
      }

      const data = await response.json();
      content = data.content?.[0]?.text;
    }

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const rawJson = jsonMatch ? jsonMatch[0] : content;
    const starters = JSON.parse(rawJson);

    if (Array.isArray(starters)) {
      return res.json({ success: true, starters: starters.map(s => s.trim().substring(0, 120)) });
    } else {
      throw new Error("Parsed response is not an array");
    }

  } catch (err) {
    console.warn("[AI Starters] AI call failed, using local:", err.message);
    return res.json({ success: true, starters: ["Hey there!", "How's your week going?", "Any fun plans this weekend?"] });
  }
}

module.exports = { listMatches, unmatch, getMessages, sendMessage, getMatch, getAiStarters };

export {};
