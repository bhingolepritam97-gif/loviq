const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Prompt = sequelize.define(
  "Prompt",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    questionText: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "question_text",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
    language: {
      type: DataTypes.STRING,
      defaultValue: "en",
    }
  },
  {
    tableName: "prompts",
    underscored: true,
    timestamps: true,
  }
);

module.exports = Prompt;


export {};
