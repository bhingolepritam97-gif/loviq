const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Message = sequelize.define(
    "Message",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      matchId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "match_id",
      },
      senderId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "sender_id",
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "is_read",
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "read_at",
      },
      scamWarningTriggered: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "scam_warning_triggered",
      },
    },
    {
      tableName: "messages",
      underscored: true,
      timestamps: true,
      indexes: [
        {
          fields: ["match_id", "created_at"],
        },
      ],
    }
  );

  return Message;
};

export {};
