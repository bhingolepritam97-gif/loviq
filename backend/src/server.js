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

app.use(helmet());
app.use(cors());
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
const { User } = require("./models");

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Basic socket auth middleware matching our REST auth
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));
    
    const admin = require("./config/firebase");
    const decoded = await admin.auth().verifyIdToken(token);
    const dbUser = await User.findOne({ where: { firebaseUid: decoded.uid } });
    if (!dbUser) return next(new Error("User not found"));
    
    socket.dbUser = dbUser;
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id} for user ${socket.dbUser.id}`);
  
  socket.on("join_match", (matchId) => {
    socket.join(`match_${matchId}`);
    console.log(`User ${socket.dbUser.id} joined room match_${matchId}`);
  });
  
  socket.on("disconnect", () => {
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
