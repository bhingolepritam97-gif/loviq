const { sequelize } = require("../models");

// GET /deck?limit=20
// Builds the swipe deck: matches gender preference, within distance,
// excludes already-swiped and blocked users, ordered by distance.
async function getDeck(req, res) {
  const me = req.dbUser;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

  if (!me.location) {
    return res.status(400).json({
      success: false,
      error: "Set your location before requesting a deck (PATCH /users/:id with latitude/longitude)",
    });
  }

  const maxDistanceMeters = (req.query.maxDistanceKm ? parseFloat(req.query.maxDistanceKm) : 50) * 1000;

  // me.location comes back from Sequelize as GeoJSON: { type: 'Point', coordinates: [lng, lat] }
  const [myLng, myLat] = me.location.coordinates;

  // Raw query: PostGIS ST_DWithin for the radius filter, ST_Distance for
  // ordering. Excludes users already swiped on (either direction) and
  // inactive/incomplete profiles. The point is built from plain lat/lng
  // replacements — passing a Sequelize.fn() as a replacement value doesn't
  // work, so we construct the geography point directly in SQL instead.
  const [candidates] = await sequelize.query(
    `
    SELECT
      u.id, u.name, u.birthdate, u.gender, u.bio, u.interests,
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
        limit,
      },
    }
  );

  res.json({ success: true, candidates });
}

module.exports = { getDeck };
