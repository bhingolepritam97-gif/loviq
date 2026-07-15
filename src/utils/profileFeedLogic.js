/**
 * profileFeedLogic.js
 *
 * Client-side query logic utilizing direct Firestore queries for when the feed runs dry.
 * By querying Firestore directly, the app remains serverless and fully functional
 * without relative fetch crashes on mobile devices.
 *
 * Every profile returned includes a `matchReason` field so the frontend
 * can label things honestly instead of mixing them in silently.
 */

import { db, auth } from '../config/firebase';
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';
import * as geofire from 'geofire-common';

const PASSED_PROFILE_COOLDOWN_DAYS = 14;
const NEAR_MISS_AGE_TOLERANCE_YEARS = 2;

/**
 * Queries all swipes by the current user to build exclude lists and identify
 * recycled passes.
 */
async function fetchUserSwipes(currentUid, ignoreCooldown = false) {
  try {
    const swipesRef = collection(db, 'swipes');
    const q = query(swipesRef, where('from', '==', currentUid));
    const snap = await getDocs(q);
    
    const swipedIds = new Set();
    const recycledPassIds = new Set();
    const now = Date.now();
    const cooldownMs = ignoreCooldown ? 0 : PASSED_PROFILE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

    snap.forEach((docItem) => {
      const data = docItem.data();
      const targetUid = data.to;
      
      if (data.action === 'pass') {
        const swipeTime = data.timestamp ? new Date(data.timestamp).getTime() : 0;
        if (ignoreCooldown || (now - swipeTime > cooldownMs)) {
          // Cooldown elapsed -> Eligible for recycling
          recycledPassIds.add(targetUid);
        } else {
          // Still in cooldown -> Exclude
          swipedIds.add(targetUid);
        }
      } else {
        // Liked, super-liked, etc. -> Always exclude
        swipedIds.add(targetUid);
      }
    });

    return { swipedIds, recycledPassIds };
  } catch (err) {
    console.error('Error fetching user swipes:', err);
    return { swipedIds: new Set(), recycledPassIds: new Set() };
  }
}

/**
 * Fetches user profile preferences from Firestore.
 */
