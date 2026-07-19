/**
 * calculateProfileScore.js
 *
 * Pure function — no side effects, no imports.
 * Computes a 0–100 profile completeness score from a profile object
 * and returns both the score and a structured list of checklist items
 * so the UI can show exactly what's missing and how much each item is worth.
 *
 * Scoring weights (sum = 100):
 *  Photos         — up to 30 pts (first photo = 12, 2nd = 8, 3rd = 5, 4th-6th = 1.67 each)
 *  Bio            — up to 20 pts (1+ chars = 8, 40+ words = +12)
 *  Prompts        — up to 20 pts (1 prompt = 8, 2 = 14, 3 = 20)
 *  Verification   — 10 pts (binary)
 *  Interests      — up to 10 pts (1+ = 4, 3+ = 7, 5+ = 10)
 *  Basics         — up to 10 pts (exercise, drinking, pets, starSign — 2.5 each)
 *
 * @param {object} profile  — AuthContext profile object
 * @returns {{ score: number, items: ChecklistItem[] }}
 *
 * ChecklistItem shape:
 *   { key: string, label: string, sublabel: string, earned: number, max: number, done: boolean, cta: string }
 */
export function calculateProfileScore(profile) {
  if (!profile) return { score: 0, items: [] };

  const photos    = Array.isArray(profile.photos)    ? profile.photos.filter(Boolean)    : [];
  const interests = Array.isArray(profile.interests) ? profile.interests.filter(Boolean) : [];
  const prompts   = Array.isArray(profile.prompts)   ? profile.prompts.filter((p) => p?.reply?.trim()) : [];
  const bio       = (profile.bio || '').trim();
  const wordCount = bio.length === 0 ? 0 : bio.split(/\s+/).filter(Boolean).length;

  // ── Photos (30 pts) ──────────────────────────────────────────────────────────
  const PHOTO_VALUES = [12, 8, 5, 1.67, 1.67, 1.67]; // per photo slot
  let photoScore = 0;
  for (let i = 0; i < Math.min(photos.length, 6); i++) {
    photoScore += PHOTO_VALUES[i];
  }
  photoScore = Math.round(photoScore);

  const photoItem = {
    key: 'photos',
    label: 'Photos',
    sublabel: photos.length === 0
      ? 'Add your first photo to get noticed'
      : photos.length < 3
      ? `Add ${3 - photos.length} more photo${3 - photos.length > 1 ? 's' : ''} for a strong first impression`
      : photos.length < 6
      ? `Add ${6 - photos.length} more to max out your photo score`
      : 'You have the maximum 6 photos 🎉',
    earned: photoScore,
    max: 30,
    done: photos.length >= 3,
    cta: 'Manage Photos',
    ctaRoute: 'ManagePhotos',
    icon: '📸',
  };

  // ── Bio (20 pts) ─────────────────────────────────────────────────────────────
  const bioBase  = bio.length > 0 ? 8 : 0;
  const bioBonus = wordCount >= 40 ? 12 : wordCount >= 20 ? 6 : wordCount >= 5 ? 3 : 0;
  const bioScore = bioBase + bioBonus;

  const bioItem = {
    key: 'bio',
    label: 'Bio',
    sublabel: bio.length === 0
      ? 'Write a bio — profiles with bios get far more matches'
      : wordCount < 20
      ? `${wordCount} words — aim for 40+ to get the full bio score`
      : wordCount < 40
      ? `${wordCount} words — almost there! 40+ words earns the full 20 pts`
      : `Great bio! (${wordCount} words)`,
    earned: bioScore,
    max: 20,
    done: wordCount >= 40,
    cta: 'Edit Bio',
    ctaRoute: 'EditProfile',
    icon: '📝',
  };

  // ── Prompts (20 pts) ─────────────────────────────────────────────────────────
  const promptScore = prompts.length === 0 ? 0 : prompts.length === 1 ? 8 : prompts.length === 2 ? 14 : 20;

  const promptItem = {
    key: 'prompts',
    label: 'Profile Prompts',
    sublabel: prompts.length === 0
      ? 'Answer a prompt — they spark conversations'
      : prompts.length < 3
      ? `Add ${3 - prompts.length} more prompt${3 - prompts.length > 1 ? 's' : ''} for the full score`
      : 'All 3 prompts answered 🎉',
    earned: promptScore,
    max: 20,
    done: prompts.length >= 3,
    cta: 'Manage Prompts',
    ctaRoute: 'ManagePrompts',
    icon: '🎙️',
  };

  // ── Verification (10 pts) ────────────────────────────────────────────────────
  const verifyScore = profile.isVerified ? 10 : 0;

  const verifyItem = {
    key: 'verified',
    label: 'Photo Verification',
    sublabel: profile.isVerified
      ? "You're verified — verified profiles get 3× more matches"
      : 'Verify your identity to earn the blue checkmark',
    earned: verifyScore,
    max: 10,
    done: !!profile.isVerified,
    cta: 'Get Verified',
    ctaRoute: 'PhotoVerification',
    icon: '🛡️',
  };

  // ── Interests (10 pts) ───────────────────────────────────────────────────────
  const interestScore = interests.length >= 5 ? 10 : interests.length >= 3 ? 7 : interests.length >= 1 ? 4 : 0;

  const interestItem = {
    key: 'interests',
    label: 'Interests',
    sublabel: interests.length === 0
      ? 'Select at least 3 interests to personalise your profile'
      : interests.length < 3
      ? `Add ${3 - interests.length} more interest${3 - interests.length > 1 ? 's' : ''}`
      : interests.length < 5
      ? `Add ${5 - interests.length} more for the full score`
      : `${interests.length} interests selected 🎉`,
    earned: interestScore,
    max: 10,
    done: interests.length >= 5,
    cta: 'Edit Interests',
    ctaRoute: 'EditProfile',
    icon: '🏷️',
  };

  // ── Basics (10 pts) ──────────────────────────────────────────────────────────
  const basicsFields = ['exercise', 'drinking', 'pets', 'starSign'];
  const basicsFilledCount = basicsFields.filter((f) => !!profile[f]).length;
  const basicsScore = Math.round(basicsFilledCount * 2.5);

  const basicsItem = {
    key: 'basics',
    label: 'Lifestyle Basics',
    sublabel: basicsFilledCount === 0
      ? 'Fill in exercise, drinking, pets & star sign'
      : basicsFilledCount < 4
      ? `${4 - basicsFilledCount} more basic${4 - basicsFilledCount > 1 ? 's' : ''} to fill (exercise, drinking, pets, star sign)`
      : 'All lifestyle basics filled 🎉',
    earned: basicsScore,
    max: 10,
    done: basicsFilledCount >= 4,
    cta: 'Edit Basics',
    ctaRoute: 'EditProfile',
    icon: '📋',
  };

  // ── Total ────────────────────────────────────────────────────────────────────
  const total = photoScore + bioScore + promptScore + verifyScore + interestScore + basicsScore;
  const score = Math.min(100, Math.round(total));

  return {
    score,
    items: [photoItem, bioItem, promptItem, verifyItem, interestItem, basicsItem],
  };
}

/**
 * Returns a short motivational label for a given score.
 * Used as the subtitle inside the score ring.
 */
export function scoreLabel(score) {
  if (score >= 95) return 'Elite';
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Building';
  return 'Just started';
}

/**
 * Returns the accent color for the ring based on score.
 */
export function scoreColor(score) {
  if (score >= 80) return '#10b981'; // green
  if (score >= 60) return '#E94B73'; // brand primary
  if (score >= 40) return '#f59e0b'; // amber
  return '#ef4444';                  // red
}
