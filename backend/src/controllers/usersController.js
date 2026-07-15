const { z } = require("zod");
const { User, Photo, sequelize } = require("../models");

const profileUpdateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  birthdate: z.string().optional(), // YYYY-MM-DD
  gender: z.string().optional(),
  genderPreference: z.array(z.string()).optional(),
  bio: z.string().max(500).optional(),
  interests: z.array(z.string()).max(10).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  photos: z.array(z.string()).optional(),
  cityName: z.string().optional(),
  isActive: z.boolean().optional(),       // Pause/resume account visibility
  hideDistance: z.boolean().optional(),   // Hide exact distance from other users
  // Discovery filter preferences
  ageMin: z.number().int().min(18).max(100).optional(),
  ageMax: z.number().int().min(18).max(100).optional(),
  maxDistanceKm: z.number().min(1).max(200).optional(),
});

function isAdult(birthdateStr) {
  const birth = new Date(birthdateStr);
  const age = (Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return age >= 18;
}

// GET /users/me
async function getCurrentUser(req, res) {
  const user = await User.findByPk(req.dbUser.id, {
    include: [{ model: Photo, as: "photos", order: [["order", "ASC"]] }],
  });
  if (!user) return res.status(404).json({ success: false, error: "User not found" });
  res.json({ success: true, user });
}

// GET /users/:id
async function getUser(req, res) {
  const user = await User.findByPk(req.params.id, {
    include: [{ model: Photo, as: "photos", order: [["order", "ASC"]] }],
  });
  if (!user) return res.status(404).json({ success: false, error: "User not found" });

  // Users can only fetch their own full profile through this route in v1.
  if (user.id !== req.dbUser.id) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }
  res.json({ success: true, user });
}

async function _performProfileUpdate(user, reqBody, res) {
  try {
    const parsed = profileUpdateSchema.safeParse(reqBody);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }
    const data = parsed.data;

    if (data.birthdate && !isAdult(data.birthdate)) {
      return res.status(400).json({ success: false, error: "Must be 18 or older" });
    }

    const updates = { ...data };
    delete updates.latitude;
    delete updates.longitude;
    delete updates.photos;

    if (data.latitude != null && data.longitude != null) {
      updates.location = sequelize.fn(
        "ST_SetSRID",
        sequelize.fn("ST_MakePoint", data.longitude, data.latitude),
        4326
      );
    }

    // Wrap everything in a transaction so if photo creation fails, we don't end up with 0 photos
    await sequelize.transaction(async (t) => {
      await user.update(updates, { transaction: t });

      if (data.photos) {
        await Photo.destroy({ where: { userId: user.id }, transaction: t });
        const photoPromises = data.photos.map((url, i) => 
          Photo.create({
            userId: user.id,
            url,
            order: i,
            moderationStatus: 'approved',
          }, { transaction: t })
        );
        await Promise.all(photoPromises);
      }
    });

    // Mark profile complete once the required fields are all present.
    const refreshed = await User.findByPk(user.id, {
      include: [{ model: Photo, as: "photos", order: [["order", "ASC"]] }],
    });
    const hasRequiredFields =
      refreshed.name && refreshed.birthdate && refreshed.gender && refreshed.photos.length > 0;

    if (hasRequiredFields && !refreshed.profileCompleted) {
      await refreshed.update({ profileCompleted: true });
    }

    return res.json({ success: true, user: refreshed });
  } catch (error) {
    console.error("[usersController] Profile update error:", error);
    return res.status(500).json({ success: false, error: "Failed to update profile" });
  }
}

// PATCH /users/me
async function updateCurrentUser(req, res) {
  return _performProfileUpdate(req.dbUser, req.body, res);
}

// PATCH /users/:id
async function updateUser(req, res) {
  if (req.params.id !== req.dbUser.id) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }
  return _performProfileUpdate(req.dbUser, req.body, res);
}

// DELETE /users/:id  (soft-delete by default; ?hard=true for permanent)
async function deleteUser(req, res) {
  if (req.params.id !== req.dbUser.id) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  if (req.query.hard === "true") {
    await req.dbUser.destroy(); // permanent — cascades to photos via FK
    return res.json({ success: true, deleted: "hard" });
  }

  await req.dbUser.update({ isActive: false });
  res.json({ success: true, deleted: "soft" });
}

