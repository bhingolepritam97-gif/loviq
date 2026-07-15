const { sequelize } = require("../models");

// GET /deck?limit=20&maxDistanceKm=50&after_id=<uuid>
//
// Returns a page of candidate profiles sorted by:
//   1. distance ASC  (closest first)
//   2. last_active_at DESC  (most-recently-active as tiebreaker within ~1 km)
//
// Cursor pagination: pass ?after_id=<uuid of last card seen> to get the next page.
// The cursor is keyset-based (distance, id) so it stays stable even when rows are
// inserted or deleted mid-session.
async function getDeck(req, res) {
  try {
    const me = req.dbUser;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

    if (!me.location) {
      console.warn(`[Deck debug] User ${me.id} requested deck but has no location set.`);
      return res.status(400).json({
        success: false,
        error: "Set your location before requesting a deck",
      });
    }

    // Cap max distance to 200 km to prevent DB strain.
    // Prefer: explicit query param > user's saved preference > 80.5 km (~50 mi) default
    let maxDistanceMeters =
      (req.query.maxDistanceKm
        ? parseFloat(req.query.maxDistanceKm)
        : (me.maxDistanceKm || 80.5)) * 1000;
    if (maxDistanceMeters > 200000) maxDistanceMeters = 200000;

    // Age preferences — use persisted filter values, fall back to broad range
    const ageMin = me.ageMin || 18;
    const ageMax = me.ageMax || 100;

    const [myLng, myLat] = me.location.coordinates;
    const myGender = me.gender || 'Woman';
    const myGenderPrefs = me.genderPreference || ['Everyone'];

    console.log(`[Deck debug] User requesting deck: ID=${me.id}, Gender=${myGender}, Prefs=${JSON.stringify(myGenderPrefs)}`);
    console.log(`[Deck debug] User coordinates: lat=${myLat}, lng=${myLng}`);
    console.log(`[Deck debug] Filter parameters: maxDistanceKm=${maxDistanceMeters / 1000}km, ageMin=${ageMin}, ageMax=${ageMax}`);

    // ── Cursor: resolve the distance of the last-seen card ─────────────────
    let cursorDistance = null;
    let cursorId = null;

    if (req.query.after_id) {
      const afterId = req.query.after_id;
      const [[cursorRow]] = await sequelize.query(
        `SELECT ST_Distance(location, ST_SetSRID(ST_MakePoint(:myLng, :myLat), 4326)::geography) AS d
         FROM users WHERE id = :afterId LIMIT 1`,
        { replacements: { myLng, myLat, afterId } }
      );
      if (cursorRow) {
        cursorDistance = cursorRow.d;
        cursorId = afterId;
        console.log(`[Deck debug] Cursor ID=${cursorId}, distance=${cursorDistance}m`);
      }
    }

    // ── Main query ─────────────────────────────────────────────────────────
    const [candidates] = await sequelize.query(
      `
      SELECT
        u.id, u.name, u.birthdate, u.gender, u.bio, u.interests,
        u.hide_distance, u.city_name AS "cityName",
        u.is_verified AS "isVerified",
        u.last_active_at AS "lastActiveAt",
        u.height, u.exercise, u.drinking, u.pets,
        u.star_sign AS "starSign",
        u.anthem_song AS "anthemSong",
        u.anthem_artist AS "anthemArtist",
        ST_Distance(
          u.location,
          ST_SetSRID(ST_MakePoint(:myLng, :myLat), 4326)::geography
        ) AS distance_meters,
        COALESCE(
          json_agg(
            json_build_object('id', p.id, 'url', p.url, 'order', p."order")
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) AS photos
      FROM users u
      LEFT JOIN photos p ON p.user_id = u.id AND p.moderation_status = 'approved'
      WHERE u.id != :myId
        AND u.is_active = true
        AND u.profile_completed = true
        AND ST_DWithin(
              u.location,
              ST_SetSRID(ST_MakePoint(:myLng, :myLat), 4326)::geography,
              :maxDistance
            )
        AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.birthdate)) BETWEEN :ageMin AND :ageMax
        AND (
          'Everyone' = ANY(ARRAY[:myGenderPrefs]::varchar[])
          OR ('Women' = ANY(ARRAY[:myGenderPrefs]::varchar[]) AND u.gender = 'Woman')
          OR ('Men'   = ANY(ARRAY[:myGenderPrefs]::varchar[]) AND u.gender = 'Man')
        )
        AND (
          'Everyone' = ANY(u.gender_preference)
          OR (:myGender = 'Woman' AND 'Women' = ANY(u.gender_preference))
          OR (:myGender = 'Man'   AND 'Men'   = ANY(u.gender_preference))
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
        -- Keyset cursor: skip everything at or before the last-seen (distance, id) pair
        ${cursorDistance !== null
          ? `AND (
               ST_Distance(u.location, ST_SetSRID(ST_MakePoint(:myLng, :myLat), 4326)::geography),
               u.id::text
             ) > (:cursorDistance, :cursorId)`
          : ''}
      GROUP BY u.id
      ORDER BY distance_meters ASC, u.last_active_at DESC
      LIMIT :limit
      `,
      {
        replacements: {
          myId: me.id,
          myLng,
          myLat,
          maxDistance: maxDistanceMeters,
          myGender,
          myGenderPrefs,
          ageMin,
          ageMax,
          limit,
          ...(cursorDistance !== null ? { cursorDistance, cursorId } : {}),
        },
      }
    );

    console.log(`[Deck debug] Candidates returned from database: ${candidates.length}`);

    // If candidate list is empty, gather DB statistics to figure out why
    if (candidates.length === 0) {
      console.log(`[Deck debug] Deck is empty. Fetching database statistics to troubleshoot...`);
      const [[usersCount]] = await sequelize.query(`SELECT COUNT(*) as count FROM users`);
      const [[completedCount]] = await sequelize.query(`SELECT COUNT(*) as count FROM users WHERE profile_completed = true`);
      const [[swipesCount]] = await sequelize.query(`SELECT COUNT(*) as count FROM swipes WHERE swiper_id = :myId`, { replacements: { myId: me.id } });
      const [[blocksCount]] = await sequelize.query(`SELECT COUNT(*) as count FROM blocks WHERE blocker_id = :myId`, { replacements: { myId: me.id } });
      
      console.log(`[Deck debug] Statistics:`);
      console.log(` - Total users in DB: ${usersCount.count}`);
      console.log(` - Profile completed users in DB: ${completedCount.count}`);
      console.log(` - Profiles swiped by this user: ${swipesCount.count}`);
      console.log(` - Profiles blocked by this user: ${blocksCount.count}`);
    }

    // Filter out distance_meters for privacy if user opted in to hideDistance
    const processedCandidates = candidates.map((c) => {
      if (c.hide_distance) {
        c.distance_meters = null;
      }
      delete c.hide_distance;
      return c;
    });

    // Return the id of the last candidate so the client can use it as a cursor
    const nextCursor =
      processedCandidates.length > 0
        ? processedCandidates[processedCandidates.length - 1].id
        : null;

    res.json({
      success: true,
      candidates: processedCandidates,
      nextCursor,                              // null when this is the last page
      hasMore: processedCandidates.length === limit,
    });
  } catch (error) {
    console.error("[deckController] getDeck error:", error);
    res.status(500).json({ success: false, error: "Failed to load deck" });
  }
}

module.exports = { getDeck };

