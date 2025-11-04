const express = require("express");
// Removed unused supabase/createClient; rely on index.js verifyAuth to set req.supabase & req.user
const router = express.Router();
const {
  parseBudgetFromBody,
  applyBudgetToData,
  normalizeBudgetFields,
} = require("../utils/personaBudget");

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

// Map DB row -> camelCase + aliases used by frontend
function mapPersonaRow(row) {
  if (!row) return row;
  const nb = normalizeBudgetFields(row);
  return {
    ...nb,
    ageMin: nb.age_min ?? null,
    ageMax: nb.age_max ?? null,
    budgetMin: nb.budget_min ?? null,
    budgetMax: nb.budget_max ?? null,
    interestsInput: nb.interests_raw ?? null,
    behavioralInsights: nb.behavioral_insights ?? null,
    notesText: nb.notes_text ?? null,
    // aliases
    preferences: Array.isArray(nb.interests) ? nb.interests : [],
    goals: nb.goals ?? null,
    challenges: nb.challenges ?? null,
    role: nb.role ?? null,
    description: nb.description ?? null,
    notes: Array.isArray(nb.notes) ? nb.notes : nb.notes ? [nb.notes] : [],
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

// POST /api/personas - Create new persona (aligned with PersonaForm)
router.post("/", async (req, res) => {
  try {
    // Debug: Log incoming request body
    console.log("📥 Incoming request body:", JSON.stringify(req.body, null, 2));

    const {
      name,
      birth_date,
      birthDate, // PersonaForm uses camelCase
      interests,
      notes,
      description,
      // Additional form fields
      role,
      ageMin,
      ageMax,
      goals,
      challenges,
      interestsInput,
      behavioralInsights,
      budgetMin,
      budgetMax,
    } = req.body || {};

    // Debug: Log extracted values
    console.log("🔍 Extracted values:", {
      name,
      birthDate,
      interests,
      notes,
      description,
      role,
      ageMin,
      ageMax,
      goals,
      challenges,
      interestsInput,
      behavioralInsights,
      budgetMin,
      budgetMax,
    });

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    }

    // Prepare persona data - support both snake_case and camelCase
    let personaData = {
      user_id: req.user.id,
      name,
      birth_date: birth_date || birthDate || null, // Support both formats
      interests: toArray(interests),
      notes: Array.isArray(notes) ? notes : toArray(notes),
      // PersonaForm notes -> description mapping
      description: description || (typeof notes === "string" ? notes : null),
      notes_text: typeof notes === "string" ? notes : null,
      // Additional fields - PersonaForm'dan gelmeyebilir, o yüzden null bırak
      role: role || null,
      age_min: toIntOrNull(ageMin),
      age_max: toIntOrNull(ageMax),
      goals: goals || null,
      challenges: challenges || null,
      interests_raw: interestsInput || null,
      behavioral_insights: behavioralInsights || null,
    };

    // Budget: support budgetMin/budgetMax in addition to existing shapes
    const budgetParsed = parseBudgetFromBody({
      ...req.body,
      budget_min: budgetMin,
      budget_max: budgetMax,
    });
    personaData = await applyBudgetToData(
      personaData,
      budgetParsed.min,
      budgetParsed.max
    );

    const { data, error } = await req.supabase
      .from("personas")
      .insert([personaData])
      .select("*")
      .single();

    if (error) {
      console.error("Create persona error:", error);
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(201).json({
      success: true,
      message: "Persona created successfully",
      persona: mapPersonaRow(data),
    });
  } catch (error) {
    console.error("Create persona error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
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

// PUT /api/personas/:id - Update persona (aligned with Create a Persona form)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const patch = {};
    // Map simple text fields
    const textFields = {
      name: "name",
      birth_date: "birth_date",
      birthDate: "birth_date", // Support camelCase from PersonaForm
      goals: "goals",
      challenges: "challenges",
      description: "description",
      role: "role",
      interestsInput: "interests_raw",
      behavioralInsights: "behavioral_insights",
    };

    Object.entries(textFields).forEach(([from, to]) => {
      if (from in req.body) patch[to] = req.body[from] ?? null;
    });

    // Age min/max
    if ("ageMin" in req.body) patch.age_min = toIntOrNull(req.body.ageMin);
    if ("ageMax" in req.body) patch.age_max = toIntOrNull(req.body.ageMax);

    // Arrays
    if ("interests" in req.body) patch.interests = toArray(req.body.interests);
    if ("notes" in req.body && Array.isArray(req.body.notes))
      patch.notes = req.body.notes;

    // PersonaForm notes handling - map to both description and notes_text
    if (typeof req.body.notes === "string") {
      patch.notes_text = req.body.notes;
      if (!req.body.description) patch.description = req.body.notes; // PersonaForm notes -> description
    }
    if (typeof req.body.notes_text === "string")
      patch.notes_text = req.body.notes_text;

    // Budget
    const { min, max } = parseBudgetFromBody(req.body);
    if (min !== null) patch.budget_min = min;
    if (max !== null) patch.budget_max = max;

    const { data, error } = await req.supabase
      .from("personas")
      .update(patch)
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select("*")
      .single();

    if (error) {
      console.error("Update persona error:", error);
      return res.status(400).json({ success: false, message: error.message });
    }

    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: "Persona not found" });
    }

    res.status(200).json({
      success: true,
      message: "Persona updated successfully",
      persona: mapPersonaRow(data),
    });
  } catch (error) {
    console.error("Update persona error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
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
