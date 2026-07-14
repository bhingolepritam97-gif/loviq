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

module.exports = { getCurrentUser, updateCurrentUser, getUser, updateUser, deleteUser, addPhoto, deletePhoto, reorderPhotos, updatePushToken, blockUser, unblockUser, getBlocks, reportUser };
