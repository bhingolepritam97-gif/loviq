require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const usersRoutes = require("./routes/users");
const deckRoutes = require("./routes/deck");
const swipesRoutes = require("./routes/swipes");
const matchesRoutes = require("./routes/matches");
const adminRoutes = require("./routes/admin");
const billingRoutes = require("./routes/billing");
const safetyRoutes = require("./routes/safety");
const promptsRoutes = require("./routes/prompts");

const app = express();

// CRITICAL SECURITY GUARD: Prevent mock auth from ever reaching production
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_MOCK_AUTH === 'true') {
  console.error('FATAL: ALLOW_MOCK_AUTH cannot be true in production! Exiting immediately.');
  process.exit(1);
}

app.set('trust proxy', 1);

// Bulletproof custom CORS middleware — intercepts preflight & headers for ALL origins and routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Exposed-Headers', 'X-RateLimit-Remaining');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({
  limit: "1mb",
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Health endpoint registered BEFORE rate limiter so warm-up pings don't count against quota
app.get("/health", (req, res) => res.json({ success: true, status: "ok" }));

app.use(
  rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60_000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Strict limiter for sensitive paths
const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  message: { success: false, error: "Too many requests to this endpoint. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/admin", sensitiveLimiter);
app.use("/billing", sensitiveLimiter);

const http = require("http");
const { Server } = require("socket.io");
const { User, Match, Message, sequelize } = require("./models");

// Run self-healing table migrations on startup to support women-first conversation model
if (sequelize) {
  sequelize.query(`
    ALTER TABLE matches ADD COLUMN IF NOT EXISTS first_message_sender_id UUID;
  `).catch(err => console.error("[migration] first_message_sender_id column failed:", err));

  sequelize.query(`
    ALTER TABLE matches ADD COLUMN IF NOT EXISTS chat_unlocked BOOLEAN DEFAULT FALSE;
  `).catch(err => console.error("[migration] chat_unlocked column failed:", err));
}

const server = http.createServer(app);
const io = new Server(server, {
  // Allow all origins to match the REST API CORS policy (open during development/PWA phase)
  cors: { origin: true, credentials: true }
});

if (process.env.REDIS_URL) {
  const { createClient } = require("redis");
  const { createAdapter } = require("@socket.io/redis-adapter");
  
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();
  
  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log("[socket] Redis adapter initialized successfully");
  }).catch(err => {
    console.error("[socket] Failed to initialize Redis adapter:", err);
  });
}

