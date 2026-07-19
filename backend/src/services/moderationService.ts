const { Photo } = require("../models");

/**
 * Moderates an image URL using Google Cloud Vision API Safe Search.
 * Falls back to local keyword check if API key is missing.
 * 
 * @param {string} imageUrl 
 * @returns {Promise<{ approved: boolean, reason: string|null }>}
 */
async function moderateImage(imageUrl) {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;

  if (!apiKey) {
    console.log("[ModerationService] Google Vision API key missing. Running mock check.");
    const lowerUrl = imageUrl.toLowerCase();
    if (lowerUrl.includes("nsfw") || lowerUrl.includes("explicit") || lowerUrl.includes("nude")) {
      return { approved: false, reason: "Mock Filter: Explicit content detected." };
    }
    return { approved: true, reason: null };
  }

  try {
    const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    
    // Node 18+ global fetch API
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: {
              source: { imageUri: imageUrl }
            },
            features: [
              { type: "SAFE_SEARCH_DETECTION" }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Google Vision API responded with status ${response.status}`);
    }

    const data = await response.json();
    const annotation = data.responses?.[0]?.safeSearchAnnotation;

    if (!annotation) {
      console.warn("[ModerationService] safeSearchAnnotation missing in API response. Defaulting to approved.");
      return { approved: true, reason: null };
    }

    // safeSearch Likelihood levels: VERY_UNLIKELY, UNLIKELY, POSSIBLE, LIKELY, VERY_LIKELY
    const rejectLevels = ["LIKELY", "VERY_LIKELY"];
    const isAdult = rejectLevels.includes(annotation.adult);
    const isRacy = rejectLevels.includes(annotation.racy);
    const isViolence = rejectLevels.includes(annotation.violence);

    if (isAdult || isRacy || isViolence) {
      const reason = `Flagged categories:${isAdult ? " Adult" : ""}${isRacy ? " Racy" : ""}${isViolence ? " Violence" : ""}`;
      return { approved: false, reason };
    }

    return { approved: true, reason: null };
  } catch (err) {
    console.error("[ModerationService] Google Vision API request failed:", err);
    // Fail closed/pending rather than auto-approving on request errors
    return { approved: false, reason: "Verification API Error. Pending manual moderation." };
  }
}

module.exports = { moderateImage };


export {};
