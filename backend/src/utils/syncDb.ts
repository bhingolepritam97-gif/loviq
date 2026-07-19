// MVP-stage schema setup: enables PostGIS and syncs Sequelize models
// directly (CREATE TABLE IF NOT EXISTS-style). Fine for a 1k-user launch;
// once the schema stabilizes, switch to `sequelize-cli` migrations so
// production changes are versioned instead of auto-synced.
require("dotenv").config();
const sequelize = require("../config/db");
require("../models"); // registers associations

async function main() {
  // PostGIS is optional — Neon free tier may not have it
  try {
    await sequelize.query("CREATE EXTENSION IF NOT EXISTS postgis;");
    console.log("[db] PostGIS extension enabled.");
  } catch (e) {
    console.warn("[db] PostGIS not available (skipping):", e.message.split('\n')[0]);
  }
  await sequelize.sync({ alter: process.env.NODE_ENV !== "production" });
  
  // Phase 7: Seed default emergency numbers
  // Phase 7: Seed default emergency numbers
  const { Config, Prompt } = require("../models");
  await Config.findOrCreate({
    where: { key: "emergency_numbers" },
    defaults: { value: { "Global": "112", "India": "1091", "US": "911", "UK": "999" } }
  });

  // Seed default Prompts for profiles
  const defaultPrompts = [
    { category: "Playful", questionText: "The most spontaneous thing I've done is..." },
    { category: "Playful", questionText: "My simple pleasures are..." },
    { category: "Depth", questionText: "I'm looking for someone who..." },
    { category: "Depth", questionText: "The way to win me over is..." },
    { category: "Conversation", questionText: "Two truths and a lie..." },
    { category: "Conversation", questionText: "Unpopular opinion..." },
    { category: "Pune Local", questionText: "My go-to Pune weekend spot is..." },
    { category: "Pune Local", questionText: "The best thing about Pune I'd tell an outsider..." }
  ];

  for (const p of defaultPrompts) {
    await Prompt.findOrCreate({
      where: { questionText: p.questionText },
      defaults: { category: p.category }
    });
  }

  console.log("Database synced (tables created/updated, PostGIS enabled, Configs seeded).");
  process.exit(0);
}

main().catch((err) => {
  console.error("DB sync failed:", err);
  process.exit(1);
});


export {};
