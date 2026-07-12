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
    ],
  }
);

module.exports = Swipe;