async function fetchCurrentUserProfile(currentUid) {
  try {
    const docSnap = await getDoc(doc(db, 'profiles', currentUid));
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (err) {
    console.error('Error fetching user profile:', err);
  }
  return null;
}

/**
 * Main query function to fetch candidate profiles using location/global rules
 * and filter them on the client.
 */
async function queryProfiles({
  userLocation,
  radiusMiles,
  currentUserUid,
  userProfile,
  includeRecycledPasses = false,
  includeNearMiss = false,
  ignoreCooldown = false,
}) {
  const pool = [];
  const { swipedIds, recycledPassIds } = await fetchUserSwipes(currentUserUid, ignoreCooldown);

  const blockedUsers = userProfile?.blockedUsers || [];
  const interestedIn = userProfile?.interestedIn || 'Everyone';
  const ageRange = userProfile?.age_range || [18, 35];

  const minAge = includeNearMiss ? Math.max(18, ageRange[0] - NEAR_MISS_AGE_TOLERANCE_YEARS) : ageRange[0];
  const maxAge = includeNearMiss ? ageRange[1] + NEAR_MISS_AGE_TOLERANCE_YEARS : ageRange[1];

  const profilesRef = collection(db, 'profiles');

  // 1. Log current user details before query
  const myLat = userLocation?.latitude || userLocation?.lat || null;
  const myLng = userLocation?.longitude || userLocation?.lng || null;
  const myGeohash = (myLat && myLng) ? geofire.geohashForPoint([myLat, myLng]) : 'None';
  console.log(`[Discover debug] Current User Uid: ${currentUserUid}`);
  console.log(`[Discover debug] Coordinates: lat=${myLat}, lng=${myLng}`);
  console.log(`[Discover debug] Calculated Geohash: ${myGeohash}`);
  console.log(`[Discover debug] Search Radius: ${radiusMiles} miles`);

  let rawCandidateCount = 0;
  let selfOrBlockedFiltered = 0;
  let swipedOrRecycledFiltered = 0;
  let genderFiltered = 0;
  let ageFiltered = 0;
  let distanceFiltered = 0;

  // Location queries
  if (myLat && myLng) {
    const center = [myLat, myLng];
    const radiusInM = radiusMiles * 1609.34;
    const bounds = geofire.geohashQueryBounds(center, radiusInM);

    const promises = bounds.map((b) => {
      const q = query(
        profilesRef,
        where('location.geohash', '>=', b[0]),
        where('location.geohash', '<=', b[1])
      );
      return getDocs(q);
    });

    const snapshots = await Promise.all(promises);

    snapshots.forEach((snap) => {
      snap.forEach((docItem) => {
        rawCandidateCount++;
        const id = docItem.id;

        if (id === currentUserUid || blockedUsers.includes(id)) {
          selfOrBlockedFiltered++;
          return;
        }

        const data = docItem.data();

        // 1. Swipes filtering (exclude already liked/recently passed)
        const isSwiped = swipedIds.has(id);
        const isRecycled = recycledPassIds.has(id);

        if (isSwiped) {
          swipedOrRecycledFiltered++;
          return;
        }
        if (isRecycled && !includeRecycledPasses) {
          swipedOrRecycledFiltered++;
          return;
        }

        // 2. Gender filtering (Hard Filter)
        const passesGender = interestedIn === 'Everyone' || data.gender === interestedIn;
        if (!passesGender) {
          genderFiltered++;
          return;
        }

        // 3. Age filtering
        const passesAge = data.age >= minAge && data.age <= maxAge;
        if (!passesAge) {
          ageFiltered++;
          return;
        }

        // 4. Distance check
        if (data.location?.latitude && data.location?.longitude) {
          const distanceInKm = geofire.distanceBetween(
            [data.location.latitude, data.location.longitude],
            center
          );
          const distanceInMiles = distanceInKm / 1.60934;

          if (distanceInMiles <= radiusMiles) {
            // Determine match reason
            let matchReason = 'normal';
            if (isRecycled) {
              matchReason = 'recycled_pass';
            } else if (data.age < ageRange[0] || data.age > ageRange[1]) {
              matchReason = 'near_miss_age';
            } else if (distanceInMiles > (userProfile?.distance_range || 25)) {
              matchReason = 'expanded_radius';
            }

            pool.push({
              id,
              ...data,
              distance: parseFloat(distanceInMiles.toFixed(1)),
              matchReason,
            });
          } else {
            distanceFiltered++;
          }
        } else {
          distanceFiltered++;
        }
      });
    });

    console.log(`[Discover debug] Location Path Results:`);
    console.log(` - Raw candidates in geohash bounds: ${rawCandidateCount}`);
    console.log(` - Dropped (self/blocked): ${selfOrBlockedFiltered}`);
    console.log(` - Dropped (swiped/cooldown): ${swipedOrRecycledFiltered}`);
    console.log(` - Dropped (gender preference): ${genderFiltered}`);
    console.log(` - Dropped (age range): ${ageFiltered}`);
    console.log(` - Dropped (distance check): ${distanceFiltered}`);
    console.log(` - Final matching candidates added to pool: ${pool.length}`);

  } else {
    // Global fallback
    console.log(`[Discover debug] Entering Global Fallback Path (No location coordinates found on current user profile)`);
    const snap = await getDocs(query(profilesRef, limit(150)));
    snap.forEach((docItem) => {
      rawCandidateCount++;
      const id = docItem.id;
      if (id === currentUserUid || blockedUsers.includes(id)) {
        selfOrBlockedFiltered++;
        return;
      }

      const data = docItem.data();
      const isSwiped = swipedIds.has(id);
      const isRecycled = recycledPassIds.has(id);

      if (isSwiped) {
        swipedOrRecycledFiltered++;
        return;
      }
      if (isRecycled && !includeRecycledPasses) {
        swipedOrRecycledFiltered++;
        return;
      }

      const passesGender = interestedIn === 'Everyone' || data.gender === interestedIn;
      if (!passesGender) {
        genderFiltered++;
        return;
      }

      const passesAge = data.age >= minAge && data.age <= maxAge;
      if (!passesAge) {
        ageFiltered++;
        return;
      }

      let matchReason = 'normal';
      if (isRecycled) {
        matchReason = 'recycled_pass';
      } else if (data.age < ageRange[0] || data.age > ageRange[1]) {
        matchReason = 'near_miss_age';
      }

      pool.push({
        id,
        ...data,
        matchReason,
      });
    });

    console.log(`[Discover debug] Global Fallback Path Results:`);
    console.log(` - Raw profiles evaluated: ${rawCandidateCount}`);
    console.log(` - Dropped (self/blocked): ${selfOrBlockedFiltered}`);
    console.log(` - Dropped (swiped/cooldown): ${swipedOrRecycledFiltered}`);
    console.log(` - Dropped (gender preference): ${genderFiltered}`);
    console.log(` - Dropped (age range): ${ageFiltered}`);
    console.log(` - Final matching candidates added to pool: ${pool.length}`);
  }

  // Deduplicate and rank candidates simply
  const uniquePool = Array.from(new Map(pool.map((item) => [item.id, item])).values());
  return uniquePool;
}

/**
 * Called when the normal feed runs dry. Widens the search radius by a
 * small, fixed amount and re-queries.
 *
 * @param {object|null} userLocation - { latitude, longitude } (renamed from lat/lng for consistency)
 * @param {number} currentRadiusMiles
 * @param {number} bumpMiles
 * @returns {{ profiles: array, newRadius: number }}
 */
export async function expandRadiusBy(userLocation, currentRadiusMiles, bumpMiles = 8) {
  const currentUser = auth.currentUser;
  if (!currentUser) return { profiles: [], newRadius: currentRadiusMiles };

  // Adapt { lat, lng } to { latitude, longitude } if passed in alternate format
  const loc = userLocation ? {
    latitude: userLocation.latitude || userLocation.lat,
    longitude: userLocation.longitude || userLocation.lng
  } : null;

  const newRadius = currentRadiusMiles + bumpMiles;
  const userProfile = await fetchCurrentUserProfile(currentUser.uid);

  const profiles = await queryProfiles({
    userLocation: loc,
    radiusMiles: newRadius,
    currentUserUid: currentUser.uid,
    userProfile,
    includeRecycledPasses: true,
    includeNearMiss: true,
  });

  return {
    profiles,
    newRadius,
  };
}

/**
 * Fetches expanded suggestions in the background.
 */
export async function getExpandedProfiles(userLocation) {
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  const loc = userLocation ? {
    latitude: userLocation.latitude || userLocation.lat,
    longitude: userLocation.longitude || userLocation.lng
  } : null;

  const userProfile = await fetchCurrentUserProfile(currentUser.uid);
  const currentRadius = userProfile?.distance_range || 25;

  return await queryProfiles({
    userLocation: loc,
    radiusMiles: currentRadius + 8,
    currentUserUid: currentUser.uid,
    userProfile,
    includeRecycledPasses: true,
    includeNearMiss: true,
  });
}

/**
 * Fetches profiles just outside stated soft age filters.
 */
export async function getNearMissProfiles(userLocation, radiusMiles) {
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  const loc = userLocation ? {
    latitude: userLocation.latitude || userLocation.lat,
    longitude: userLocation.longitude || userLocation.lng
  } : null;

  const userProfile = await fetchCurrentUserProfile(currentUser.uid);

  return await queryProfiles({
    userLocation: loc,
    radiusMiles,
    currentUserUid: currentUser.uid,
    userProfile,
    includeRecycledPasses: false,
    includeNearMiss: true,
  });
}

/**
 * Fetches profiles passed on 14+ days ago.
 */
export async function getRecycledPasses(ignoreCooldown = false) {
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  const userProfile = await fetchCurrentUserProfile(currentUser.uid);
  const currentRadius = userProfile?.distance_range || 25;
  const loc = userProfile?.location;

  return await queryProfiles({
    userLocation: loc,
    radiusMiles: currentRadius,
    currentUserUid: currentUser.uid,
    userProfile,
    includeRecycledPasses: true,
    includeNearMiss: false,
    ignoreCooldown,
  });
}

/**
 * Convenience method to pull all fallback candidates in parallel.
 */
export async function getAllFallbackProfiles(userLocation, radiusMiles) {
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  const loc = userLocation ? {
    latitude: userLocation.latitude || userLocation.lat,
    longitude: userLocation.longitude || userLocation.lng
  } : null;

  const userProfile = await fetchCurrentUserProfile(currentUser.uid);

  const nearMissPromise = queryProfiles({
    userLocation: loc,
    radiusMiles,
    currentUserUid: currentUser.uid,
    userProfile,
    includeRecycledPasses: false,
    includeNearMiss: true,
  });

  const recycledPromise = queryProfiles({
    userLocation: loc,
    radiusMiles,
    currentUserUid: currentUser.uid,
    userProfile,
    includeRecycledPasses: true,
    includeNearMiss: false,
  });

  const [nearMissesResult, recycledResult] = await Promise.allSettled([nearMissPromise, recycledPromise]);

  const nearMisses = nearMissesResult.status === 'fulfilled' ? nearMissesResult.value : [];
  const recycled = recycledResult.status === 'fulfilled' ? recycledResult.value : [];

  const seen = new Set();
  const merged = [...nearMisses, ...recycled].filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  return merged;
}
