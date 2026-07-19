const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const InviteCode = sequelize.define(
  "InviteCode",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    createdById: {
      type: DataTypes.UUID,
      allowNull: true, // Null for admin-generated seeding codes
      field: "created_by_id",
    },
    usedById: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "used_by_id",
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "used_at",
    },
  },
  {
    tableName: "invite_codes",
    underscored: true,
    timestamps: true,
    indexes: [
      { unique: true, fields: ["code"] }
    ]
  }
);

module.exports = InviteCode;

export {};
