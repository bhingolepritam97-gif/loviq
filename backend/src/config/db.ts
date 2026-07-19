const { Sequelize } = require("sequelize");
require("dotenv").config();

if (!process.env.DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    "[db] DATABASE_URL is not set. Copy .env.example to .env and fill it in " +
      "(Neon free tier recommended: https://neon.tech)."
  );
}

const pg = require("pg");
const dbUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_yQS8pqjG4KWC@ep-crimson-lake-azq2cxhp-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const sequelize = new Sequelize(dbUrl, {
  dialect: "postgres",
  dialectModule: pg,
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
  },
});

module.exports = sequelize;


export {};
