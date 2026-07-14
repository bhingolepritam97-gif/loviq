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

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: ['vela://', 'https://loviq-api.onrender.com'] }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(
  rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60_000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/health", (req, res) => res.json({ success: true, status: "ok" }));

const http = require("http");
const { Server } = require("socket.io");
const { User, Match, Message } = require("./models");

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ['vela://', 'https://loviq-api.onrender.com'] }
});

// Basic socket auth middleware matching our REST auth
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));
    
    let decoded;
    try {
      const admin = require("./config/firebase");
      decoded = await admin.auth().verifyIdToken(token);
    } catch (verifyErr) {
      return next(new Error("Invalid or expired Firebase token"));
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

const userSocketMap = new Map(); // maps userId -> socket.id

io.on("connection", (socket) => {
  const userId = socket.dbUser.id;
  userSocketMap.set(userId, socket.id);
  console.log(`Socket connected: ${socket.id} for user ${userId}`);
  
  socket.on("join_match", async (matchId) => {
    const match = await Match.findOne({ where: { id: matchId } });
    if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
      console.warn(`[socket] Unauthorized join_match attempt by ${userId} for ${matchId}`);
      return;
    }
    socket.join(`match_${matchId}`);
    console.log(`User ${userId} joined room match_${matchId}`);
  });

  socket.on("call_user", async ({ targetUserId, signalData, callType }) => {
    // Validate that these two users actually have a match
    const hasMatch = await Match.findOne({
      where: {
        status: 'active'
      },
      // In Sequelize, Op.or is needed for this logic, but for simplicity we can do a raw-ish query or 
      // rely on the fact that if they have an active match where one is user1 and other is user2
    });
    // Let's write a safer validation check
    const m1 = await Match.findOne({ where: { user1Id: userId, user2Id: targetUserId, status: 'active' } });
    const m2 = await Match.findOne({ where: { user1Id: targetUserId, user2Id: userId, status: 'active' } });
    
    if (!m1 && !m2) {
       console.warn(`[socket] Unauthorized call_user attempt by ${userId} to ${targetUserId}`);
       return;
    }

    const targetSocketId = userSocketMap.get(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("call_incoming", {
        fromUserId: userId,
        fromUserName: socket.dbUser.name || "Someone",
        signalData,
        callType
      });
    }
  });

  socket.on("accept_call", ({ targetUserId, signalData }) => {
    const targetSocketId = userSocketMap.get(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("call_accepted", {
        signalData
      });
    }
  });

  socket.on("end_call", ({ targetUserId }) => {
    const targetSocketId = userSocketMap.get(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("call_ended");
    }
  });

  socket.on("webrtc_ice", ({ targetUserId, candidate }) => {
    const targetSocketId = userSocketMap.get(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("webrtc_ice", { candidate });
    }
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
    userSocketMap.delete(userId);
    console.log(`Socket disconnected: ${socket.id}`);
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

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`vela backend listening on :${PORT}`);
});

module.exports = app;
