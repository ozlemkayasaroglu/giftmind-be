const express = require("express");
const {
  generateGiftIdeas,
  getGiftCategories,
} = require("../services/aiGiftRecommender");
const {
  parseBudgetFromBody,
  applyBudgetToData,
  normalizeBudgetFields,
} = require("../utils/personaBudget");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
const AVATAR_BUCKET = process.env.AVATAR_BUCKET || "avatars";

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

function extFromMime(mime) {
  if (!mime) return "";
  const map = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[mime] || "";
}

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function buildAvatarPath(userId, personaId, mime, original) {
  const ts = Date.now();
  const clean = (original || "").toLowerCase().replace(/[^a-z0-9_.-]/g, "");
  const ext = extFromMime(mime) || clean.split(".").pop() || "";
  const name = `${ts}-${randomId()}${ext ? "." + ext : ""}`;
  return `${AVATAR_BUCKET}/${userId}/${personaId}/${name}`.replace(/\/+/, "/");
}

function getAdminSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key)
    return createClient(url, key, { auth: { persistSession: false } });
  return null;
}

async function ensurePersonaOwnershipInline(req, personaId) {
  const { data, error } = await req.supabase
    .from("personas")
    .select("id")
    .eq("id", personaId)
    .eq("user_id", req.user.id)
    .single();
  if (error || !data) return false;
  return true;
}

