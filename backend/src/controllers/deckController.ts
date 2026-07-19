const { sequelize } = require("../models");

// Haversine distance formula in SQL — works without PostGIS.
// Returns distance in metres between (lat1,lng1) and a table column (lat, lng).
const HAVERSINE_METRES = (latCol: string, lngCol: string, myLat: number, myLng: number) => `
  (6371000 * 2 * ASIN(SQRT(
    POWER(SIN(RADIANS(${latCol} - ${myLat}) / 2), 2) +
    COS(RADIANS(${myLat})) * COS(RADIANS(${latCol})) *
    POWER(SIN(RADIANS(${lngCol} - ${myLng}) / 2), 2)
  )))
`;

// GET /deck?limit=20&maxDistanceKm=50&after_id=<uuid>
async function getDeck(req, res) {
  try {
    const me = req.dbUser;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

    // Use stored lat/lng; fall back to null-safe check
    const myLat = me.latitude;
    const myLng = me.longitude;

    if (myLat == null || myLng == null) {
      console.warn(`[Deck debug] User ${me.id} requested deck but has no location set.`);
      return res.status(400).json({
        success: false,
        error: "Set your location before requesting a deck",
      });
    }

    let maxDistanceMeters =
      (req.query.maxDistanceKm
        ? parseFloat(req.query.maxDistanceKm)
        : (me.maxDistanceKm || 80.5)) * 1000;
    if (maxDistanceMeters > 200000) maxDistanceMeters = 200000;

    const ageMin = me.ageMin || 18;
    const ageMax = me.ageMax || 100;
    let verifiedOnly = me.verifiedOnly === true;
    if (req.query.verifiedOnly !== undefined) {
      verifiedOnly = req.query.verifiedOnly === 'true';
    } else if (me.gender === 'Woman') {
      verifiedOnly = true;
    }

    const myGender = me.gender || 'Woman';
    const myGenderPrefs = me.genderPreference || ['Everyone'];
    const myNeighborhood = me.puneNeighborhood || null;
    const myVibeTags = Array.isArray(me.vibeTags) ? me.vibeTags : [];
    const myInterests = Array.isArray(me.interests) ? me.interests : [];

    console.log(`[Deck debug] User requesting deck: ID=${me.id}, Gender=${myGender}, lat=${myLat}, lng=${myLng}`);

    // ── Cursor: resolve the cursor values for the last-seen card ──────────
    let cursorScore = null;
    let cursorDistance = null;
    let cursorId = null;

    if (req.query.after_id) {
      const afterId = req.query.after_id;
      const [[cursorRow]] = await sequelize.query(
        `SELECT 
          ${HAVERSINE_METRES('latitude', 'longitude', myLat, myLng)} AS d,
          (
            0
            + (CASE WHEN pune_neighborhood = :myNeighborhood AND pune_neighborhood IS NOT NULL THEN 50 ELSE 0 END)
            + (
                SELECT COALESCE(COUNT(*), 0) * 10
                FROM unnest(COALESCE(vibe_tags, '{}'::varchar[])) AS t1
                JOIN unnest(:myVibeTags::varchar[]) AS t2 ON t1 = t2
              )
            + (
                SELECT COALESCE(COUNT(*), 0) * 5
                FROM unnest(COALESCE(interests, '{}'::varchar[])) AS i1
                JOIN unnest(:myInterests::varchar[]) AS i2 ON i1 = i2
              )
          ) AS score
         FROM users WHERE id = :afterId AND latitude IS NOT NULL LIMIT 1`,
        { replacements: { afterId, myNeighborhood, myVibeTags, myInterests } }
      );
      if (cursorRow) {
        cursorScore = cursorRow.score;
        cursorDistance = cursorRow.d;
        cursorId = afterId;
      }
    }

    // ── Main query using Haversine distance ──────────────────────────────
    const [candidates] = await sequelize.query(
      `
      WITH scored_users AS (
        SELECT
          u.id, u.name, u.birthdate, u.gender, u.bio, u.interests,
          u.hide_distance, u.city_name,
          u.is_verified,
          u.last_active_at,
          u.height, u.exercise, u.drinking, u.pets,
          u.star_sign, u.anthem_song, u.anthem_artist,
          u.vibe_tags, u.pune_neighborhood, u.pune_spot, u.looking_for,
          (u.phone IS NOT NULL) AS has_phone,
          ${HAVERSINE_METRES('u.latitude', 'u.longitude', myLat, myLng)} AS distance_meters,
          (
            0
            + (CASE WHEN u.pune_neighborhood = :myNeighborhood AND u.pune_neighborhood IS NOT NULL THEN 50 ELSE 0 END)
            + (
                SELECT COALESCE(COUNT(*), 0) * 10
                FROM unnest(COALESCE(u.vibe_tags, '{}'::varchar[])) AS t1
                JOIN unnest(:myVibeTags::varchar[]) AS t2 ON t1 = t2
              )
            + (
                SELECT COALESCE(COUNT(*), 0) * 5
                FROM unnest(COALESCE(u.interests, '{}'::varchar[])) AS i1
                JOIN unnest(:myInterests::varchar[]) AS i2 ON i1 = i2
              )
          ) AS match_score
        FROM users u
        WHERE u.id != :myId
          AND u.is_active = true
          AND u.is_test_account = false
          AND u.profile_completed = true
          AND u.latitude IS NOT NULL
          AND u.longitude IS NOT NULL
          AND u.last_active_at >= NOW() - INTERVAL '30 days'
          AND ${HAVERSINE_METRES('u.latitude', 'u.longitude', myLat, myLng)} <= :maxDistance
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
          AND (:verifiedOnly = false OR u.is_verified = true)
          AND u.id NOT IN (
            SELECT swiped_id FROM swipes WHERE swiper_id = :myId AND expired_at IS NULL
          )
          AND u.id NOT IN (
            SELECT blocked_id FROM blocks WHERE blocker_id = :myId
          )
          AND u.id NOT IN (
            SELECT blocker_id FROM blocks WHERE blocked_id = :myId
          )
      )
      SELECT 
        su.id, su.name, su.birthdate, su.gender, su.bio, su.interests,
        su.hide_distance, 
        su.city_name AS "cityName",
        su.is_verified AS "isVerified",
        su.last_active_at AS "lastActiveAt",
        su.height, su.exercise, su.drinking, su.pets,
        su.star_sign AS "starSign",
        su.anthem_song AS "anthemSong",
        su.anthem_artist AS "anthemArtist",
        su.vibe_tags AS "vibeTags",
        su.pune_neighborhood AS "puneNeighborhood",
        su.pune_spot AS "puneSpot",
        su.looking_for AS "lookingFor",
        su.has_phone AS "hasPhone",
        su.distance_meters, su.match_score,
        COALESCE(
          json_agg(
            json_build_object('id', p.id, 'url', p.url, 'order', p."order")
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) AS photos
      FROM scored_users su
      LEFT JOIN photos p ON p.user_id = su.id AND p.moderation_status = 'approved'
      WHERE 1=1
      ${cursorScore !== null
        ? `AND (
             su.match_score < :cursorScore
             OR (su.match_score = :cursorScore AND su.distance_meters > :cursorDistance)
             OR (su.match_score = :cursorScore AND su.distance_meters = :cursorDistance AND su.id::text > :cursorId)
           )`
        : ''}
      GROUP BY 
        su.id, su.name, su.birthdate, su.gender, su.bio, su.interests,
        su.hide_distance, su.city_name, su.is_verified, su.last_active_at,
        su.height, su.exercise, su.drinking, su.pets, su.star_sign,
        su.anthem_song, su.anthem_artist, su.vibe_tags, su.pune_neighborhood,
        su.pune_spot, su.looking_for, su.has_phone, su.distance_meters, su.match_score
      ORDER BY su.match_score DESC, su.distance_meters ASC, su.last_active_at DESC
      LIMIT :limit
      `,
      {
        replacements: {
          myId: me.id,
          maxDistance: maxDistanceMeters,
          myGender,
          myGenderPrefs,
          ageMin,
          ageMax,
          limit,
          verifiedOnly,
          myNeighborhood,
          myVibeTags,
          myInterests,
          ...(cursorScore !== null ? { cursorScore, cursorDistance, cursorId } : {}),
        },
      }
    );

    console.log(`[Deck debug] Candidates returned: ${candidates.length}`);

    let suggestions = [];

    if (candidates.length === 0) {
      const [[usersCount]] = await sequelize.query(`SELECT COUNT(*) as count FROM users`);
      const [[completedCount]] = await sequelize.query(`SELECT COUNT(*) as count FROM users WHERE profile_completed = true`);
      const [[swipesCount]] = await sequelize.query(`SELECT COUNT(*) as count FROM swipes WHERE swiper_id = :myId`, { replacements: { myId: me.id } });
      console.log(`[Deck debug] Total users: ${usersCount.count}, Completed: ${completedCount.count}, Swiped: ${swipesCount.count}`);

      const [[relaxedCount]] = await sequelize.query(`
        SELECT COUNT(DISTINCT u.id) as count
        FROM users u
        WHERE u.id != :myId
          AND u.is_active = true
          AND u.profile_completed = true
          AND u.id NOT IN (
            SELECT swiped_id FROM swipes WHERE swiper_id = :myId AND expired_at IS NULL
          )
      `, { replacements: { myId: me.id } });

      if (relaxedCount.count > 0) {
        suggestions.push(`We found ${relaxedCount.count} potential matches if you expand your distance and age preferences.`);
      }

      if (verifiedOnly) {
        suggestions.push(`Try disabling 'Verified Users Only' in your settings to see more profiles.`);
      }
    }

    const now = new Date();
    const processedCandidates = candidates.map((c) => {
      if (c.hide_distance) c.distance_meters = null;
      delete c.hide_distance;

      if (c.lastActiveAt) {
        const diffHours = (now.getTime() - new Date(c.lastActiveAt).getTime()) / (1000 * 60 * 60);
        c.activityBadge = diffHours <= 24 ? 'Active today' : diffHours <= 168 ? 'Active this week' : null;
      } else {
        c.activityBadge = null;
      }

      return c;
    });

    const nextCursor = processedCandidates.length > 0
      ? processedCandidates[processedCandidates.length - 1].id
      : null;

    res.json({
      success: true,
      candidates: processedCandidates,
      nextCursor,
      hasMore: processedCandidates.length === limit,
      suggestions
    });
  } catch (error) {
    console.error("[deckController] getDeck error:", error);
    res.status(500).json({ success: false, error: "Failed to load deck" });
  }
}

