/**
 * useLocationCapture.js
 *
 * Reusable hook that:
 *  1. Requests expo-location foreground permission
 *  2. Gets the device's current lat/lng
 *  3. Reverse-geocodes for a human-readable cityName
 *  4. Calls updateUserProfile() — which in turn:
 *       • PATCHes the backend REST API (primary)
 *       • Writes geohash to Firestore profiles/{uid} (fallback path, fire-and-forget)
 *
 * Usage:
 *   const { locationReady, captureLocation } = useLocationCapture({ user, profile });
 *
 * Returns:
 *   locationReady   {boolean}  — true once location has been saved successfully
 *   captureLocation {function} — call manually to trigger / retry capture
 */

import { useState, useCallback, useRef } from 'react';
import { updateUserProfile } from '../services/UserService';

const FALLBACK_CITY = 'Nearby';

export function useLocationCapture({ user, profile, onLocationSaved } = {}) {
  const [locationReady, setLocationReady] = useState(
    !!(profile?.location?.latitude)
  );
  const capturing = useRef(false); // prevent concurrent calls

  const captureLocation = useCallback(async () => {
    if (!user?.uid) return;
    if (capturing.current) return;
    // Already have a location — no need to re-capture unless called explicitly
    if (locationReady && profile?.location?.latitude) return;

    capturing.current = true;

    try {
      // Lazy-load expo-location to avoid adding it to the top-level bundle
      const Location = await import('expo-location');

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[useLocationCapture] Location permission denied.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      if (!loc?.coords) {
        console.warn('[useLocationCapture] No coordinates returned.');
        return;
      }

      const { latitude, longitude } = loc.coords;

      // Best-effort reverse geocode
      let cityName = FALLBACK_CITY;
      try {
        const places = await Location.reverseGeocodeAsync({ latitude, longitude });
        cityName =
          places?.[0]?.city ||
          places?.[0]?.subregion ||
          places?.[0]?.region ||
          FALLBACK_CITY;
      } catch (geoErr) {
        console.warn('[useLocationCapture] Reverse geocode failed:', geoErr.message);
      }

      // updateUserProfile handles both the REST PATCH and the Firestore geohash write
      const updated = await updateUserProfile(user.uid, {
        location: { latitude, longitude, cityName },
      });

      if (updated) {
        setLocationReady(true);
        if (typeof onLocationSaved === 'function') {
          onLocationSaved(updated);
        }
      }
    } catch (err) {
      console.warn('[useLocationCapture] Capture failed:', err.message);
    } finally {
      capturing.current = false;
    }
  }, [user?.uid, locationReady, profile?.location?.latitude, onLocationSaved]);

  return { locationReady, captureLocation };
}
