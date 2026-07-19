const { Sequelize } = require("sequelize");
require("dotenv").config();

if (!process.env.DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    "[db] DATABASE_URL is not set. Copy .env.example to .env and fill it in " +
      "(Neon free tier recommended: https://neon.tech)."
  );
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  dialectOptions: {
    ssl:
      process.env.NODE_ENV === "production" || /neon\.tech/.test(process.env.DATABASE_URL || "")
        ? { require: true, rejectUnauthorized: false }
        : false,
  },
});

module.exports = sequelize;

export {};
