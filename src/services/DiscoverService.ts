/**
 * DiscoverService.js
 *
 * Manages the candidate feed for the Discover screen.
 *
 * Architecture:
 *  - DeckCache: a module-level queue of pre-fetched profiles
 *  - getPotentialMatches():     fetch one page from /deck, returns array
 *  - subscribeToPotentialMatches(): fills DeckCache on mount, drains it as
 *    the user swipes, and refetches automatically when running low
 *
 * Pagination strategy (keyset cursor):
 *  - Page 1: GET /deck?limit=20&maxDistanceKm=X
 *  - Page 2+: GET /deck?limit=20&maxDistanceKm=X&after_id=<last card id>
 *  - Cursor resets when the feed is exhausted or a new subscription opens
 *
 * Auto-expand radius fallback:
 *  - If initial fetch returns < MIN_RESULTS_BEFORE_EXPAND candidates,
 *    the radius is doubled and the fetch is retried, up to MAX_RADIUS_KM
 *
 * Low-deck refetch:
 *  - When ≤ REFETCH_THRESHOLD candidates remain in the cache, a background
 *    fetch is triggered to top it up silently
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { apiClient } from '../api/client';
import AnalyticsService from './AnalyticsService';

// ── Constants ──────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;
const REFETCH_THRESHOLD = 10;         // refetch when this many cards remain
const MIN_RESULTS_BEFORE_EXPAND = 5;  // auto-expand if fewer than this returned
const MAX_RADIUS_KM = 200;
const MILES_TO_KM = 1.60934;

// ── Profile mapper ─────────────────────────────────────────────────────────
function mapBackendUserToProfile(u) {
  if (!u) return null;

  let age = 28;
  if (u.birthdate) {
    const birth = new Date(u.birthdate);
    age = Math.floor(
      (Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
  } else if (u.age) {
    age = u.age;
  }

  let photos = [];
  if (u.photos && Array.isArray(u.photos)) {
    photos = [...u.photos]
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((p) => (typeof p === 'string' ? p : p.url));
  }

  return {
    id: u.id,
    name: u.name || '',
    displayName: u.name || '',
    age,
    gender: u.gender || '',
    bio: u.bio || '',
    interests: u.interests || [],
    photos,
    // distance_meters comes from ST_Distance (metres) → convert to miles for display
    distance: u.distance_meters != null
      ? parseFloat((u.distance_meters / 1609.34).toFixed(1))
      : undefined,
    cityName: u.cityName || u.city_name || '',
    isVerified: u.isVerified || u.is_verified || false,
    hasPhone: u.hasPhone || u.has_phone || false,
    lastActiveAt: u.lastActiveAt || u.last_active_at || null,
    height: u.height || null,
    exercise: u.exercise || null,
    drinking: u.drinking || null,
    pets: u.pets || null,
    starSign: u.starSign || u.star_sign || null,
    anthemSong: u.anthemSong || u.anthem_song || null,
    anthemArtist: u.anthemArtist || u.anthem_artist || null,
    vibeTags: u.vibeTags || u.vibe_tags || [],
    puneNeighborhood: u.puneNeighborhood || u.pune_neighborhood || null,
    puneSpot: u.puneSpot || u.pune_spot || null,
    lookingFor: u.lookingFor || u.looking_for || null,
  };
}

// ── DeckCache ──────────────────────────────────────────────────────────────
// Module-level so the cache persists across component re-renders.
// Reset by calling DeckCache.reset().
const DeckCache = {
  _queue: [],             // remaining candidate profiles
  _cursor: null,          // ?after_id value for next page request
  _fetching: false,       // prevent concurrent fetch races
  _exhausted: false,      // true when backend returned hasMore=false
  _effectiveRadiusKm: 50, // updated if auto-expand kicks in

  reset() {
    this._queue = [];
    this._cursor = null;
    this._fetching = false;
    this._exhausted = false;
  },

  size() {
    return this._queue.length;
  },

  peek() {
    return [...this._queue];
  },

  /** Remove and return the first n items. */
  drain(n = this._queue.length) {
    return this._queue.splice(0, n);
  },

  /** Push new profiles onto the back, deduplicating by id. */
  push(profiles) {
    const existingIds = new Set(this._queue.map((p) => p.id));
    const deduped = profiles.filter((p) => !existingIds.has(p.id));
    this._queue.push(...deduped);
  },
};

