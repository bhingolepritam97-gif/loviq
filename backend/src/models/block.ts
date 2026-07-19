const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Block = sequelize.define(
  "Block",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    blockerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      field: "blocker_id"
    },
    blockedId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      field: "blocked_id"
    },
  },
  {
    tableName: "blocks",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["blocker_id", "blocked_id"],
      },
      {
        name: "blocks_blocked_id_idx",
        fields: ["blocked_id"]
      }
    ],
  }
);

module.exports = Block;


export {};