// POST /api/persona - Insert persona into personas table (aligned with form)
router.post("/", async (req, res) => {
  try {
    const {
      name,
      birth_date,
      interests,
      notes,
      role,
      ageMin,
      ageMax,
      goals,
      challenges,
      description,
      interestsInput,
      behavioralInsights,
      budgetMin,
      budgetMax,
    } = req.body || {};

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    }

    let personaData = {
      user_id: req.user.id,
      name,
      birth_date: birth_date || null,
      interests: toArray(interests),
      notes: Array.isArray(notes) ? notes : toArray(notes),
      role: role ?? null,
      age_min: toIntOrNull(ageMin),
      age_max: toIntOrNull(ageMax),
      goals: goals ?? null,
      challenges: challenges ?? null,
      description: description ?? null,
      interests_raw: interestsInput ?? null,
      behavioral_insights: behavioralInsights ?? null,
      notes_text:
        typeof notes === "string"
          ? notes
          : typeof req.body?.notes_text === "string"
          ? req.body.notes_text
          : null,
    };

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
      console.error("Insert persona error:", error);
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(201).json({
      success: true,
      message: "Persona created successfully",
      persona: normalizeBudgetFields(data),
    });
  } catch (error) {
    console.error("Create persona error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// PUT /api/persona/:id - Update persona (aligned with form)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const patch = {};
    const textFields = {
      name: "name",
      birth_date: "birth_date",
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

    if ("ageMin" in req.body) patch.age_min = toIntOrNull(req.body.ageMin);
    if ("ageMax" in req.body) patch.age_max = toIntOrNull(req.body.ageMax);

    if ("interests" in req.body) patch.interests = toArray(req.body.interests);
    if ("notes" in req.body && Array.isArray(req.body.notes))
      patch.notes = req.body.notes;
    if (typeof req.body.notes === "string") patch.notes_text = req.body.notes;
    if (typeof req.body.notes_text === "string")
      patch.notes_text = req.body.notes_text;

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
      persona: normalizeBudgetFields(data),
    });
  } catch (error) {
    console.error("Update persona error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// POST /api/persona/:id/gift-ideas - Generate gift ideas for specific persona
router.post("/:id/gift-ideas", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid persona ID format",
      });
    }

    // Get persona from database
    const { data: persona, error } = await req.supabase
      .from("personas")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single();

    if (error || !persona) {
      return res.status(404).json({
        success: false,
        message: "Persona not found",
      });
    }

    // Generate gift ideas using AI service
    const giftRecommendations = await generateGiftIdeas(persona);

    if (!giftRecommendations.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate gift ideas",
        error: giftRecommendations.error,
      });
    }

    res.status(200).json({
      success: true,
      message: "Gift ideas generated successfully",
      persona: {
        id: persona.id,
        name: persona.name,
        age: giftRecommendations.age,
        ageCategory: giftRecommendations.ageCategory,
      },
      giftIdeas: giftRecommendations.recommendations,
      metadata: {
        totalOptions: giftRecommendations.totalOptions,
        generatedAt: giftRecommendations.generatedAt,
      },
    });
  } catch (error) {
    console.error("Generate gift ideas error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// GET /api/persona/gift-categories - Get available gift categories
router.get("/gift-categories", (req, res) => {
  try {
    const categories = getGiftCategories();

    res.status(200).json({
      success: true,
      categories: categories,
      total: categories.length,
    });
  } catch (error) {
    console.error("Get gift categories error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// POST /api/persona/:id/avatar — upload image (multipart/form-data, field name: file)
router.post("/:id/avatar", upload.single("file"), async (req, res) => {
  try {
    const personaId = String(req.params.id).trim();
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "file is required" });

    // ownership
    const owns = await ensurePersonaOwnershipInline(req, personaId);
    if (!owns)
      return res
        .status(404)
        .json({ success: false, message: "Persona not found" });

    // object path and upload
    const objectPath = buildAvatarPath(
      req.user.id,
      personaId,
      req.file.mimetype,
      req.file.originalname
    );

    let uploadRes;
    const admin = getAdminSupabase();
    if (admin) {
      uploadRes = await admin.storage
        .from(AVATAR_BUCKET)
        .upload(objectPath.replace(/^.*?\//, ""), req.file.buffer, {
          contentType: req.file.mimetype || "application/octet-stream",
          upsert: true,
        });
    } else {
      uploadRes = await req.supabase.storage
        .from(AVATAR_BUCKET)
        .upload(objectPath.replace(/^.*?\//, ""), req.file.buffer, {
          contentType: req.file.mimetype || "application/octet-stream",
          upsert: true,
        });
    }

    if (uploadRes.error) {
      return res
        .status(400)
        .json({ success: false, message: uploadRes.error.message });
    }

    // Save metadata to DB (is_current true -> trigger will unset others)
    const meta = {
      persona_id: personaId,
      bucket: AVATAR_BUCKET,
      object_path: objectPath,
      content_type: req.file.mimetype || null,
      bytes: req.file.size || null,
      is_current: true,
    };

    const { data: row, error: dbErr } = await req.supabase
      .schema("private")
      .from("persona_avatars")
      .insert([meta])
      .select("*")
      .single();

    if (dbErr)
      return res.status(400).json({ success: false, message: dbErr.message });

    // Optional: signed URL for preview (short lived)
    let signedUrl = null;
    const signer = admin || req.supabase; // prefer admin
    if (signer?.storage?.from) {
      const signed = await signer.storage
        .from(AVATAR_BUCKET)
        .createSignedUrl(objectPath.replace(/^.*?\//, ""), 60 * 10);
      if (!signed.error)
        signedUrl = signed.signedUrl || signed.data?.signedUrl || null;
    }

    return res.json({
      success: true,
      avatar: row,
      previewUrl: signedUrl,
      path: objectPath,
    });
  } catch (e) {
    console.error("Avatar upload error:", e);
    return res
      .status(500)
      .json({ success: false, message: "Failed to upload avatar" });
  }
});

// GET /api/persona/:id/avatar — get current avatar (with optional signed URL)
router.get("/:id/avatar", async (req, res) => {
  try {
    const personaId = String(req.params.id).trim();
    const owns = await ensurePersonaOwnershipInline(req, personaId);
    if (!owns)
      return res
        .status(404)
        .json({ success: false, message: "Persona not found" });

    const { data: row, error } = await req.supabase
      .schema("private")
      .from("persona_avatars")
      .select("*")
      .eq("persona_id", personaId)
      .eq("is_current", true)
      .single();

    if (error || !row)
      return res
        .status(404)
        .json({ success: false, message: "Avatar not found" });

    let signedUrl = null;
    const admin = getAdminSupabase();
    const signer = admin || req.supabase;
    if (signer?.storage?.from) {
      const signed = await signer.storage
        .from(AVATAR_BUCKET)
        .createSignedUrl(row.object_path.replace(/^.*?\//, ""), 60 * 10);
      if (!signed.error)
        signedUrl = signed.signedUrl || signed.data?.signedUrl || null;
    }

    return res.json({ success: true, avatar: row, previewUrl: signedUrl });
  } catch (e) {
    console.error("Get avatar error:", e);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch avatar" });
  }
});

module.exports = router;
