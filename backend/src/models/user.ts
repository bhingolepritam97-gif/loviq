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
    // Discovery filter preferences — persisted so they survive app restarts
    ageMin: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 18,
      field: "age_min",
    },
    ageMax: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 65,
      field: "age_max",
    },
    maxDistanceKm: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 80.5, // ~50 miles
      field: "max_distance_km",
    },
    profileScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: "profile_score",
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: { len: [0, 500] },
    },
    // Location stored as plain lat/lng floats (PostGIS fallback for Neon free tier)
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.FLOAT,
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
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "verified_at",
    },
    verificationStatus: {
      type: DataTypes.ENUM("unverified", "pending", "verified"),
      defaultValue: "unverified",
      field: "verification_status",
    },
    language: {
      type: DataTypes.STRING,
      defaultValue: "en",
      field: "language",
    },
    stripeCustomerId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "stripe_customer_id",
    },
    stripeSubscriptionId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "stripe_subscription_id",
    },
    subscriptionStatus: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "subscription_status",
    },
    subscriptionTrialEnd: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "subscription_trial_end",
    },
    subscriptionCurrentPeriodEnd: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "subscription_current_period_end",
    },
    subscriptionPriceLocked: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: "subscription_price_locked",
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
    womenMessageFirstEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "women_message_first_enabled",
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    exercise: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    drinking: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pets: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    starSign: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "star_sign",
    },
    anthemSong: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "anthem_song",
    },
    anthemArtist: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "anthem_artist",
    },
    tier: {
      type: DataTypes.ENUM("free", "plus", "premium"),
      defaultValue: "free",
      field: "tier",
    },
    isBanned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_banned",
    },
    banReason: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "ban_reason",
    },
    appealText: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "appeal_text",
    },
    appealStatus: {
      type: DataTypes.ENUM("none", "pending", "resolved"),
      defaultValue: "none",
      field: "appeal_status",
    },
    verifiedOnly: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "verified_only",
    },
    isTestAccount: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_test_account",
    },
    dailyLikesUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'daily_likes_used',
    },
    dailySuperLikesUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'daily_super_likes_used',
    },
    lastDailyLikeReset: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_daily_like_reset',
    },
    vibeTags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      field: 'vibe_tags',
    },
    puneNeighborhood: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'pune_neighborhood',
    },
    puneSpot: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'pune_spot',
    },
    lookingFor: {
      type: DataTypes.ENUM("Serious relationship", "Not sure yet, open to it", "Something casual"),
      allowNull: true,
      field: 'looking_for',
    },
  },
  {
    tableName: "users",
    underscored: true,
    timestamps: true,
    indexes: [
      // Index to speed up the deck query filtering
      {
        name: 'users_deck_filters_idx',
        fields: ['is_active', 'is_test_account', 'profile_completed', 'last_active_at']
      }
    ],
    hooks: {
      beforeSave: (user) => {
        if (user.changed("tier")) {
          user.isPremium = (user.tier === "premium" || user.tier === "plus");
        }
      }
    }
  }
);

module.exports = User;

export {};
