const { User, ModerationLog, BannedIdentity } = require("../models");

/**
 * MOCK AI SAFETY SERVICE
 * In a real production environment, wire these functions up to Google Cloud Vision API, OpenAI, or Perspective API.
 */

// Basic keyword dictionary for local fallback mocking
const OFFENSIVE_KEYWORDS = ["scam", "crypto", "bitcoin", "whatsapp me", "cashapp", "venmo", "onlyfans", "hate", "slur", "kill"];

class SafetyService {
  /**
   * Scans text for spam, scams, harassment, or hate speech.
   */
  async analyzeText(userId: string, text: string) {
    if (!text) return null;
    
    const lowerText = text.toLowerCase();
    for (const keyword of OFFENSIVE_KEYWORDS) {
      if (lowerText.includes(keyword)) {
        await this.applyStrike(userId, `AI Flag: Detected restricted keyword '${keyword}' in text.`, 1, 0.85);
        return true;
      }
    }
    return false;
  }

  /**
   * Scans an image URL for NSFW content or fake profile patterns.
   */
  async analyzeImage(userId: string, imageUrl: string) {
    if (!imageUrl) return null;
    
    // MOCK: If image URL contains 'nsfw', flag it.
    if (imageUrl.includes("nsfw") || imageUrl.includes("fake")) {
      await this.applyStrike(userId, `AI Flag: Image detected as potentially violating guidelines.`, 2, 0.92);
      return true;
    }
    return false;
  }

  /**
   * Applies a strike to a user account, escalating to suspensions or bans.
   */
  async applyStrike(userId: string, reason: string, weight: number = 1, confidence: number = 1.0) {
    const user = await User.findByPk(userId);
    if (!user) return;

    // Increment strikes
    const newStrikes = user.strikes + weight;

    // Log the strike
    await ModerationLog.create({
      userId,
      actionType: "strike",
      reason,
      aiConfidenceScore: confidence
    });

    if (newStrikes >= 5) {
      // 5 Strikes = Permanent Ban
      await user.update({ strikes: newStrikes, isBanned: true, banReason: "Exceeded maximum moderation strikes." });
      await ModerationLog.create({ userId, actionType: "ban", reason: "Exceeded 5 strikes.", aiConfidenceScore: 1.0 });

      if (user.phone) {
        await BannedIdentity.findOrCreate({ where: { phone: user.phone }, defaults: { reason: "Exceeded 5 strikes." } });
      }
    } else if (newStrikes >= 3 && user.strikes < 3) {
      // 3 Strikes = Temporary Suspension (Shadow Ban for 7 days)
      const shadowBannedAt = new Date();
      await user.update({ strikes: newStrikes, isShadowBanned: true, shadowBannedAt });
      await ModerationLog.create({ userId, actionType: "shadow_ban", reason: "Reached 3 strikes (Temporary 7-day shadow ban).", aiConfidenceScore: 1.0 });
    } else {
      await user.update({ strikes: newStrikes });
    }
  }

  /**
   * Detects duplicate or evading accounts using device fingerprints and IPs.
   */
  async detectDuplicateAccount(deviceFingerprint: string, ipAddress: string) {
    // If a user with this fingerprint or IP was banned, we should flag this new account.
    if (!deviceFingerprint) return false;

    const previousBannedUsers = await User.count({
      where: {
        isBanned: true,
        deviceFingerprint
      }
    });

    if (previousBannedUsers > 0) {
      return true;
    }
    return false;
  }
}

module.exports = new SafetyService();

export {};