// ── Internal fetch helper ──────────────────────────────────────────────────
async function _fetchPage(radiusKm, afterId = null, verifiedOnly = false) {
  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    maxDistanceKm: String(Math.min(radiusKm, MAX_RADIUS_KM)),
  });
  if (afterId) params.set('after_id', afterId);
  if (verifiedOnly) params.set('verifiedOnly', 'true');

  const response = await apiClient(`/deck?${params.toString()}`, { cache: true, ttl: 300000 });
  return response; // { success, candidates, nextCursor, hasMore }
}

// ── Auto-expand helper ─────────────────────────────────────────────────────
// Doubles radius up to MAX_RADIUS_KM until we have MIN_RESULTS_BEFORE_EXPAND results.
async function _fetchWithFallback(initialRadiusKm, verifiedOnly = false) {
  let radiusKm = initialRadiusKm;
  let response;

  while (true) {
    try {
      response = await _fetchPage(radiusKm, null, verifiedOnly);
    } catch (err) {
      throw err;
    }

    const count = response.candidates?.length ?? 0;

    if (count >= MIN_RESULTS_BEFORE_EXPAND || radiusKm >= MAX_RADIUS_KM) {
      // Enough results, or already at maximum radius — stop expanding
      DeckCache._effectiveRadiusKm = radiusKm;
      return response;
    }

    // Too few results — double the radius and retry
    const next = Math.min(radiusKm * 2, MAX_RADIUS_KM);
    console.log(
      `[DeckCache] Only ${count} results at ${radiusKm} km. Expanding to ${next} km.`
    );
    radiusKm = next;
  }
}

// ── Public: fetch a page of candidates ────────────────────────────────────
/**
 * Fetches potential matches for currentUser.
 * Uses the DeckCache cursor for pagination, auto-expands radius if results are sparse.
 *
 * @param {string} currentUserUid
 * @param {object} userProfile  - must have distance_range (miles) or defaults to 50mi
 * @param {number} [defaultRadiusMiles=50]
 * @returns {Promise<object[]>} array of mapped profile objects
 */
export const getPotentialMatches = async (
  currentUserUid,
  userProfile,
  defaultRadiusMiles = 50
) => {
  if (!currentUserUid || !userProfile) return [];

  // Prefer canonical maxDistanceKm (persisted to backend).
  // Fall back to legacy distance_range (miles) or the defaultRadius argument.
  const radiusKm =
    userProfile.maxDistanceKm ||
    (userProfile.distance_range ? userProfile.distance_range * MILES_TO_KM : defaultRadiusMiles * MILES_TO_KM);
  const verifiedOnly = userProfile.verifiedOnly || false;

  try {
    let response;
    if (!DeckCache._cursor && !DeckCache._exhausted) {
      // First page — use auto-expand fallback
      response = await _fetchWithFallback(radiusKm, verifiedOnly);
    } else if (!DeckCache._exhausted) {
      // Subsequent pages — use the effective (possibly expanded) radius
      response = await _fetchPage(
        DeckCache._effectiveRadiusKm,
        DeckCache._cursor,
        verifiedOnly
      );
    } else {
      return [];
    }

    if (response.success && Array.isArray(response.candidates)) {
      const mapped = response.candidates
        .map(mapBackendUserToProfile)
        .filter(Boolean);

      DeckCache._cursor = response.nextCursor ?? null;
      DeckCache._exhausted = !response.hasMore;

      return mapped;
    }
    return [];
  } catch (err) {
    console.warn('[DiscoverService] Error fetching potential matches:', err.message);
    return [];
  }
};

// ── Public: subscribe to the deck feed ────────────────────────────────────
/**
 * Fills the DeckCache on mount and invokes callback(profiles[]) immediately.
 * While the subscription is active, monitors cache size after every swipe
 * and triggers a background refetch when size ≤ REFETCH_THRESHOLD.
 *
 * Returns an unsubscribe function.
 *
 * @param {string}   currentUserUid
 * @param {object}   userProfile
 * @param {function} callback        - called with the current candidate list
 * @param {number}   [defaultRadius=50]  - miles
 * @returns {function} unsubscribe
 */
