const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Config = sequelize.define(
  "Config",
  {
    key: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    value: {
      type: DataTypes.JSONB,
      allowNull: false,
    }
  },
  {
    tableName: "configs",
    timestamps: true,
  }
);

module.exports = Config;

export {};
