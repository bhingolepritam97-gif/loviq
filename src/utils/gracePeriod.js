import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  SIGNUP_TIMESTAMP: 'vela_signup_timestamp',
  FREE_REVEAL_USED: 'vela_free_reveal_used',
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
 */
export async function getGracePeriodStatus() {
  const signupTimestamp = await AsyncStorage.getItem(KEYS.SIGNUP_TIMESTAMP);
  if (!signupTimestamp) return false;
  const elapsedHours = (Date.now() - Number(signupTimestamp)) / (1000 * 60 * 60);
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