// POST /users/:id/photos  { url }
// NOTE: actual file upload (multipart -> S3/R2/Firebase Storage) is handled
// by a separate signed-upload step; this endpoint just registers the
// resulting URL against the user's profile.
async function addPhoto(req, res) {
  if (req.params.id !== req.dbUser.id) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, error: "url is required" });

  const existingCount = await Photo.count({ where: { userId: req.dbUser.id } });
  if (existingCount >= 6) {
    return res.status(400).json({ success: false, error: "Maximum 6 photos allowed" });
  }

  const photo = await Photo.create({
    userId: req.dbUser.id,
    url,
    order: existingCount,
    isPrimary: existingCount === 0,
  });
  res.status(201).json({ success: true, photo });
}

// DELETE /users/:id/photos/:photoId
async function deletePhoto(req, res) {
  if (req.params.id !== req.dbUser.id) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }
  const photo = await Photo.findOne({ where: { id: req.params.photoId, userId: req.dbUser.id } });
  if (!photo) return res.status(404).json({ success: false, error: "Photo not found" });

  await photo.destroy();
  res.json({ success: true });
}

// PATCH /users/:id/photos/order  { order: [photoId, photoId, ...] }
async function reorderPhotos(req, res) {
  if (req.params.id !== req.dbUser.id) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }
  const { order } = req.body;
  if (!Array.isArray(order)) {
    return res.status(400).json({ success: false, error: "order must be an array of photo IDs" });
  }

  await Promise.all(
    order.map((photoId, index) =>
      Photo.update(
        { order: index, isPrimary: index === 0 },
        { where: { id: photoId, userId: req.dbUser.id } }
      )
    )
  );
  res.json({ success: true });
}

// PATCH /users/me/push-token
async function updatePushToken(req, res) {
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, error: "Token required" });

  await req.dbUser.update({ expoPushToken: token });
  res.json({ success: true });
}

