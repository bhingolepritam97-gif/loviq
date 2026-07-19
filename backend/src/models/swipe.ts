const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Swipe = sequelize.define(
  "Swipe",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    swiperId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "swiper_id",
    },
    swipedId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "swiped_id",
    },
    direction: {
      type: DataTypes.ENUM("like", "pass", "superlike"),
      allowNull: false,
    },
    likedContentType: {
      type: DataTypes.ENUM("photo", "prompt_answer", "voice_note"),
      allowNull: true,
      field: "liked_content_type",
    },
    likedContentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "liked_content_id",
    },
    commentText: {
      type: DataTypes.STRING(140),
      allowNull: true,
      field: "comment_text",
    },
    expiredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "expired_at",
    },
  },
  {
    tableName: "swipes",
    underscored: true,
    timestamps: true,
    updatedAt: false,
    indexes: [
      // A user can only swipe on another user once (re-swiping should be an
      // upsert, not a duplicate row).
      { unique: true, fields: ["swiper_id", "swiped_id"] },
      // Index for swiped_id to prevent full table scans on incoming likes
      {
        name: "swipes_swiped_id_idx",
        fields: ["swiped_id"]
      },
      // Index for incoming likes searches
      {
        name: "swipes_swiped_id_direction_expired_idx",
        fields: ["swiped_id", "direction", "expired_at"],
        where: { expired_at: null }
      }
    ],
  }
);

module.exports = Swipe;


export {};
