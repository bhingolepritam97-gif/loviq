const sequelize = require("../config/db");
const User = require("./user");
const Photo = require("./photo");
const Swipe = require("./swipe");
const Match = require("./match");
const Message = require("./message")(sequelize);
const Block = require("./block");
const Report = require("./report");
const InviteCode = require("./inviteCode");
const BannedIdentity = require("./bannedIdentity");
const TrustedContact = require("./trustedContact");
const DateShare = require("./dateShare");
const Config = require("./config");
const Prompt = require("./prompt");
const UserPromptAnswer = require("./userPromptAnswer");

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

User.hasMany(InviteCode, { foreignKey: "createdById", as: "invitesCreated" });
InviteCode.belongsTo(User, { foreignKey: "createdById", as: "creator" });
InviteCode.belongsTo(User, { foreignKey: "usedById", as: "usedBy" });

User.hasMany(TrustedContact, { foreignKey: "userId", as: "trustedContacts" });
TrustedContact.belongsTo(User, { foreignKey: "userId" });

User.hasMany(DateShare, { foreignKey: "userId", as: "dateShares" });
DateShare.belongsTo(User, { foreignKey: "userId" });
Match.hasMany(DateShare, { foreignKey: "matchId", as: "dateShares" });
DateShare.belongsTo(Match, { foreignKey: "matchId" });

User.hasMany(UserPromptAnswer, { foreignKey: "userId", as: "promptAnswers" });
UserPromptAnswer.belongsTo(User, { foreignKey: "userId" });
UserPromptAnswer.belongsTo(Prompt, { foreignKey: "promptId", as: "prompt" });

module.exports = { sequelize, User, Photo, Swipe, Match, Message, Block, Report, InviteCode, BannedIdentity, TrustedContact, DateShare, Config, Prompt, UserPromptAnswer };

export {};
