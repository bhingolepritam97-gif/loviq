const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const DateShare = sequelize.define(
  "DateShare",
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
    matchId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "match_id",
    },
    plannedTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "planned_time",
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "expires_at",
    },
  },
  {
    tableName: "date_shares",
    underscored: true,
    timestamps: true,
  }
);

module.exports = DateShare;


export {};
