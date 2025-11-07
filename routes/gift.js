const express = require("express");
// const supabase = require('../config/supabaseClient'); // no longer used for DB queries
const {
  generateGiftIdeas,
  getGiftCategories,
} = require("../services/aiGiftRecommender");
const router = express.Router();

// NOTE: Authentication is handled globally in index.js (verifyAuth)
// req.user and req.supabase (with db schema 'private') are available here

// POST /api/gift/recommend - Generate gift recommendations for a persona
router.post("/recommend", async (req, res) => {
  try {
    const { personaId } = req.body;

    if (!personaId) {
      return res
        .status(400)
        .json({ success: false, message: "Persona ID is required" });
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(personaId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid persona ID format" });
    }

    // Fetch persona from Supabase (private schema)
    const { data: persona, error } = await req.supabase
      .schema("private")
      .from("personas")
      .select("*")
      .eq("id", personaId)
      .eq("user_id", req.user.id)
      .single();

    if (error) {
      console.error("Fetch persona error:", error);
      return res.status(404).json({
        success: false,
        message: "Persona not found or you do not have access to it",
      });
    }

    if (!persona) {
      return res
        .status(404)
        .json({ success: false, message: "Persona not found" });
    }

    // Debug: Log persona data to identify missing name issue
    console.log("🎁 Generating gift ideas for persona:", personaId);
    console.log("📋 Persona data:", {
      id: persona.id,
      name: persona.name,
      hasName: !!persona.name,
      keys: Object.keys(persona),
      fullPersona: persona,
    });

    // Validate persona has some identifier (name or role)
    if (!persona.name && !persona.role) {
      console.error("❌ Persona name and role are both missing:", persona);
      return res.status(400).json({
        success: false,
        message:
          "Persona must have either a name or role for gift recommendations",
        debug: {
          personaId,
          personaKeys: Object.keys(persona),
          hasName: !!persona.name,
          hasRole: !!persona.role,
        },
      });
    }

    // Use name or role as fallback
    if (!persona.name || persona.name.trim() === "") {
      console.warn(
        "⚠️ Persona name is empty, using role as fallback:",
        persona.role
      );
      persona.name = persona.role || "Kişi";
    }

    const giftRecommendations = await generateGiftIdeas(persona);

    if (!giftRecommendations.success) {
      console.error("Gift generation error:", giftRecommendations.error);
      return res.status(500).json({
        success: false,
        message: "Failed to generate gift recommendations",
        error: giftRecommendations.error,
      });
    }

    // Save recommendations to database (optional - don't fail if this fails)
    const savedRecommendations = [];
    try {
      for (const rec of giftRecommendations.recommendations || []) {
        const title =
          typeof rec === "string" ? rec : rec?.title || rec?.name || "";
        const reason = typeof rec === "object" ? rec?.reason : null;
        const confidence = typeof rec === "object" ? rec?.confidence : 80;

        if (title) {
          const { data: savedRec, error: saveError } = await req.supabase
            .from("gift_recommendations")
            .insert([
              {
                user_id: req.user.id,
                persona_id: personaId,
                title: title,
                reason: reason,
                confidence: confidence,
                ai_generated: giftRecommendations.aiGenerated || false,
                model_used: "gemini-2.5-flash",
                metadata: {
                  age: giftRecommendations.age,
                  ageCategory: giftRecommendations.ageCategory,
                  generatedAt: giftRecommendations.generatedAt,
                },
              },
            ])
            .select("*")
            .single();

          if (!saveError && savedRec) {
            savedRecommendations.push(savedRec);
          } else if (saveError) {
            console.warn("Failed to save recommendation:", saveError.message);
          }
        }
      }
    } catch (saveErr) {
      console.error("Error saving recommendations to DB:", saveErr);
      // Continue anyway - we still have the recommendations
    }

    const suggestionTitles = (giftRecommendations.recommendations || [])
      .map((r) => (typeof r === "string" ? r : r?.title || r?.name || ""))
      .filter(Boolean);

    res.status(200).json({
      success: true,
      message: "Gift recommendations generated and saved successfully",
      persona: {
        id: persona.id,
        name: persona.name,
        age: giftRecommendations.age,
        ageCategory: giftRecommendations.ageCategory,
      },
      recommendations: giftRecommendations.recommendations,
      savedRecommendations: savedRecommendations,
      data: suggestionTitles,
      suggestions: suggestionTitles,
      metadata: {
        totalOptions: giftRecommendations.totalOptions,
        generatedAt: giftRecommendations.generatedAt,
        savedCount: savedRecommendations.length,
        userId: req.user.id,
        personaInterests: persona.interests || [],
        personaNotes: persona.notes || [],
      },
    });
  } catch (error) {
    console.error("Gift recommendation error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while generating gift recommendations",
    });
  }
});

