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
  womenMessageFirstEnabled: z.boolean().optional(),
  // Discovery filter preferences
  ageMin: z.number().int().min(18).max(100).optional(),
  ageMax: z.number().int().min(18).max(100).optional(),
  maxDistanceKm: z.number().min(1).max(200).optional(),
  // Profile excellence score
  profileScore: z.number().int().min(0).max(100).optional(),
  // Unique Profile Features
  vibeTags: z.array(z.string().max(30)).max(5).optional(),
  puneNeighborhood: z.string().max(50).optional(),
  puneSpot: z.string().max(100).optional(),
  lookingFor: z.enum(["Serious relationship", "Not sure yet, open to it", "Something casual"]).optional(),
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

async function checkProfileCompletion(userId) {
  const { UserPromptAnswer, Prompt } = require("../models");
  const refreshed = await User.findByPk(userId, {
    include: [
      { model: Photo, as: "photos", order: [["order", "ASC"]] },
      { model: UserPromptAnswer, as: "promptAnswers", include: [{ model: Prompt, as: "prompt" }] }
    ],
  });

  if (!refreshed) return null;

  const hasBasicFields = refreshed.name && refreshed.birthdate && refreshed.gender;
  const hasEnoughPhotos = refreshed.photos.length === 6;
  const hasEnoughPrompts = refreshed.promptAnswers && refreshed.promptAnswers.length === 3;
  
  const categories = new Set((refreshed.promptAnswers || []).map(pa => pa.prompt?.category).filter(Boolean));
  const hasDiversePrompts = categories.size >= 2;

  let shouldBeComplete = !!(hasBasicFields && hasEnoughPhotos && hasEnoughPrompts && hasDiversePrompts);
  if (process.env.ALLOW_MOCK_AUTH === "true") {
    shouldBeComplete = !!(hasBasicFields && refreshed.photos.length >= 1);
  }

  if (shouldBeComplete !== refreshed.profileCompleted) {
    await refreshed.update({ profileCompleted: shouldBeComplete });
  }

  return refreshed;
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

    // Silently ignore/delete womenMessageFirstEnabled if gender is not Woman
    if (updates.womenMessageFirstEnabled !== undefined) {
      const currentGender = updates.gender !== undefined ? updates.gender : user.gender;
      if (currentGender !== "Woman") {
        delete updates.womenMessageFirstEnabled;
      }
    }

    if (data.latitude != null && data.longitude != null) {
      // Store as plain lat/lng floats (no PostGIS required)
      updates.latitude = data.latitude;
      updates.longitude = data.longitude;
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

    // Re-evaluate profile completion gate
    const refreshed = await checkProfileCompletion(user.id);

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
    moderationStatus: "pending"
  });

  // Execute NSFW and safety scanner asynchronously in the background
  const { moderateImage } = require("../services/moderationService");
  moderateImage(url).then(async (result) => {
    if (result.approved) {
      await photo.update({ moderationStatus: "approved" });
      console.log(`[Moderation] Photo ${photo.id} approved successfully.`);
    } else {
      await photo.update({ moderationStatus: "rejected" });
      console.log(`[Moderation] Photo ${photo.id} rejected: ${result.reason}`);
    }
  }).catch(err => {
    console.error(`[Moderation] Error scanning photo ${photo.id}:`, err);
  });

  await checkProfileCompletion(req.dbUser.id);

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

  await checkProfileCompletion(req.dbUser.id);

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
  const { Op } = require("sequelize");
  
  try {
    // If blockedId is not a UUID, try to look it up as a phone or name!
    const isUuid = /^[0-9a-f-]{36}$/i.test(blockedId);
    let targetUserId = blockedId;

    if (!isUuid) {
      const targetUser = await User.findOne({
        where: {
          [Op.or]: [
            { phone: blockedId },
            { name: blockedId }
          ]
        }
      });
      if (!targetUser) {
        return res.status(404).json({ success: false, error: "User not found with matching phone or name" });
      }
      targetUserId = targetUser.id;
    }

    await Block.findOrCreate({
      where: { blockerId: req.dbUser.id, blockedId: targetUserId },
    });

    // Clean up any existing matches or swipes
    await Match.destroy({
      where: {
        [Op.or]: [
          { userAId: req.dbUser.id, userBId: targetUserId },
          { userAId: targetUserId, userBId: req.dbUser.id },
        ]
      }
    });

    await Swipe.destroy({
      where: {
        [Op.or]: [
          { swiperId: req.dbUser.id, swipedId: targetUserId },
          { swiperId: targetUserId, swipedId: req.dbUser.id },
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

  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!geminiKey && !anthropicKey) {
    console.log("[AI Suggestions] No API key found. Using local rich fallback.");
    return res.json({ success: true, suggestions: getOfflineSuggestions() });
  }

  // ── CALL AI SERVICE ──────────────────────────────────────────────────────
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
        const errorText = await response.text();
        console.warn("[AI Suggestions] Gemini API returned error response:", errorText);
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
        const errorText = await response.text();
        console.warn("[AI Suggestions] Anthropic API returned error response:", errorText);
        throw new Error(`Anthropic status ${response.status}`);
      }

      const data = await response.json();
      content = data.content?.[0]?.text;
    }

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
    console.warn("[AI Suggestions] AI query failed, falling back to local:", err.message);
    return res.json({ success: true, suggestions: getOfflineSuggestions() });
  }
}

