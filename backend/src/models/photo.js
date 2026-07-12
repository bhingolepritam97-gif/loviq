const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Photo = sequelize.define(
  "Photo",
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
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_primary",
    },
    moderationStatus: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
      field: "moderation_status",
    },
  },
  {
    tableName: "photos",
    underscored: true,
    timestamps: true,
  }
);

module.exports = Photo;
