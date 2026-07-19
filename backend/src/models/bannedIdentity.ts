const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const BannedIdentity = sequelize.define(
  "BannedIdentity",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    deviceId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      field: "device_id",
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  },
  {
    tableName: "banned_identities",
    underscored: true,
    timestamps: true,
  }
);

module.exports = BannedIdentity;


export {};