// Basic socket auth middleware matching our REST auth
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));
    
    let decoded;
    const admin = require("./config/firebase");
    try {
      if (process.env.ALLOW_MOCK_AUTH === "true" && (token.startsWith("mock_") || !admin.apps.length)) {
        decoded = {
          uid: token.startsWith("mock_") ? token : `mock_uid_${token.substring(0, 10)}`,
          phone_number: "+919999999999",
          email: "mockuser@loviq.app",
        };
      } else {
        decoded = await admin.auth().verifyIdToken(token);
      }
    } catch (verifyErr) {
      if (process.env.ALLOW_MOCK_AUTH === "true") {
        decoded = {
          uid: `mock_uid_${token.substring(0, 10)}`,
          phone_number: "+919999999999",
          email: "mockuser@loviq.app",
        };
      } else {
        return next(new Error("Invalid or expired Firebase token"));
      }
    }

    const dbUser = await User.findOne({ where: { firebaseUid: decoded.uid } });
    if (!dbUser) return next(new Error("User not found"));
    
    socket.dbUser = dbUser;
    next();
  } catch (err) {
    console.error("[socket] auth failed:", err.message);
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.dbUser.id;
  socket.join(`user_${userId}`);
  console.log(`Socket connected: ${socket.id} for user ${userId} (joined room user_${userId})`);
  
  socket.on("join_match", async (matchId) => {
    const match = await Match.findOne({ where: { id: matchId } });
    if (!match || (match.userAId !== userId && match.userBId !== userId)) {
      console.warn(`[socket] Unauthorized join_match attempt by ${userId} for ${matchId}`);
      return;
    }
    socket.join(`match_${matchId}`);
    console.log(`User ${userId} joined room match_${matchId}`);
  });

  socket.on("call_user", async ({ targetUserId, signalData, callType }) => {
    // Validate that these two users actually have an active match
    const m1 = await Match.findOne({ where: { userAId: userId, userBId: targetUserId, status: 'active' } });
    const m2 = await Match.findOne({ where: { userAId: targetUserId, userBId: userId, status: 'active' } });
    
    const activeMatch = m1 || m2;
    if (!activeMatch) {
       console.warn(`[socket] Unauthorized call_user attempt by ${userId} to ${targetUserId}`);
       return;
    }

    // Call blocked if first message has not been sent in a restricted match
    if (activeMatch.restrictedMode && !activeMatch.firstMessageSent) {
       console.warn(`[socket] Call blocked: match ${activeMatch.id} is restricted and pending initiation`);
       return;
    }

    io.to(`user_${targetUserId}`).emit("call_incoming", {
      fromUserId: userId,
      fromUserName: socket.dbUser.name || "Someone",
      signalData,
      callType
    });
  });

  socket.on("accept_call", ({ targetUserId, signalData }) => {
    io.to(`user_${targetUserId}`).emit("call_accepted", {
      signalData
    });
  });

  socket.on("end_call", ({ targetUserId }) => {
    io.to(`user_${targetUserId}`).emit("call_ended");
  });

  socket.on("webrtc_ice", ({ targetUserId, candidate }) => {
    io.to(`user_${targetUserId}`).emit("webrtc_ice", { candidate });
  });

  socket.on("webrtc_offer", ({ targetUserId, signalData }) => {
    io.to(`user_${targetUserId}`).emit("webrtc_offer", { signalData });
  });

  socket.on("webrtc_answer", ({ targetUserId, signalData }) => {
    io.to(`user_${targetUserId}`).emit("webrtc_answer", { signalData });
  });

  socket.on("typing", ({ matchId, isTyping }) => {
    socket.to(`match_${matchId}`).emit("typing", { senderId: userId, isTyping });
  });

  socket.on("mark_read", async ({ matchId }) => {
    try {
      // Mark all unread messages from the OTHER user in this match as read
      await Message.update(
        { isRead: true, readAt: new Date() },
        { 
          where: { 
            matchId, 
            isRead: false,
            // We only mark messages as read if the current user is NOT the sender
            senderId: { [require("sequelize").Op.ne]: userId }
          } 
        }
      );
      // Notify the other user that their messages were read
      socket.to(`match_${matchId}`).emit("messages_read", { matchId, readByUserId: userId });
    } catch (err) {
      console.error("[socket] mark_read error:", err);
    }
  });
  
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id} for user ${userId}`);
  });
});

// Attach io to req for controllers BEFORE routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/users", usersRoutes);
app.use("/deck", deckRoutes);
app.use("/swipes", swipesRoutes);
app.use("/matches", matchesRoutes);
app.use("/admin", adminRoutes);
app.use("/billing", billingRoutes);
app.use("/safety", safetyRoutes);
app.use("/prompts", promptsRoutes);

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

// Start background clean-up tasks ONLY in non-production/local environments.
// Background cleanup is now handled by the /admin/run-cleaners endpoint,
// triggered via a Kubernetes CronJob in all environments.

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`lovly backend listening on :${PORT}`);
});

// Graceful shutdown implementation
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);

  // 1. Drain WebSocket connections gradually
  const sockets = io.sockets.sockets;
  if (sockets.size > 0) {
    console.log(`Disconnecting ${sockets.size} active WebSocket clients...`);
    let delay = 0;
    sockets.forEach((socket) => {
      setTimeout(() => {
        socket.disconnect(true);
      }, delay);
      delay += Math.floor(Math.random() * 200) + 50; // space disconnection 50-250ms apart
    });
  }

  // 2. Close HTTP server and DB connections
  server.close(async () => {
    console.log("HTTP server closed.");
    try {
      const { sequelize } = require("./models");
      if (sequelize) {
        await sequelize.close();
        console.log("Sequelize connection closed.");
      }
    } catch (dbErr) {
      console.error("Error closing database during shutdown:", dbErr);
    }
    console.log("Graceful shutdown completed. Exiting process.");
    process.exit(0);
  });

  // Force exit if shutdown blocks
  setTimeout(() => {
    console.error("Shutdown timed out, forcing exit.");
    process.exit(1);
  }, 15000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

module.exports = app;

export {};
