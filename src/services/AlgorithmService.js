/**
 * AlgorithmService.js
 * 
 * Core mathematical engine for calculating ELO scores, ranking stacks, 
 * and analyzing swipe behavior for spam detection.
 */

const DEFAULT_ELO = 1500;
const ELO_K_FACTOR = 32;

/**
 * Calculates the new ELO score for a user after being swiped on.
 * 
 * @param {number} targetElo - The person being swiped on
 * @param {number} swiperElo - The person doing the swiping
 * @param {number} outcome - 1 = right swipe (like), 0 = left swipe (pass)
 * @returns {number} The new ELO score for the target user
 */
export const calculateEloUpdate = (targetElo = DEFAULT_ELO, swiperElo = DEFAULT_ELO, outcome) => {
  // Expected score (sigmoid function)
  const expected = 1 / (1 + Math.pow(10, (swiperElo - targetElo) / 400));
  
  // New ELO for the profile being judged
  const newElo = targetElo + ELO_K_FACTOR * (outcome - expected);
  
  return Math.round(newElo);
};

/**
 * Analyzes swipe behavior to flag spammers or overly picky users.
 * 
 * @param {object} swipeStats - { totalSwipes: number, rightSwipes: number }
 * @returns {object} { type: string, penalty: number }
 */
export const analyzeSwipeBehavior = (swipeStats) => {
  if (!swipeStats || swipeStats.totalSwipes < 20) {
    return { type: 'NORMAL', penalty: 0 };
  }

  const rightSwipeRate = swipeStats.rightSwipes / swipeStats.totalSwipes;

  if (rightSwipeRate > 0.90) {
    return { type: 'SPAM_SWIPER', penalty: -0.40 };
  } else if (rightSwipeRate > 0.70) {
    return { type: 'LOW_SELECTIVITY', penalty: -0.15 };
  } else if (rightSwipeRate < 0.05) {
    return { type: 'HIGH_SELECTIVITY', penalty: 0 }; // Potentially adjust recommendations
  }

  return { type: 'NORMAL', penalty: 0 };
};

/**
 * Applies business logic modifiers to rank candidates in the discovery stack.
 * 
 * @param {object} currentUser - The user swiping
 * @param {object} candidate - The potential match profile
 * @param {number} baseScore - The initial score (usually based on ELO)
 * @returns {number} The final adjusted score
 */
export const applyRankingModifiers = (currentUser, candidate, baseScore) => {
  let adjustedScore = baseScore;

  // New User Boost (Account < 48h old)
  // Assuming createdAt is a timestamp
  const now = Date.now();
  const candidateAgeMs = candidate.createdAt ? (now - candidate.createdAt.toMillis?.() || candidate.createdAt) : now;
  if (candidateAgeMs < 48 * 60 * 60 * 1000) {
    adjustedScore *= 1.50; // +50% score
  }

  // Recency Boost (Active within 24 hours)
  const lastActiveMs = candidate.lastActive ? (now - candidate.lastActive.toMillis?.() || candidate.lastActive) : now;
  if (lastActiveMs < 24 * 60 * 60 * 1000) {
    adjustedScore *= 1.20; // +20% score
  }

  // Verification Boost
  if (candidate.isVerified) {
    adjustedScore *= 1.10; // +10% score
  }

  // Premium Boost
  if (candidate.isPremium) {
    adjustedScore *= 1.15; // +15% score
  }

  // ELO Mismatch Penalty
  const userElo = currentUser.eloScore || DEFAULT_ELO;
  const candidateElo = candidate.eloScore || DEFAULT_ELO;
  if (Math.abs(userElo - candidateElo) > 400) {
    adjustedScore *= 0.75; // -25% score
  }

  return adjustedScore;
};

/**
 * Ranks a pool of candidates based on ELO proximity and modifiers.
 */
export const rankCandidates = (currentUser, candidatesPool) => {
  const userElo = currentUser.eloScore || DEFAULT_ELO;

  const scoredCandidates = candidatesPool.map(candidate => {
    const candidateElo = candidate.eloScore || DEFAULT_ELO;
    
    // Base score is inversely proportional to ELO difference (closer ELO = higher base score)
    const eloDiff = Math.abs(userElo - candidateElo);
    // Let's create a base score out of 100, where 0 diff = 100, 400 diff = ~20
    const baseScore = Math.max(10, 100 - (eloDiff / 5));

    const finalScore = applyRankingModifiers(currentUser, candidate, baseScore);

    return { ...candidate, _algorithmScore: finalScore };
  });

  // Sort descending by highest score
  return scoredCandidates.sort((a, b) => b._algorithmScore - a._algorithmScore);
};
