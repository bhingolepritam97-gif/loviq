const { TrustedContact, DateShare, Match, User, Photo } = require("../models");
const { Op } = require("sequelize");

// POST /safety/trusted-contacts
async function addTrustedContact(req, res) {
  try {
    const { contactName, contactPhone } = req.body;
    if (!contactName || !contactPhone) {
      return res.status(400).json({ success: false, error: "Name and phone are required." });
    }

    const contact = await TrustedContact.create({
      userId: req.dbUser.id,
      contactName,
      contactPhone
    });

    res.status(201).json({ success: true, contact });
  } catch (err) {
    console.error("[safetyController] addTrustedContact error:", err);
    res.status(500).json({ success: false, error: "Failed to add trusted contact." });
  }
}

// GET /safety/trusted-contacts
async function getTrustedContacts(req, res) {
  try {
    const contacts = await TrustedContact.findAll({
      where: { userId: req.dbUser.id },
      order: [["createdAt", "DESC"]]
    });
    res.json({ success: true, contacts });
  } catch (err) {
    console.error("[safetyController] getTrustedContacts error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch trusted contacts." });
  }
}

// POST /safety/share-date
async function shareDate(req, res) {
  try {
    const { matchId, plannedTime, location } = req.body;
    
    if (!matchId) {
      return res.status(400).json({ success: false, error: "matchId is required." });
    }

    const match = await Match.findByPk(matchId);
    if (!match || (match.userAId !== req.dbUser.id && match.userBId !== req.dbUser.id)) {
      return res.status(404).json({ success: false, error: "Match not found." });
    }

    // Default expiration to 24 hours from now if plannedTime isn't provided, 
    // otherwise 24 hours after the planned date.
    const baseTime = plannedTime ? new Date(plannedTime) : new Date();
    const expiresAt = new Date(baseTime.getTime() + 24 * 60 * 60 * 1000);

    const dateShare = await DateShare.create({
      userId: req.dbUser.id,
      matchId,
      plannedTime: plannedTime || null,
      location: location || null,
      expiresAt
    });

    // Generate a shareable URL (assuming web app is hosted at loviq.app)
    const shareUrl = `https://loviq.app/safety/date/${dateShare.id}`;

    res.status(201).json({ success: true, dateShare, shareUrl });
  } catch (err) {
    console.error("[safetyController] shareDate error:", err);
    res.status(500).json({ success: false, error: "Failed to create date share." });
  }
}

// GET /safety/date/:id (Public route for trusted contacts)
async function getDateShareContent(req, res) {
  try {
    const dateShare = await DateShare.findByPk(req.params.id, {
      include: [
        {
          model: Match, as: "Match",
          include: [
            { model: User, as: "userA", include: [{ model: Photo, as: "photos" }] },
            { model: User, as: "userB", include: [{ model: Photo, as: "photos" }] }
          ]
        },
        { model: User, as: "User" }
      ]
    });

    if (!dateShare) {
      return res.status(404).json({ success: false, error: "Link not found or invalid." });
    }

    if (new Date() > new Date(dateShare.expiresAt)) {
      return res.status(410).json({ success: false, error: "This date share link has expired." });
    }

    const theMatch = dateShare.Match;
    const datePerson = theMatch.userAId === dateShare.userId ? theMatch.userB : theMatch.userA;
    const creator = dateShare.User;

    // Filter private fields out before sending to the public view
    const safeDatePerson = {
      name: datePerson.name,
      age: datePerson.birthdate ? new Date().getFullYear() - new Date(datePerson.birthdate).getFullYear() : null,
      bio: datePerson.bio,
      photos: datePerson.photos.map(p => p.url),
      isVerified: datePerson.isVerified
    };

    res.json({
      success: true,
      creatorName: creator.name,
      plannedTime: dateShare.plannedTime,
      location: dateShare.location,
      matchProfile: safeDatePerson
    });
  } catch (err) {
    console.error("[safetyController] getDateShareContent error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch date share." });
  }
}

