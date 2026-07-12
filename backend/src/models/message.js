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
      read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "messages",
      underscored: true,
      timestamps: true,
    }
  );

  return Message;
};
