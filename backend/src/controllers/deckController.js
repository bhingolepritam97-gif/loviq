const { sequelize } = require("../models");

// GET /deck?limit=20
async function getDeck(req, res) {
  try {
    const me = req.dbUser;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

    if (!me.location) {
      return res.status(400).json({
        success: false,
        error: "Set your location before requesting a deck",
      });
    }

    // Cap max distance to 200km to prevent DB strain
    let maxDistanceMeters = (req.query.maxDistanceKm ? parseFloat(req.query.maxDistanceKm) : 50) * 1000;
    if (maxDistanceMeters > 200000) maxDistanceMeters = 200000; 

    // Age preferences (fallback to broad range if not set)
    const ageMin = me.ageMin || 18;
    const ageMax = me.ageMax || 100;

    const [myLng, myLat] = me.location.coordinates;

    const [candidates] = await sequelize.query(
      `
      SELECT
        u.id, u.name, u.birthdate, u.gender, u.bio, u.interests, u.hide_distance,
        ST_Distance(u.location, ST_SetSRID(ST_MakePoint(:myLng, :myLat), 4326)::geography) AS distance_meters,
        COALESCE(
          json_agg(json_build_object('id', p.id, 'url', p.url, 'order', p."order"))
            FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) AS photos
      FROM users u
      LEFT JOIN photos p ON p.user_id = u.id AND p.moderation_status = 'approved'
      WHERE u.id != :myId
        AND u.is_active = true
        AND u.profile_completed = true
        AND ST_DWithin(u.location, ST_SetSRID(ST_MakePoint(:myLng, :myLat), 4326)::geography, :maxDistance)
        AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.birthdate)) BETWEEN :ageMin AND :ageMax
        AND (
          'Everyone' = ANY(ARRAY[:myGenderPrefs]::varchar[])
          OR ('Women' = ANY(ARRAY[:myGenderPrefs]::varchar[]) AND u.gender = 'Woman')
          OR ('Men' = ANY(ARRAY[:myGenderPrefs]::varchar[]) AND u.gender = 'Man')
        )
        AND (
          'Everyone' = ANY(u.gender_preference)
          OR (:myGender = 'Woman' AND 'Women' = ANY(u.gender_preference))
          OR (:myGender = 'Man' AND 'Men' = ANY(u.gender_preference))
        )
        AND u.id NOT IN (
          SELECT swiped_id FROM swipes WHERE swiper_id = :myId
        )
        AND u.id NOT IN (
          SELECT blocked_id FROM blocks WHERE blocker_id = :myId
        )
        AND u.id NOT IN (
          SELECT blocker_id FROM blocks WHERE blocked_id = :myId
        )
      GROUP BY u.id
      ORDER BY distance_meters ASC
      LIMIT :limit
      `,
      {
        replacements: {
          myId: me.id,
          myLng,
          myLat,
          maxDistance: maxDistanceMeters,
          myGender: me.gender || 'Woman',
          myGenderPrefs: me.genderPreference || ['Everyone'],
          ageMin,
          ageMax,
          limit,
        },
      }
    );

    // Filter out distance_meters for privacy
    const processedCandidates = candidates.map(c => {
      if (c.hide_distance) {
        c.distance_meters = null;
      }
      delete c.hide_distance; // don't need to send this boolean to the client
      return c;
    });

    res.json({ success: true, candidates: processedCandidates });
  } catch (error) {
    console.error("[deckController] getDeck error:", error);
    res.status(500).json({ success: false, error: "Failed to load deck" });
  }
}

module.exports = { getDeck };
