const { Prompt, UserPromptAnswer, User, Photo } = require("../models");
const { sequelize } = require("../models");

// GET /prompts
async function getPrompts(req, res) {
  try {
    const prompts = await Prompt.findAll({
      where: { isActive: true },
      order: [["category", "ASC"], ["createdAt", "DESC"]]
    });

    // Group prompts by category
    const grouped = prompts.reduce((acc, p) => {
      if (!acc[p.category]) acc[p.category] = [];
      acc[p.category].push({
        id: p.id,
        questionText: p.questionText,
        language: p.language
      });
      return acc;
    }, {});

    res.json({ success: true, categories: grouped });
  } catch (error) {
    console.error("[promptsController] getPrompts error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch prompts" });
  }
}

// POST /prompts/answers
// Request body: { answers: [{ promptId: "uuid", answerText: "...", displayOrder: 0 }] }
async function saveAnswers(req, res) {
  const user = req.dbUser;
  const { answers } = req.body;

  if (!Array.isArray(answers)) {
    return res.status(400).json({ success: false, error: "answers must be an array" });
  }

  if (answers.length > 3) {
    return res.status(400).json({ success: false, error: "Maximum 3 prompts allowed" });
  }

  try {
    await sequelize.transaction(async (t) => {
      // 1. Delete all existing answers for this user
      await UserPromptAnswer.destroy({ where: { userId: user.id }, transaction: t });

      // 2. Insert new answers
      if (answers.length > 0) {
        const payload = answers.map((a, index) => ({
          userId: user.id,
          promptId: a.promptId,
          answerText: a.answerText,
          displayOrder: a.displayOrder !== undefined ? a.displayOrder : index
        }));
        await UserPromptAnswer.bulkCreate(payload, { transaction: t });
      }
    });

    // 3. Re-evaluate profile completion gate
    const refreshed = await User.findByPk(user.id, {
      include: [
        { model: Photo, as: "photos" },
        { model: UserPromptAnswer, as: "promptAnswers", include: [{ model: Prompt, as: "prompt" }] }
      ]
    });

    const hasBasicFields = refreshed.name && refreshed.birthdate && refreshed.gender;
    const hasEnoughPhotos = refreshed.photos.length === 6;
    const hasEnoughPrompts = refreshed.promptAnswers.length === 3;
    
    // Check if the 3 prompts span at least 2 categories
    const categories = new Set(refreshed.promptAnswers.map(pa => pa.prompt?.category).filter(Boolean));
    const hasDiversePrompts = categories.size >= 2;

    const shouldBeComplete = hasBasicFields && hasEnoughPhotos && hasEnoughPrompts && hasDiversePrompts;

    if (shouldBeComplete !== refreshed.profileCompleted) {
      await refreshed.update({ profileCompleted: shouldBeComplete });
    }

    res.json({ success: true, profileCompleted: shouldBeComplete, answers: refreshed.promptAnswers });
  } catch (error) {
    console.error("[promptsController] saveAnswers error:", error);
    res.status(500).json({ success: false, error: "Failed to save answers" });
  }
}

module.exports = {
  getPrompts,
  saveAnswers
};

export {};
