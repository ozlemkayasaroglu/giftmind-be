const express = require("express");
const router = express.Router();

// All endpoints here expect req.supabase and req.user set by verifyAuth (index.js)

function normalizeId(id) {
  // UUID-friendly: always return trimmed string
  if (id === null || id === undefined) return id;
  return String(id).trim();
}

async function ensurePersonaOwnership(req, res, next) {
  try {
    const rawId = req.params.id || req.params.personaId || req.body?.persona_id;
    if (!rawId)
      return res
        .status(400)
        .json({ success: false, message: "persona_id is required" });
    const personaId = normalizeId(rawId);

    const { data: persona, error } = await req.supabase
      .schema('private')
      .from("personas")
      .select("id")
      .eq("id", personaId)
      .eq("user_id", req.user.id)
      .single();

    if (error || !persona) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Persona not found or not accessible",
        });
    }
    next();
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: "Persona ownership check failed" });
  }
}

// List events for a persona
router.get("/personas/:id/events", ensurePersonaOwnership, async (req, res) => {
  try {
    const personaId = normalizeId(req.params.id);
    const { data, error } = await req.supabase
      .schema('private')
      .from("persona_events")
      .select("*")
      .eq("persona_id", personaId)
      .order("occurred_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error)
      return res.status(400).json({ success: false, message: error.message });
    return res.json({ success: true, events: data || [] });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch events" });
  }
});

// Create event for a persona (schema: title, details, category, type, occurred_at, user_id)
router.post(
  "/personas/:id/events",
  ensurePersonaOwnership,
  async (req, res) => {
    try {
      const personaId = normalizeId(req.params.id);
      const { title, details, occurred_at, category, type } = req.body || {};

      if (!title)
        return res
          .status(400)
          .json({ success: false, message: "title is required" });

      const row = {
        persona_id: personaId,
        user_id: req.user.id,
        title,
        details: details ?? null,
        occurred_at: occurred_at || null,
        category: category ?? null,
        type: type ?? null,
        is_active: true,
      };

      const { data, error } = await req.supabase
        .schema('private')
        .from("persona_events")
        .insert([row])
        .select("*")
        .single();

      if (error)
        return res.status(400).json({ success: false, message: error.message });
      return res.json({ success: true, event: data });
    } catch (e) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to create event" });
    }
  }
);

// Update event (allow editing title, details, category, type, occurred_at, is_active)
router.put("/events/:eid", async (req, res) => {
  try {
    const eid = normalizeId(req.params.eid);

    const allowed = [
      "title",
      "details",
      "category",
      "type",
      "occurred_at",
      "is_active",
    ];
    const patch = {};
    for (const k of allowed) {
      if (k in req.body) patch[k] = req.body[k];
    }
    // Do not allow persona_id or user_id changes

    const { data, error } = await req.supabase
      .schema('private')
      .from("persona_events")
      .update(patch)
      .eq("id", eid)
      .select("*")
      .single();

    if (error)
      return res.status(400).json({ success: false, message: error.message });
    return res.json({ success: true, event: data });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to update event" });
  }
});

// Delete event
router.delete("/events/:eid", async (req, res) => {
  try {
    const eid = normalizeId(req.params.eid);
    const { error } = await req.supabase
      .schema('private')
      .from("persona_events")
      .delete()
      .eq("id", eid);

    if (error)
      return res.status(400).json({ success: false, message: error.message });
    return res.json({ success: true, message: "Deleted" });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete event" });
  }
});

module.exports = router;