async function verifySelfie(req, res) {
  try {
    const { selfieUrl } = req.body;
    if (!selfieUrl) {
      return res.status(400).json({ success: false, error: "selfieUrl is required" });
    }

    const user = req.dbUser;
    
    if (process.env.NODE_ENV !== "production") {
      await user.update({
        isVerified: true,
        verificationStatus: "verified",
        verifiedAt: new Date(),
      });
      return res.json({
        success: true,
        message: "Selfie verified successfully (Auto-approved in development mode)",
        user
      });
    } else {
      await user.update({
        verificationStatus: "pending",
      });
      return res.json({
        success: true,
        message: "Selfie verification submitted and is pending admin review.",
        user
      });
    }
  } catch (error) {
    console.error("[usersController] verifySelfie error:", error);
    return res.status(500).json({ success: false, error: "Failed to submit selfie verification" });
  }
}

async function generateInvite(req, res) {
  const { InviteCode } = require("../models");
  const userId = req.dbUser.id;

  try {
    const existingCount = await InviteCode.count({ where: { createdById: userId } });
    if (existingCount >= 5) {
      return res.status(400).json({
        success: false,
        error: "You have reached the maximum limit of 5 invite codes."
      });
    }

    const crypto = require("crypto");
    const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase();
    const code = `LOVIQ-${randomPart}`;

    const invite = await InviteCode.create({
      code,
      createdById: userId,
    });

    res.status(201).json({ success: true, invite });
  } catch (err) {
    console.error("[usersController] generateInvite error:", err);
    res.status(500).json({ success: false, error: "Failed to generate invite code" });
  }
}

function calculateScoreAndSuggestions(user) {
  let score = 0;
  const suggestions = [];

  // Name (+10)
  if (user.name && user.name.trim()) {
    score += 10;
  } else {
    suggestions.push("Add your name to your profile.");
  }

  // Birthdate (+10)
  if (user.birthdate) {
    score += 10;
  } else {
    suggestions.push("Add your birthdate to verify your age.");
  }

  // Gender (+10)
  if (user.gender) {
    score += 10;
  } else {
    suggestions.push("Select your gender configuration.");
  }

  // Location (+10)
  if (user.location) {
    score += 10;
  } else {
    suggestions.push("Set your location to see matches nearby.");
  }

  // Bio (+15)
  if (user.bio && user.bio.trim()) {
    const wordCount = user.bio.trim().split(/\s+/).length;
    if (wordCount < 20) {
      score += 10;
      suggestions.push("Your bio is under 20 words — try adding a conversation starter.");
    } else {
      score += 15;
    }
  } else {
    suggestions.push("Write a bio to share something about yourself.");
  }

  // Photos (+30)
  const photosCount = user.photos ? user.photos.length : 0;
  if (photosCount === 0) {
    suggestions.push("Upload a primary photo so people can see you.");
  } else if (photosCount === 1) {
    score += 15;
    suggestions.push("Add at least 3 photos to show different sides of your personality.");
  } else if (photosCount === 2) {
    score += 20;
    suggestions.push("Add at least 3 photos to show different sides of your personality.");
  } else {
    score += 30;
  }

  // Interests (+15)
  const interestsCount = user.interests ? user.interests.length : 0;
  if (interestsCount === 0) {
    suggestions.push("Add at least 3 interests to help match on shared hobbies.");
  } else if (interestsCount < 3) {
    score += 5;
    suggestions.push("Add at least 3 interests to help match on shared hobbies.");
  } else {
    score += 15;
  }

  return { score, suggestions };
}

