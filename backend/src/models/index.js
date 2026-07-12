const sequelize = require("../config/db");
const User = require("./user");
const Photo = require("./photo");
const Swipe = require("./swipe");
const Match = require("./match");
const Message = require("./message")(sequelize);
const Block = require("./block");
const Report = require("./report");

// --- Associations ---
User.hasMany(Photo, { foreignKey: "userId", as: "photos", onDelete: "CASCADE" });
Photo.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Swipe, { foreignKey: "swiperId", as: "swipesGiven" });
User.hasMany(Swipe, { foreignKey: "swipedId", as: "swipesReceived" });
Swipe.belongsTo(User, { foreignKey: "swiperId", as: "swiper" });
Swipe.belongsTo(User, { foreignKey: "swipedId", as: "swiped" });

User.hasMany(Match, { foreignKey: "userAId", as: "matchesAsA" });
User.hasMany(Match, { foreignKey: "userBId", as: "matchesAsB" });
Match.belongsTo(User, { foreignKey: "userAId", as: "userA" });
Match.belongsTo(User, { foreignKey: "userBId", as: "userB" });

Match.hasMany(Message, { foreignKey: "matchId", as: "messages", onDelete: "CASCADE" });
Message.belongsTo(Match, { foreignKey: "matchId" });
User.hasMany(Message, { foreignKey: "senderId", as: "messagesSent" });
Message.belongsTo(User, { foreignKey: "senderId", as: "sender" });

User.hasMany(Block, { foreignKey: "blockerId", as: "blocksGiven" });
User.hasMany(Block, { foreignKey: "blockedId", as: "blocksReceived" });
Block.belongsTo(User, { foreignKey: "blockerId", as: "blocker" });
Block.belongsTo(User, { foreignKey: "blockedId", as: "blocked" });

User.hasMany(Report, { foreignKey: "reporterId", as: "reportsGiven" });
User.hasMany(Report, { foreignKey: "reportedId", as: "reportsReceived" });
Report.belongsTo(User, { foreignKey: "reporterId", as: "reporter" });
Report.belongsTo(User, { foreignKey: "reportedId", as: "reported" });

module.exports = { sequelize, User, Photo, Swipe, Match, Message, Block, Report };
