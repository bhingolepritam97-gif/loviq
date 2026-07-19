const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const UserPromptAnswer = sequelize.define(
  "UserPromptAnswer",
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
    promptId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "prompt_id",
    },
    answerText: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "answer_text",
    },
    audioUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "audio_url",
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "display_order",
    }
  },
  {
    tableName: "user_prompt_answers",
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "prompt_id"]
      }
    ]
  }
);

module.exports = UserPromptAnswer;

export {};