// POST /users/:id/block
async function blockUser(req, res) {
  if (req.params.id !== req.dbUser.id) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }
  const { blockedId } = req.body;
  if (!blockedId) return res.status(400).json({ success: false, error: "blockedId is required" });

  const { Block, Match, Swipe } = require("../models");
  
  try {
    await Block.findOrCreate({
      where: { blockerId: req.dbUser.id, blockedId },
    });

    // Clean up any existing matches or swipes
    await Match.destroy({
      where: {
        [sequelize.Op.or]: [
          { userAId: req.dbUser.id, userBId: blockedId },
          { userAId: blockedId, userBId: req.dbUser.id },
        ]
      }
    });

    await Swipe.destroy({
      where: {
        [sequelize.Op.or]: [
          { swiperId: req.dbUser.id, swipedId: blockedId },
          { swiperId: blockedId, swipedId: req.dbUser.id },
        ]
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Block error:", err);
    res.status(500).json({ success: false, error: "Failed to block user" });
  }
}

// GET /users/:id/blocks
async function getBlocks(req, res) {
  if (req.params.id !== req.dbUser.id) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  const { Block } = require("../models");

  try {
    const blocks = await Block.findAll({
      where: { blockerId: req.dbUser.id },
      include: [{ model: User, as: 'blocked', attributes: ['id', 'name', 'phone'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, blocks });
  } catch (err) {
    console.error("Get blocks error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch blocked users" });
  }
}

// DELETE /users/:id/block/:blockedId
async function unblockUser(req, res) {
  if (req.params.id !== req.dbUser.id) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }
  const { blockedId } = req.params;
  const { Block } = require("../models");

  try {
    const deleted = await Block.destroy({
      where: { blockerId: req.dbUser.id, blockedId },
    });
    if (deleted === 0) return res.status(404).json({ success: false, error: "Block not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("Unblock error:", err);
    res.status(500).json({ success: false, error: "Failed to unblock user" });
  }
}

// POST /users/:id/report
async function reportUser(req, res) {
  if (req.params.id !== req.dbUser.id) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }
  const { reportedId, reason } = req.body;
  if (!reportedId || !reason) return res.status(400).json({ success: false, error: "reportedId and reason are required" });

  const { Report } = require("../models");
  
  try {
    await Report.create({
      reporterId: req.dbUser.id,
      reportedId,
      reason
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Report error:", err);
    res.status(500).json({ success: false, error: "Failed to report user" });
  }
}

// POST /users/me/ai-suggestions
async function getAiSuggestions(req, res) {
  const { type, text, interests, promptQuestion } = req.body;

  if (!type || (type !== 'bio' && type !== 'prompt')) {
    return res.status(400).json({ success: false, error: "Type must be 'bio' or 'prompt'" });
  }

  const userDraft = text ? text.trim() : "";
  const userInterests = Array.isArray(interests) ? interests : [];

  // ── RICH OFFLINE SUGGESTIONS FALLBACK ─────────────────────────────────────
  const getOfflineSuggestions = () => {
    const interestStr = userInterests.length > 0 ? userInterests.slice(0, 3).join(", ") : "new experiences";
    if (type === 'bio') {
      return [
        `Always down for coffee, conversations, and ${interestStr}. Let's see where the adventure takes us!`,
        `Curious explorer who loves ${interestStr}. Looking for a partner-in-crime for weekend plans.`,
        `Let's start with a casual coffee and talk about ${userInterests[0] || 'our favorite movies'} and everything else.`
      ];
    } else {
      // Prompt completions based on predefined questions
      const q = promptQuestion || "";
      if (q.includes("Sunday")) {
        return [
          `Starting with a warm coffee, then exploring ${userInterests[0] || 'the outdoors'} or reading.`,
          `Finding a quiet corner at a coffee shop and plotting my next ${userInterests[1] || 'travel'} trip.`,
          `A mix of lazy mornings, cooking something new, and planning a weekend trek.`
        ];
      } else if (q.includes("fact")) {
        return [
          `That ${userInterests[0] || 'hiking'} releases more endorphins than scrolling on social media!`,
          `I actually once tried to learn ${userInterests[1] || 'photography'} in a single afternoon.`,
          `We share 99% of our DNA with chimpanzees, but I still can't survive without coffee.`
        ];
      } else if (q.includes("heart")) {
        return [
          `A good coffee recipe and a list of recommended hikes to try.`,
          `Sharing a passion for ${userInterests[0] || 'good travel spots'} and great music.`,
          `Honest laughs, kind gestures, and an openness to explore new things.`
        ];
      } else {
        return [
          `Sharing ideas about ${userInterests[0] || 'music'} and starting new hobbies.`,
          `A genuine smile, coffee mornings, and sharing a interest in ${userInterests[1] || 'adventures'}.`,
          `Showing up with positive vibes and a curiosity to learn about what makes you smile.`
        ];
      }
    }
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.log("[AI Suggestions] ANTHROPIC_API_KEY not found. Using local rich fallback.");
    return res.json({ success: true, suggestions: getOfflineSuggestions() });
  }

  // ── CALL ANTHROPIC API ──────────────────────────────────────────────────
  try {
    let systemPrompt = "";
    let userPrompt = "";

    if (type === 'bio') {
      systemPrompt = "You are a dating profile writing assistant. Given a user's rough bio draft and interests, suggest 3 short, warm, specific, non-generic bio rewrites. Avoid clichés like adventure-seeker or foodie. Keep each under 150 characters. Return only the 3 suggestions as a JSON array of strings, nothing else.";
      userPrompt = `Rough draft: "${userDraft}"\nInterests: ${userInterests.join(", ")}`;
    } else {
      systemPrompt = `You are a dating profile writing assistant. Given a user's rough answer to the prompt: "${promptQuestion || ''}" and their interests, suggest 3 short, warm, specific, non-generic prompt answer completions or rewrites. Keep each suggestion under 80 characters. Return only the 3 suggestions as a JSON array of strings, nothing else.`;
      userPrompt = `Rough answer: "${userDraft}"\nInterests: ${userInterests.join(", ")}`;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
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
      const errorText = await response.text();
      console.warn("[AI Suggestions] Anthropic API returned error response:", errorText);
      throw new Error(`Anthropic status ${response.status}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      throw new Error("Empty assistant content");
    }

    // Attempt to extract JSON array
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const rawJson = jsonMatch ? jsonMatch[0] : content;
    const suggestions = JSON.parse(rawJson);

    if (Array.isArray(suggestions)) {
      return res.json({ success: true, suggestions: suggestions.map(s => s.trim().substring(0, type === 'bio' ? 150 : 80)) });
    } else {
      throw new Error("Parsed response is not an array");
    }

  } catch (err) {
    console.warn("[AI Suggestions] Anthropic query failed, falling back to local:", err.message);
    return res.json({ success: true, suggestions: getOfflineSuggestions() });
  }
}

module.exports = { getCurrentUser, updateCurrentUser, getUser, updateUser, deleteUser, addPhoto, deletePhoto, reorderPhotos, updatePushToken, blockUser, unblockUser, getBlocks, reportUser, getAiSuggestions };