export const subscribeToPotentialMatches = (
  currentUserUid,
  userProfile,
  callback,
  defaultRadius = 50
) => {
  if (!currentUserUid || !userProfile) {
    callback([]);
    return () => {};
  }

  let active = true;

  // Reset the cache each time a fresh subscription opens (e.g. screen focus)
  DeckCache.reset();

  const load = async () => {
    if (!active || DeckCache._fetching) return;
    DeckCache._fetching = true;

    try {
      const profiles = await getPotentialMatches(
        currentUserUid,
        userProfile,
        defaultRadius
      );
      if (active) {
        DeckCache.push(profiles);
        callback(DeckCache.peek(), null);
      }
    } catch (err) {
      console.warn('[DiscoverService] subscribeToPotentialMatches load error:', err.message);
      if (active) callback(DeckCache.peek(), 'Failed to fetch profiles. Please try again.');
    } finally {
      DeckCache._fetching = false;
    }
  };

  // Initial load
  load();

  // Return an object with unsubscribe + a notifySwipe function.
  // DiscoverScreen calls unsubscribe on unmount.
  // We attach notifySwipe to the returned cleanup fn so the screen can optionally
  // call it; if the screen doesn't call it, the low-deck check runs on every render
  // via the profileCount effect in DiscoverScreen (we watch profiles.length there).
  const checkAndRefetch = () => {
    if (
      active &&
      !DeckCache._fetching &&
      !DeckCache._exhausted &&
      DeckCache.size() <= REFETCH_THRESHOLD
    ) {
      load();
    }
  };

  // Expose checkAndRefetch on the DeckCache so DiscoverScreen can call it
  // after each swipe without breaking the existing callback-based API.
  (DeckCache as any)._checkAndRefetch = checkAndRefetch;

  return () => {
    active = false;
  };
};

// ── Public: notifySwipe ───────────────────────────────────────────────────
/**
 * Called by DiscoverScreen after each swipe to trigger low-deck refetch.
 * Safe to call even if no subscription is active.
 */
export const notifyDeckSwipe = () => {
  if (typeof (DeckCache as any)._checkAndRefetch === 'function') {
    (DeckCache as any)._checkAndRefetch();
  }
};

// ── Public: recordSwipe ───────────────────────────────────────────────────
export const recordSwipe = async (
  currentUserUid,
  targetUserUid,
  direction,
  targetUserProfile,
  message = null
) => {
  if (!currentUserUid || !targetUserUid) return null;

  const action =
    direction === 'right'
      ? 'like'
      : direction === 'left'
      ? 'pass'
      : 'superlike';

  try {
    const response = await apiClient('/swipes', {
      method: 'POST',
      body: {
        swipedId: targetUserUid,
        direction: action,
        commentText: message || undefined,
      },
    });

    AnalyticsService.trackEvent('swipe_action', { action, target_user_id: targetUserUid, has_message: !!message });

    if (response.success && response.match) {
      AnalyticsService.trackEvent('new_match_created', { match_id: response.match.id, target_user_id: targetUserUid });
      return {
        id: response.match.id,
        matchedUser: mapBackendUserToProfile({
          id: targetUserUid,
          ...targetUserProfile,
        }),
      };
    }
    return null;
  } catch (err) {
    if (err.message && err.message.includes('403')) {
      return { limitReached: true };
    }
    console.warn('[DiscoverService] Error recording swipe:', err.message);
    return null;
  }
};

// ── Public: rewindLastSwipe ───────────────────────────────────────────────
export const rewindLastSwipe = async () => {
  try {
    const response = await apiClient('/swipes/rewind', {
      method: 'POST',
    });
    
    if (response.success) {
      AnalyticsService.trackEvent('swipe_rewound');
    }
    return response.success === true;
  } catch (err) {
    console.warn('[DiscoverService] Error rewinding swipe:', err.message);
    return false;
  }
};