// POST /api/gift/batch-recommend - Generate gift recommendations for multiple personas
router.post("/batch-recommend", async (req, res) => {
  try {
    const { personaIds } = req.body;

    if (!personaIds || !Array.isArray(personaIds) || personaIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Persona IDs array is required and must not be empty",
      });
    }

    if (personaIds.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Maximum 10 personas allowed per batch request",
      });
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    for (const id of personaIds) {
      if (!uuidRegex.test(id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid persona ID format: ${id}`,
        });
      }
    }

    const { data: personas, error } = await req.supabase
      .schema("private")
      .from("personas")
      .select("*")
      .in("id", personaIds)
      .eq("user_id", req.user.id);

    if (error) {
      console.error("Fetch personas error:", error);
      return res.status(400).json({
        success: false,
        message: "Error fetching personas from database",
      });
    }

    if (!personas || personas.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No personas found or you do not have access to them",
      });
    }

    const results = [];
    const errors = [];

    for (const persona of personas) {
      try {
        const giftRecommendations = await generateGiftIdeas(persona);
        if (giftRecommendations.success) {
          results.push({
            persona: {
              id: persona.id,
              name: persona.name,
              age: giftRecommendations.age,
              ageCategory: giftRecommendations.ageCategory,
            },
            recommendations: giftRecommendations.recommendations,
            metadata: {
              totalOptions: giftRecommendations.totalOptions,
              generatedAt: giftRecommendations.generatedAt,
            },
          });
        } else {
          errors.push({
            personaId: persona.id,
            personaName: persona.name,
            error:
              giftRecommendations.error || "Failed to generate recommendations",
          });
        }
      } catch (e) {
        errors.push({
          personaId: persona.id,
          personaName: persona.name,
          error: e.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Generated recommendations for ${results.length} out of ${personas.length} personas`,
      results,
      errors,
      summary: {
        totalRequested: personaIds.length,
        totalFound: personas.length,
        totalSuccess: results.length,
        totalErrors: errors.length,
      },
    });
  } catch (error) {
    console.error("Batch gift recommendation error:", error);
    res.status(500).json({
      success: false,
      message:
        "Internal server error while generating batch gift recommendations",
    });
  }
});

// GET /api/gift/recommendations/:personaId - Get saved recommendations for a persona
router.get("/recommendations/:personaId", async (req, res) => {
  try {
    const { personaId } = req.params;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(personaId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid persona ID format" });
    }

    const { data: recommendations, error } = await req.supabase
      .from("gift_recommendations")
      .select("*")
      .eq("persona_id", personaId)
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch recommendations error:", error);
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(200).json({
      success: true,
      recommendations: recommendations || [],
      total: recommendations?.length || 0,
    });
  } catch (error) {
    console.error("Get saved recommendations error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// GET /api/gift/categories - Get available gift categories
router.get("/categories", async (req, res) => {
  try {
    const categories = getGiftCategories();
    res.status(200).json({
      success: true,
      message: "Gift categories retrieved successfully",
      categories,
      total: categories.length,
    });
  } catch (error) {
    console.error("Get gift categories error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while retrieving gift categories",
    });
  }
});

// GET /api/gift/stats - Get gift recommendation statistics for user
router.get("/stats", async (req, res) => {
  try {
    const { data: personas, error } = await req.supabase
      .schema("private")
      .from("personas")
      .select("id, name, interests, notes, created_at")
      .eq("user_id", req.user.id);

    if (error) {
      console.error("Fetch personas for stats error:", error);
      return res
        .status(400)
        .json({ success: false, message: "Error fetching user personas" });
    }

    const totalPersonas = personas ? personas.length : 0;
    const totalInterests = personas
      ? personas.reduce((sum, p) => sum + (p.interests?.length || 0), 0)
      : 0;
    const totalNotes = personas
      ? personas.reduce((sum, p) => sum + (p.notes?.length || 0), 0)
      : 0;

    const allInterests = personas
      ? personas.flatMap((p) => p.interests || [])
      : [];
    const interestCounts = {};
    allInterests.forEach((interest) => {
      interestCounts[interest] = (interestCounts[interest] || 0) + 1;
    });

    const popularInterests = Object.entries(interestCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([interest, count]) => ({ interest, count }));

    res.status(200).json({
      success: true,
      message: "Gift recommendation statistics retrieved successfully",
      stats: {
        totalPersonas,
        totalInterests,
        totalNotes,
        averageInterestsPerPersona:
          totalPersonas > 0
            ? Math.round((totalInterests / totalPersonas) * 100) / 100
            : 0,
        averageNotesPerPersona:
          totalPersonas > 0
            ? Math.round((totalNotes / totalPersonas) * 100) / 100
            : 0,
        popularInterests,
        availableCategories: getGiftCategories().length,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get gift stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while retrieving statistics",
    });
  }
});

module.exports = router;