// POST /safety/sos
async function triggerSos(req, res) {
  try {
    const userId = req.dbUser.id;
    const { lat, lng } = req.body;
    
    const contacts = await TrustedContact.findAll({ where: { userId } });
    if (contacts.length === 0) {
      return res.status(400).json({ success: false, error: "No trusted contacts configured." });
    }

    let locationStr = "unknown location";
    if (lat && lng) {
      locationStr = `https://maps.google.com/?q=${lat},${lng}`;
    }

    const messageBody = `EMERGENCY: ${req.dbUser.name || 'A user'} has triggered an SOS alert from Lovly. Last known location: ${locationStr}`;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    const isTwilioConfigured = !!(accountSid && authToken && fromNumber);

    if (isTwilioConfigured) {
      console.log(`[SOS TRIGGERED] Sending real SMS via Twilio for user ${req.dbUser.name || req.dbUser.id}.`);
      
      const authString = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

      const smsPromises = contacts.map(async (c) => {
        try {
          const params = new URLSearchParams();
          params.append("To", c.contactPhone);
          params.append("From", fromNumber);
          params.append("Body", messageBody);

          const response = await fetch(twilioUrl, {
            method: "POST",
            headers: {
              "Authorization": `Basic ${authString}`,
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: params.toString()
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || response.statusText);
          }
          return { phone: c.contactPhone, success: true };
        } catch (smsErr) {
          console.error(`[safetyController] Twilio SMS failed for ${c.contactPhone}:`, smsErr.message);
          return { phone: c.contactPhone, success: false, error: smsErr.message };
        }
      });

      const results = await Promise.all(smsPromises);
      const successfulCount = results.filter(r => r.success).length;

      return res.json({ 
        success: true, 
        message: `SOS alert dispatched. Sent to ${successfulCount} of ${contacts.length} contacts.`,
        details: results 
      });
    } else {
      // Mock fallback if Twilio is not configured
      console.warn("[safetyController] Twilio not configured. SOS logging mock SMS details.");
      contacts.forEach(c => {
        console.log(`[SMS mock to ${c.contactPhone}]: ${messageBody}`);
      });

      return res.json({ 
        success: true, 
        isMock: true, 
        message: `SOS simulated. SMS logged to console for ${contacts.length} contacts.` 
      });
    }
  } catch (err) {
    console.error("[safetyController] triggerSos error:", err);
    res.status(500).json({ success: false, error: "Failed to trigger SOS." });
  }
}

// POST /safety/report
async function reportUser(req, res) {
  try {
    const { targetId, reason, details } = req.body;
    if (!targetId || !reason) {
      return res.status(400).json({ success: false, error: "targetId and reason are required." });
    }

    const { Report } = require("../models");
    const report = await Report.create({
      reporterId: req.dbUser.id,
      reportedId: targetId,
      reason,
      details
    });

    res.status(201).json({ success: true, report });
  } catch (err) {
    console.error("[safetyController] reportUser error:", err);
    res.status(500).json({ success: false, error: "Failed to report user." });
  }
}

// POST /safety/block
async function blockUser(req, res) {
  try {
    const { targetId } = req.body;
    if (!targetId) {
      return res.status(400).json({ success: false, error: "targetId is required." });
    }

    const { Block, Match } = require("../models");
    await Block.findOrCreate({
      where: {
        blockerId: req.dbUser.id,
        blockedId: targetId
      }
    });

    // Unmatch if they are currently matched
    await Match.destroy({
      where: {
        [Op.or]: [
          { userAId: req.dbUser.id, userBId: targetId },
          { userAId: targetId, userBId: req.dbUser.id }
        ]
      }
    });

    res.status(201).json({ success: true });
  } catch (err) {
    console.error("[safetyController] blockUser error:", err);
    res.status(500).json({ success: false, error: "Failed to block user." });
  }
}

module.exports = {
  addTrustedContact,
  getTrustedContacts,
  shareDate,
  getDateShareContent,
  triggerSos,
  reportUser,
  blockUser
};

export {};