// GET /deck/top-picks
async function getTopPicks(req, res) {
  try {
    const me = req.dbUser;

    const myLat = me.latitude;
    const myLng = me.longitude;

    if (myLat == null || myLng == null) {
      return res.status(400).json({
        success: false,
        error: "Set your location before requesting top picks",
      });
    }

    const myGender = me.gender || 'Woman';
    const myGenderPrefs = me.genderPreference || ['Everyone'];
    const ageMin = me.ageMin || 18;
    const ageMax = me.ageMax || 100;
    const maxDistanceMeters = 200000; // 200km cap
    const myNeighborhood = me.puneNeighborhood || null;
    const myVibeTags = Array.isArray(me.vibeTags) ? me.vibeTags : [];
    const myInterests = Array.isArray(me.interests) ? me.interests : [];

    const [candidates] = await sequelize.query(`
      WITH scored_users AS (
        SELECT
          u.id, u.name, u.birthdate, u.gender, u.bio, u.interests,
          u.hide_distance, u.city_name, u.is_verified, u.last_active_at,
          u.height, u.exercise, u.drinking, u.pets, u.star_sign,
          u.anthem_song, u.anthem_artist, u.vibe_tags, u.pune_neighborhood,
          u.pune_spot, u.looking_for, (u.phone IS NOT NULL) AS has_phone,
          ${HAVERSINE_METRES('u.latitude', 'u.longitude', myLat, myLng)} AS distance_meters,
          (
            0
            + (CASE WHEN u.pune_neighborhood = :myNeighborhood AND u.pune_neighborhood IS NOT NULL THEN 50 ELSE 0 END)
            + (
                SELECT COALESCE(COUNT(*), 0) * 10
                FROM unnest(COALESCE(u.vibe_tags, '{}'::varchar[])) AS t1
                JOIN unnest(:myVibeTags::varchar[]) AS t2 ON t1 = t2
              )
            + (
                SELECT COALESCE(COUNT(*), 0) * 5
                FROM unnest(COALESCE(u.interests, '{}'::varchar[])) AS i1
                JOIN unnest(:myInterests::varchar[]) AS i2 ON i1 = i2
              )
          ) AS match_score
        FROM users u
        WHERE u.id != :myId
          AND u.is_active = true
          AND u.is_test_account = false
          AND u.profile_completed = true
          AND u.latitude IS NOT NULL
          AND u.longitude IS NOT NULL
          AND ${HAVERSINE_METRES('u.latitude', 'u.longitude', myLat, myLng)} <= :maxDistance
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
          AND u.id NOT IN (SELECT swiped_id FROM swipes WHERE swiper_id = :myId)
          AND u.id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = :myId)
          AND u.id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = :myId)
      )
      SELECT 
        su.id, su.name, su.birthdate, su.gender, su.bio, su.interests,
        su.hide_distance, su.city_name AS "cityName", su.is_verified AS "isVerified",
        su.last_active_at AS "lastActiveAt", su.height, su.exercise, su.drinking,
        su.pets, su.star_sign AS "starSign", su.anthem_song AS "anthemSong",
        su.anthem_artist AS "anthemArtist", su.vibe_tags AS "vibeTags",
        su.pune_neighborhood AS "puneNeighborhood", su.pune_spot AS "puneSpot",
        su.looking_for AS "lookingFor", su.has_phone AS "hasPhone",
        su.distance_meters, su.match_score,
        COALESCE(
          json_agg(json_build_object('id', p.id, 'url', p.url, 'order', p."order")) FILTER (WHERE p.id IS NOT NULL), '[]'
        ) AS photos
      FROM scored_users su
      LEFT JOIN photos p ON p.user_id = su.id AND p.moderation_status = 'approved'
      GROUP BY 
        su.id, su.name, su.birthdate, su.gender, su.bio, su.interests,
        su.hide_distance, su.city_name, su.is_verified, su.last_active_at,
        su.height, su.exercise, su.drinking, su.pets, su.star_sign,
        su.anthem_song, su.anthem_artist, su.vibe_tags, su.pune_neighborhood,
        su.pune_spot, su.looking_for, su.has_phone, su.distance_meters, su.match_score
      ORDER BY su.match_score DESC, su.distance_meters ASC
      LIMIT 10
    `, {
      replacements: {
        myId: me.id,
        maxDistance: maxDistanceMeters,
        myGender,
        myGenderPrefs,
        ageMin,
        ageMax,
        myNeighborhood,
        myVibeTags,
        myInterests
      }
    });

    const now = new Date();
    const processedCandidates = candidates.map((c) => {
      if (c.hide_distance) c.distance_meters = null;
      delete c.hide_distance;

      if (c.lastActiveAt) {
        const diffHours = (now.getTime() - new Date(c.lastActiveAt).getTime()) / (1000 * 60 * 60);
        c.activityBadge = diffHours <= 24 ? 'Active today' : diffHours <= 168 ? 'Active this week' : null;
      } else {
        c.activityBadge = null;
      }
      return c;
    });

    res.json({ success: true, candidates: processedCandidates });
  } catch (error) {
    console.error("[deckController] getTopPicks error:", error);
    res.status(500).json({ success: false, error: "Failed to load top picks" });
  }
}

module.exports = { getDeck, getTopPicks };

export {};
