const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Match = sequelize.define(
  "Match",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userAId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_a_id",
    },
    userBId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_b_id",
    },
    status: {
      type: DataTypes.ENUM("active", "unmatched", "archived"),
      defaultValue: "active",
    },
    restrictedMode: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "restricted_mode",
    },
    onlyUserIdCanMessageFirst: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "only_user_id_can_message_first",
    },
    messageDeadline: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "message_deadline",
    },
    firstMessageSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "first_message_sent",
    },
    firstMessageSenderId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "first_message_sender_id",
    },
    chatUnlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "chat_unlocked",
    },
  },
  {
    tableName: "matches",
    underscored: true,
    timestamps: true,
    indexes: [
      { unique: true, fields: ["user_a_id", "user_b_id"] },
      // Index for user_b_id to prevent full table scans when looking up matches
      {
        name: "matches_user_b_id_idx",
        fields: ["user_b_id"]
      },
      {
        name: "matches_user_b_id_status_idx",
        fields: ["user_b_id", "status"],
        where: { status: "active" }
      }
    ],
  }
);

module.exports = Match;


export {};
