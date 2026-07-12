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
  },
  {
    tableName: "matches",
    underscored: true,
    timestamps: true,
    indexes: [{ unique: true, fields: ["user_a_id", "user_b_id"] }],
  }
);

module.exports = Match;
