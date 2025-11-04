const express = require("express");
const router = express.Router();

// Helper to coerce array-like fields
function toArray(val) {
  if (Array.isArray(val))
    return val.filter((v) => v !== undefined && v !== null);
  if (typeof val === "string")
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}

function toIntOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = parseInt(String(v).replace(/[^\d-]/g, ""), 10);
  return Number.isNaN(n) ? null : n;
}

// Map DB row to frontend format
function mapPersonaRow(row) {
  if (!row) return row;
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    role: row.role,
    goals: row.goals,
    challenges: row.challenges,
    description: row.description,
    interests: row.interests || [],
    personality_traits: row.personality_traits || [],
    budget_min: row.budget_min,
    budget_max: row.budget_max,
    behavioral_insights: row.behavioral_insights,
    notes: row.notes,
    birth_date: row.birth_date,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
    metadata: row.metadata || {},
    // Frontend aliases
    budgetMin: row.budget_min,
    budgetMax: row.budget_max,
    birthDate: row.birth_date,
    personalityTraits: row.personality_traits || [],
  };
}

// GET /api/personas - Get all personas for authenticated user
router.get("/", async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("personas")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get personas error:", error);
      return res.status(400).json({ success: false, message: error.message });
    }

    const personas = (data || []).map((p) => mapPersonaRow(p));
    res.status(200).json({ success: true, personas });
  } catch (error) {
    console.error("Get personas error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// POST /api/personas - Create new persona
router.post("/", async (req, res) => {
  try {
    console.log(
      "📥 POST /api/personas - Request Body:",
      JSON.stringify(req.body, null, 2)
    );

    const {
      name,
      role,
      goals,
      challenges,
      description,
      interests,
      personality_traits,
      personalityTraits, // camelCase alias
      budget_min,
      budget_max,
      budgetMin, // camelCase alias
      budgetMax, // camelCase alias
      behavioral_insights,
      behavioralInsights, // camelCase alias
      notes,
      birth_date,
      birthDate, // camelCase alias
      metadata,
    } = req.body || {};

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    // Prepare persona data matching exact table structure
    const personaData = {
      user_id: req.user.id,
      name: name.trim(),
      role: role || null,
      goals: goals || null,
      challenges: challenges || null,
      description: description || null,
      interests: toArray(interests),
      personality_traits: toArray(personality_traits || personalityTraits),
      budget_min: toIntOrNull(budget_min || budgetMin),
      budget_max: toIntOrNull(budget_max || budgetMax),
      behavioral_insights: behavioral_insights || behavioralInsights || null,
      notes: notes || null,
      birth_date: birth_date || birthDate || null,
      is_active: true,
      metadata: metadata || {},
    };

    console.log(
      "💾 Final personaData for DB:",
      JSON.stringify(personaData, null, 2)
    );

    const { data, error } = await req.supabase
      .from("personas")
      .insert([personaData])
      .select("*")
      .single();

    if (error) {
      console.error("Create persona error:", error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(201).json({
      success: true,
      message: "Persona created successfully",
      persona: mapPersonaRow(data),
    });
  } catch (error) {
    console.error("Create persona error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// GET /api/personas/:id - Get specific persona
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await req.supabase
      .from("personas")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single();

    if (error) {
      console.error("Get persona error:", error);
      return res
        .status(404)
        .json({ success: false, message: "Persona not found" });
    }

    res.status(200).json({ success: true, persona: mapPersonaRow(data) });
  } catch (error) {
    console.error("Get persona error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// PUT /api/personas/:id - Update persona
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      role,
      goals,
      challenges,
      description,
      interests,
      personality_traits,
      personalityTraits, // camelCase alias
      budget_min,
      budget_max,
      budgetMin, // camelCase alias
      budgetMax, // camelCase alias
      behavioral_insights,
      behavioralInsights, // camelCase alias
      notes,
      birth_date,
      birthDate, // camelCase alias
      is_active,
      isActive, // camelCase alias
      metadata,
    } = req.body;

    const updateData = {};

    // Only update fields that are provided
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (goals !== undefined) updateData.goals = goals;
    if (challenges !== undefined) updateData.challenges = challenges;
    if (description !== undefined) updateData.description = description;
    if (interests !== undefined) updateData.interests = toArray(interests);
    if (personality_traits !== undefined || personalityTraits !== undefined) {
      updateData.personality_traits = toArray(
        personality_traits || personalityTraits
      );
    }
    if (budget_min !== undefined || budgetMin !== undefined) {
      updateData.budget_min = toIntOrNull(budget_min || budgetMin);
    }
    if (budget_max !== undefined || budgetMax !== undefined) {
      updateData.budget_max = toIntOrNull(budget_max || budgetMax);
    }
    if (behavioral_insights !== undefined || behavioralInsights !== undefined) {
      updateData.behavioral_insights =
        behavioral_insights || behavioralInsights;
    }
    if (notes !== undefined) updateData.notes = notes;
    if (birth_date !== undefined || birthDate !== undefined) {
      updateData.birth_date = birth_date || birthDate;
    }
    if (is_active !== undefined || isActive !== undefined) {
      updateData.is_active = is_active !== undefined ? is_active : isActive;
    }
    if (metadata !== undefined) updateData.metadata = metadata;

    // Always update the updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await req.supabase
      .from("personas")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select("*")
      .single();

    if (error) {
      console.error("Update persona error:", error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Persona not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Persona updated successfully",
      persona: mapPersonaRow(data),
    });
  } catch (error) {
    console.error("Update persona error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// DELETE /api/personas/:id - Delete persona
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await req.supabase
      .from("personas")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) {
      console.error("Delete persona error:", error);
      return res.status(400).json({ success: false, message: error.message });
    }

    res
      .status(200)
      .json({ success: true, message: "Persona deleted successfully" });
  } catch (error) {
    console.error("Delete persona error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
