// MVP-stage schema setup: enables PostGIS and syncs Sequelize models
// directly (CREATE TABLE IF NOT EXISTS-style). Fine for a 1k-user launch;
// once the schema stabilizes, switch to `sequelize-cli` migrations so
// production changes are versioned instead of auto-synced.
require("dotenv").config();
const sequelize = require("../config/db");
require("../models"); // registers associations

async function main() {
  await sequelize.query("CREATE EXTENSION IF NOT EXISTS postgis;");
  await sequelize.sync({ alter: true });
  console.log("Database synced (tables created/updated, PostGIS enabled).");
  process.exit(0);
}

main().catch((err) => {
  console.error("DB sync failed:", err);
  process.exit(1);
});
