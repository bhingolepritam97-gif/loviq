const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const TrustedContact = sequelize.define(
  "TrustedContact",
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
    contactName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "contact_name",
    },
    contactPhone: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "contact_phone",
    },
  },
  {
    tableName: "trusted_contacts",
    underscored: true,
    timestamps: true,
  }
);

module.exports = TrustedContact;

export {};
