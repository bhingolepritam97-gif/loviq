const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Report = sequelize.define(
  "Report",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    reporterId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      field: "reporter_id"
    },
    reportedId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      field: "reported_id"
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "reviewed", "resolved"),
      defaultValue: "pending",
    },
  },
  {
    tableName: "reports",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["reporter_id", "reported_id"]
      },
      {
        name: "reports_reported_id_idx",
        fields: ["reported_id"]
      }
    ]
  }
);

module.exports = Report;


export {};
