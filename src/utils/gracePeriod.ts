import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  SIGNUP_TIMESTAMP: 'Lovly_signup_timestamp',
  FREE_REVEAL_USED: 'Lovly_free_reveal_used',
};

const GRACE_PERIOD_HOURS = 24;

/**
 * Call this ONCE, right when a new user finishes onboarding (in
 * PhotoUploadScreen's finishOnboarding, for example). Starts the clock
 * for the first-session grace period.
 */
export async function startGracePeriod() {
  const existing = await AsyncStorage.getItem(KEYS.SIGNUP_TIMESTAMP);
  if (!existing) {
    await AsyncStorage.setItem(KEYS.SIGNUP_TIMESTAMP, Date.now().toString());
  }
}

/**
 * Returns true if the user is still inside their free first-24h window.
 * During this window: unlimited swipes, all likes unlocked, no paywall.
 * @param {Object} [profile] - The user profile object containing createdAt.
 */
export async function getGracePeriodStatus(profile = null) {
  let signupTimestamp;
  if (profile && profile.createdAt) {
    signupTimestamp = new Date(profile.createdAt).getTime();
  } else {
    const stored = await AsyncStorage.getItem(KEYS.SIGNUP_TIMESTAMP);
    if (!stored) return false;
    signupTimestamp = Number(stored);
  }
  const elapsedHours = (Date.now() - signupTimestamp) / (1000 * 60 * 60);
  return elapsedHours < GRACE_PERIOD_HOURS;
}

export async function hasUsedFreeReveal() {
  const used = await AsyncStorage.getItem(KEYS.FREE_REVEAL_USED);
  return used === 'true';
}

export async function markFreeRevealUsed() {
  await AsyncStorage.setItem(KEYS.FREE_REVEAL_USED, 'true');
}

/*
 NOTE: AsyncStorage is easy to fake by reinstalling the app, which is fine
 for now (it's a growth/trust feature, not a security feature). If you
 want it tamper-proof later, move signupTimestamp and freeRevealUsed onto
 the user's backend record instead of local storage.
*/
