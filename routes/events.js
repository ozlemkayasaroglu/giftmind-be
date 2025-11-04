const express = require("express");
const router = express.Router();

// Helper functions
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

// GET /api/events/:personaId - Get events for a persona
router.get("/:personaId", async (req, res) => {
  try {
    const { personaId } = req.params;

    // First verify persona ownership (using public schema now)
    const { data: persona, error: personaError } = await req.supabase
      .from("personas")
      .select("id")
      .eq("id", personaId)
      .eq("user_id", req.user.id)
      .single();

    if (personaError || !persona) {
      return res.status(404).json({
        success: false,
        message: "Persona not found",
      });
    }

    // TODO: Events table needs to be migrated to public schema
    // For now, return empty array to prevent frontend errors
    console.log(
      `📝 Events requested for persona ${personaId} - returning empty array (table not migrated yet)`
    );

    res.status(200).json({
      success: true,
      data: [], // Empty array until events table is migrated
      message:
        "Events feature temporarily unavailable - table migration pending",
    });
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// POST /api/events/:personaId - Create new event for a persona
router.post("/:personaId", async (req, res) => {
  try {
    const { personaId } = req.params;
    const { title, details, category, type, tags, occurred_at } =
      req.body || {};

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    // Verify persona ownership
    const { data: persona, error: personaError } = await req.supabase
      .schema("private")
      .from("personas")
      .select("id")
      .eq("id", personaId)
      .eq("user_id", req.user.id)
      .single();

    if (personaError || !persona) {
      return res.status(404).json({
        success: false,
        message: "Persona not found",
      });
    }

    // Prepare event data
    const eventData = {
      persona_id: personaId,
      user_id: req.user.id,
      title: title.trim(),
      details: details?.trim() || null,
      category: category?.trim() || null,
      type: type?.trim() || null,
      tags: toArray(tags),
      occurred_at: occurred_at || null,
    };

    const { data, error } = await req.supabase
      .schema("private")
      .from("persona_events")
      .insert([eventData])
      .select("*")
      .single();

    if (error) {
      console.error("Create event error:", error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data,
    });
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// PUT /api/events/:eventId - Update an event
router.put("/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, details, category, type, tags, occurred_at } =
      req.body || {};

    const patch = {};
    if (title !== undefined) patch.title = title?.trim() || null;
    if (details !== undefined) patch.details = details?.trim() || null;
    if (category !== undefined) patch.category = category?.trim() || null;
    if (type !== undefined) patch.type = type?.trim() || null;
    if (tags !== undefined) patch.tags = toArray(tags);
    if (occurred_at !== undefined) patch.occurred_at = occurred_at || null;

    const { data, error } = await req.supabase
      .schema("private")
      .from("persona_events")
      .update(patch)
      .eq("id", eventId)
      .eq("user_id", req.user.id)
      .select("*")
      .single();

    if (error) {
      console.error("Update event error:", error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data,
    });
  } catch (error) {
    console.error("Update event error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// DELETE /api/events/:eventId - Delete an event
router.delete("/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;

    const { error } = await req.supabase
      .schema("private")
      .from("persona_events")
      .delete()
      .eq("id", eventId)
      .eq("user_id", req.user.id);

    if (error) {
      console.error("Delete event error:", error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
