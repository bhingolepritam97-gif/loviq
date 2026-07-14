const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Links this row to the Firebase Auth user (uid from the verified ID token).
    firebaseUid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: "firebase_uid",
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: false,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    birthdate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    genderPreference: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      field: "gender_preference",
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: { len: [0, 500] },
    },
    // PostGIS geography point for distance queries (ST_DWithin, etc.)
    location: {
      type: DataTypes.GEOGRAPHY("POINT", 4326),
      allowNull: true,
    },
    interests: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
    profileCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "profile_completed",
    },
    lastActiveAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "last_active_at",
    },
    expoPushToken: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "expo_push_token",
    },
    isPremium: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_premium",
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_verified",
    },
    cityName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "city_name",
    },
    hideDistance: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "hide_distance",
    },
  },
  {
    tableName: "users",
    underscored: true,
    timestamps: true,
    indexes: [
      {
        name: 'users_location_gist',
        fields: ['location'],
        using: 'GIST',
      },
    ],
  }
);

module.exports = User;