async function getProfileScore(req, res) {
  try {
    const user = await User.findByPk(req.dbUser.id, {
      include: [{ model: Photo, as: "photos" }],
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const { score, suggestions } = calculateScoreAndSuggestions(user);

    // Save calculated score to DB
    await user.update({ profileScore: score });

    res.json({
      success: true,
      score,
      suggestions
    });
  } catch (err) {
    console.error("[usersController] getProfileScore error:", err);
    res.status(500).json({ success: false, error: "Failed to calculate profile score" });
  }
}

async function getAiPromptFeedback(req, res) {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, error: "Text content required" });
  }

  const draft = text.trim();
  
  const getOfflineFeedback = () => {
    const cliches = ["wanderlust", "partner in crime", "foodie", "good vibes", "netflix"];
    const foundCliches = cliches.filter(c => draft.toLowerCase().includes(c));
    
    let suggestion = "Looks like a solid start! Try adding a direct question or prompt to make it easier for matches to message you first.";
    if (foundCliches.length > 0) {
      suggestion = `Good start, but try replacing common clichés like "${foundCliches.join(', ')}" with a specific story or example (e.g. your favorite local café instead of 'foodie').`;
    } else if (draft.length < 30) {
      suggestion = "Your draft is a bit short. Add a bit more detail about what a typical Sunday looks like for you to give matches a hook.";
    }
    
    return {
      positive: "You've written a warm introduction.",
      suggestion
    };
  };

  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!geminiKey && !anthropicKey) {
    console.log("[AI Prompt Feedback] No API key found. Using local fallback.");
    return res.json({ success: true, feedback: getOfflineFeedback() });
  }

  try {
    let content = "";
    const systemPrompt = "You are a friendly dating profile consultant. Given a user's drafted bio or prompt answer, provide a JSON response containing 'positive' (what they did well, under 100 chars) and 'suggestion' (how to make it more engaging, specific, and cliché-free, under 150 chars). Return ONLY valid JSON, nothing else.";
    const userPrompt = `Evaluate this text: "${draft}"`;

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

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const rawJson = jsonMatch ? jsonMatch[0] : content;
    const feedback = JSON.parse(rawJson);

    return res.json({
      success: true,
      feedback: {
        positive: feedback.positive || "Warm introduction.",
        suggestion: feedback.suggestion || "Add a conversation starter."
      }
    });
  } catch (err) {
    console.warn("[AI Prompt Feedback] AI call failed, using local:", err.message);
    return res.json({ success: true, feedback: getOfflineFeedback() });
  }
}

async function travelToLocation(req, res) {
  const user = req.dbUser;
  const userTier = user.tier || "free";

  if (userTier !== "premium") {
    return res.status(403).json({
      success: false,
      error: "Travel mode is a Premium tier feature. Please upgrade to unlock."
    });
  }

  const { latitude, longitude } = req.body;
  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ success: false, error: "latitude and longitude are required." });
  }

  try {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, error: "Invalid coordinate values." });
    }

    await user.update({
      location: {
        type: "Point",
        coordinates: [lng, lat]
      }
    });

    res.json({
      success: true,
      message: "Successfully changed matching location.",
      location: { latitude: lat, longitude: lng }
    });
  } catch (err) {
    console.error("[usersController] travelToLocation error:", err);
    res.status(500).json({ success: false, error: "Failed to update travel location." });
  }
}

async function getMyAnalytics(req, res) {
  const myId = req.dbUser.id;
  const { Swipe, Match } = require("../models");
  const { Op } = require("sequelize");

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 1. Count likes and superlikes sent in last 30 days
    const likesSent = await Swipe.count({
      where: {
        swiperId: myId,
        direction: { [Op.in]: ["like", "superlike"] },
        createdAt: { [Op.gte]: thirtyDaysAgo }
      }
    });

    // 2. Count active matches
    const matchesCount = await Match.count({
      where: {
        [Op.or]: [{ userAId: myId }, { userBId: myId }],
        status: "active"
      }
    });

    // 3. Chat Conversion Rate: active matches that have firstMessageSent = true
    const totalMatchesCount = await Match.count({
      where: {
        [Op.or]: [{ userAId: myId }, { userBId: myId }],
        status: "active"
      }
    });

    const chatMatchesCount = await Match.count({
      where: {
        [Op.or]: [{ userAId: myId }, { userBId: myId }],
        status: "active",
        firstMessageSent: true
      }
    });

    const conversionRate = totalMatchesCount > 0 
      ? Math.round((chatMatchesCount / totalMatchesCount) * 100) 
      : 0;

    res.json({
      success: true,
      analytics: {
        profileScore: req.dbUser.profileScore || 0,
        likesSent,
        matchesCount,
        conversionRate
      }
    });
  } catch (err) {
    console.error("[usersController] getMyAnalytics error:", err);
    res.status(500).json({ success: false, error: "Failed to load profile analytics." });
  }
}

async function appealSuspension(req, res) {
  const user = req.dbUser;
  const { explanation } = req.body;

  if (!explanation || typeof explanation !== "string") {
    return res.status(400).json({ success: false, error: "Explanation is required." });
  }

  if (explanation.length > 500) {
    return res.status(400).json({ success: false, error: "Explanation cannot exceed 500 characters." });
  }

  if (user.appealStatus === "pending") {
    return res.status(400).json({
      success: false,
      error: "You already have a pending appeal under review."
    });
  }

  try {
    await user.update({
      appealText: explanation,
      appealStatus: "pending"
    });

    res.json({
      success: true,
      message: "Appeal submitted successfully. Our team will review it within 3-5 business days."
    });
  } catch (err) {
    console.error("[usersController] appealSuspension error:", err);
    res.status(500).json({ success: false, error: "Failed to submit appeal." });
  }
}

module.exports = { checkProfileCompletion, getCurrentUser, updateCurrentUser, getUser, updateUser, deleteUser, addPhoto, deletePhoto, reorderPhotos, updatePushToken, blockUser, unblockUser, getBlocks, reportUser, getAiSuggestions, verifySelfie, generateInvite, getProfileScore, getAiPromptFeedback, travelToLocation, getMyAnalytics, appealSuspension };

export {};
