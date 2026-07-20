const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ModerationLog = sequelize.define(
  "ModerationLog",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
    },
    actionType: {
      type: DataTypes.ENUM("strike", "suspend", "ban", "shadow_ban", "ai_flag", "lift_shadow_ban"),
      allowNull: false,
      field: "action_type",
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    aiConfidenceScore: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: "ai_confidence_score",
    },
  },
  {
    tableName: "moderation_logs",
    underscored: true,
    timestamps: true, // adds createdAt and updatedAt
  }
);

module.exports = ModerationLog;

export {};
