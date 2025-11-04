const express = require("express");
const { getPersonalityTraits } = require("../constants/personalityTraits");
const router = express.Router();

// GET /api/personality-traits - Kişilik özelliklerini getir
router.get("/", (req, res) => {
  try {
    const traits = getPersonalityTraits();
    res.status(200).json(traits);
  } catch (error) {
    console.error("Get personality traits error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// GET /api/personality-traits/categories - Sadece kategorileri getir
router.get("/categories", (req, res) => {
  try {
    const { byCategory } = getPersonalityTraits().data;
    res.status(200).json({
      success: true,
      data: byCategory,
    });
  } catch (error) {
    console.error("Get personality categories error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// GET /api/personality-traits/all - Sadece düz liste
router.get("/all", (req, res) => {
  try {
    const { all } = getPersonalityTraits().data;
    res.status(200).json({
      success: true,
      data: all,
    });
  } catch (error) {
    console.error("Get all personality traits error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
