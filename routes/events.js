const express = require("express");
const router = express.Router();

// All endpoints here expect req.supabase and req.user set by verifyAuth (index.js)

function normalizeId(id) {
  if (id === null || id === undefined) return id;
  const s = String(id).trim();
  return /^\d+$/.test(s) ? Number(s) : s;
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

// Create event for a persona (schema: event_type, title, description, occurred_at, source, metadata, is_active)
router.post(
  "/personas/:id/events",
  ensurePersonaOwnership,
  async (req, res) => {
    try {
      const personaId = normalizeId(req.params.id);
      const {
        title,
        description,
        event_type,
        occurred_at,
        source,
        metadata,
        is_active,
      } = req.body || {};

      if (!title)
        return res
          .status(400)
          .json({ success: false, message: "title is required" });
      if (!event_type)
        return res
          .status(400)
          .json({ success: false, message: "event_type is required" });

      let meta = metadata;
      if (typeof meta === "string") {
        try {
          meta = JSON.parse(meta);
        } catch {
          meta = {};
        }
      }

      const row = {
        persona_id: personaId,
        event_type,
        title,
        description: description ?? null,
        occurred_at: occurred_at || null,
        source: source ?? null,
        metadata: meta ?? {},
        is_active: typeof is_active === "boolean" ? is_active : true,
      };

      const { data, error } = await req.supabase
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

// Update event
router.put("/events/:eid", async (req, res) => {
  try {
    const eid = normalizeId(req.params.eid);

    let patch = { ...req.body };
    delete patch.persona_id; // Do not allow moving events between personas here

    if (typeof patch.metadata === "string") {
      try {
        patch.metadata = JSON.parse(patch.metadata);
      } catch {
        delete patch.metadata;
      }
    }

    const { data, error } = await req.supabase
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
